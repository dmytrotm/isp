from django.db.models import Sum, Count, Q, F
from django.utils.timezone import now
from django.http import HttpResponse
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from datetime import timedelta
import csv
from io import StringIO
from rest_framework import status as http_status
from rest_framework.parsers import MultiPartParser
import io
from datetime import datetime
from django.db import transaction

from django.db.models.functions import TruncDay, TruncMonth
from django.utils import timezone

from .models import (
    User, Customer, Employee, EmployeeRole, Address, Region, 
    Service, Tariff, TariffService, ConnectionRequest, ConnectionRequestAssignment,
    Contract, Payment, Invoice, SupportTicket, NetworkUsage, Status,
    PaymentMethod, Equipment, EquipmentCategory, ContractEquipment, StatusContext,
)
from .serializers import (
    UserSerializer, UserRegisterSerializer, CustomerSerializer, EmployeeSerializer,
    AddressSerializer, RegionSerializer, ServiceSerializer, TariffSerializer,
    TariffDetailSerializer, ConnectionRequestSerializer, ContractSerializer,
    PaymentSerializer, InvoiceSerializer, SupportTicketSerializer, NetworkUsageSerializer,
    CustomerDashboardSerializer, EmployeeRoleSerializer, StatusSerializer,
    PaymentMethodSerializer, EquipmentSerializer, EquipmentCategorySerializer,
    ContractEquipmentSerializer, CustomerCreateSerializer, CustomerDetailSerializer
)

from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class IsManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.groups.filter(name='Manager').exists()

class IsSupport(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.groups.filter(name='Support').exists()

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_superuser

class EmployeeViewSet(viewsets.ViewSet):
    permission_classes = [IsAdmin]
    pagination_class = StandardResultsSetPagination

    def paginate_queryset(self, queryset):
        if hasattr(self, 'paginator') and self.paginator is not None:
            return self.paginator.paginate_queryset(queryset, self.request, view=self)
        return None
    
    def get_paginated_response(self, data):
        assert self.paginator is not None
        return self.paginator.get_paginated_response(data)
    
    def __init__(self, *args, **kwargs):
      super().__init__(*args, **kwargs)
      self.paginator = self.pagination_class()
    
    @action(detail=False, methods=['GET'], permission_classes = [IsAdmin | IsManager])
    def dashboard_stats(self, request):
        """API endpoint for dashboard statistics"""
        total_customers = Customer.objects.count()
        total_employees = Employee.objects.count()
        active_contracts = Contract.objects.filter(
            Q(end_date__gte=now()) | Q(end_date__isnull=True),
            start_date__isnull=False
        ).count()
        pending_invoices = Invoice.objects.filter(status='pending').count()
        overdue_invoices = Invoice.objects.filter(status='overdue').count()
        paid_invoices = Invoice.objects.filter(status='paid').count()
        open_tickets = SupportTicket.objects.exclude(
            status__status__in=['resolved', 'closed']
        ).count()
        
        # Monthly revenues
        this_month = now().replace(day=1)
        monthly_payments = Payment.objects.filter(
            payment_date__gte=this_month
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Latest support tickets
        latest_tickets = SupportTicket.objects.all().order_by('-created_at')[:5]
        latest_tickets_data = SupportTicketSerializer(latest_tickets, many=True).data
        
        # Latest payments
        latest_payments = Payment.objects.all().order_by('-payment_date')[:5]
        latest_payments_data = PaymentSerializer(latest_payments, many=True).data
        
        # Recent connection requests
        recent_requests = ConnectionRequest.objects.all().order_by('-created_at')[:5]
        recent_requests_data = ConnectionRequestSerializer(recent_requests, many=True).data
        
        return Response({
            'total_customers': total_customers,
            'total_employees': total_employees,
            'active_contracts': active_contracts,
            'pending_invoices': pending_invoices,
            'overdue_invoices': overdue_invoices,
            'paid_invoices': paid_invoices,
            'open_tickets': open_tickets,
            'monthly_payments': monthly_payments,
            'latest_tickets': latest_tickets_data,
            'latest_payments': latest_payments_data,
            'recent_requests': recent_requests_data,
        })
    
    @action(detail=False, methods=['GET'], permission_classes=[IsAdmin | IsManager])
    def customers(self, request):
        customers = Customer.objects.all()

        search_query = request.query_params.get('search', '')
        status_filter = request.query_params.get('status', '')

        if search_query:
            customers = customers.filter(
                Q(user__first_name__icontains=search_query) |
                Q(user__last_name__icontains=search_query) |
                Q(user__email__icontains=search_query) |
                Q(phone_number__icontains=search_query)
            )

        if status_filter:
            # Convert to integer if it's a numeric status ID
            try:
                status_id = int(status_filter)
                customers = customers.filter(status=status_id)
            except (ValueError, TypeError):
                # If conversion fails, it might be a string status name
                customers = customers.filter(status__status__iexact=status_filter)
            
        page = self.paginate_queryset(customers)
        if page is not None:
            serializer = CustomerSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = CustomerSerializer(customers, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['GET'], url_path='customer-details', permission_classes=[IsAdmin | IsManager])
    def customer_details(self, request, pk=None):
        try:
            customer = Customer.objects.get(pk=pk)
            serializer = CustomerDetailSerializer(customer)
            return Response(serializer.data)
        except Customer.DoesNotExist:
            return Response({"error": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['PUT'], permission_classes=[IsAdmin | IsManager])
    def update_customer(self, request, pk=None):
        """Update an existing customer and associated user"""
        try:
            customer = Customer.objects.get(pk=pk)
            user = customer.user
            
            # Extract user data from request
            user_data = {}
            if 'first_name' in request.data:
                user_data['first_name'] = request.data.pop('first_name')
            if 'last_name' in request.data:
                user_data['last_name'] = request.data.pop('last_name')  
            if 'email' in request.data:
                user_data['email'] = request.data.pop('email')
                
            # Update user if there's user data
            if user_data:
                user_serializer = UserSerializer(user, data=user_data, partial=True)
                if user_serializer.is_valid():
                    user_serializer.save()
                else:
                    return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # Update customer data
            serializer = CustomerSerializer(customer, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                
                # Return the updated customer with user details
                return Response(CustomerDetailSerializer(customer).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Customer.DoesNotExist:
            return Response({"error": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)
        
    @action(detail=False, methods=['POST'], permission_classes=[IsAdmin | IsManager])
    def create_customer(self, request):
        """Atomically create a new user and associated customer"""
        user_data = {}
        if 'first_name' in request.data:
            user_data['first_name'] = request.data.pop('first_name')
        if 'last_name' in request.data:
            user_data['last_name'] = request.data.pop('last_name')
        if 'email' in request.data:
            user_data['email'] = request.data.pop('email')
        if 'password' in request.data:
            user_data['password'] = request.data.pop('password')

        try:
            with transaction.atomic():
                # Step 1: Create the user
                user_serializer = UserSerializer(data=user_data)
                if user_serializer.is_valid():
                    user = user_serializer.save()
                else:
                    return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

                # Step 2: Create the customer
                request.data['user'] = user.id
                customer_serializer = CustomerSerializer(data=request.data)
                if customer_serializer.is_valid():
                    customer = customer_serializer.save()
                    return Response(CustomerDetailSerializer(customer).data, status=status.HTTP_201_CREATED)
                else:
                    # Force rollback by raising exception
                    raise ValueError(customer_serializer.errors)

        except ValueError as e:
            return Response(e.args[0], status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['GET'])
    def export_customers_csv(self, request):
        """Export customers to CSV with Cyrillic support"""
        # Create a buffer
        buffer = io.StringIO()
        
        # Write BOM for UTF-8 recognition in Excel
        buffer.write('\ufeff')
        
        customers = Customer.objects.all().select_related('user', 'status')
        
        # Create CSV writer with the buffer
        writer = csv.writer(buffer)
        
        # Write header row
        writer.writerow(['id', 'first_name', 'last_name', 'email', 'hash', 'phone_number', 'status', 'balance', 'preferred_notification'])
        
        # Write data rows
        for customer in customers:
            writer.writerow([
                customer.id,
                customer.user.first_name,
                customer.user.last_name,
                customer.user.email,
                customer.user.password,
                customer.phone_number,
                customer.status.id if customer.status else None,
                customer.balance,
                customer.preferred_notification
            ])
        
        # Create response with the buffer content
        response = HttpResponse(buffer.getvalue(), content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="customers.csv"'
    
        return response
    
    @action(detail=False, methods=['POST'], parser_classes=[MultiPartParser])
    def import_customers_csv(self, request):
        """Import customers from CSV"""
        import logging
        logger = logging.getLogger(__name__)
        logger.info("Starting customer import")
        
        if 'csv_file' not in request.FILES:
            return Response({'message': 'No CSV file provided'}, status=http_status.HTTP_400_BAD_REQUEST)
        
        csv_file = request.FILES['csv_file']
        
        # Check file type
        if not csv_file.name.endswith('.csv'):
            return Response({'message': 'File must be a CSV'}, status=http_status.HTTP_400_BAD_REQUEST)

        decoded_file = csv_file.read().decode('utf-8')
        csv_data = csv.DictReader(StringIO(decoded_file))
        
        created_count = 0
        error_rows = []
        
        logger.info(f"CSV file decoded, starting to process rows")
        
        for row_num, row in enumerate(csv_data, start=2):  # Start at line 2 (after header)
            logger.info(f"Processing row {row_num}: {row}")
            
            # Skip empty rows
            if not row.get('first_name') or not row.get('last_name') or not row.get('email'):
                error_msg = f"Row {row_num}: Missing required fields"
                logger.warning(error_msg)
                error_rows.append(error_msg)
                continue
            
            # Process each row in its own transaction
            try:
                with transaction.atomic():
                    logger.info(f"Creating user with email: {row.get('email')}")
                    user = User.objects.create_user(
                        email=row.get('email'),
                        first_name=row.get('first_name'),
                        last_name=row.get('last_name'),
                        password=row.get('password')
                    )
                    logger.info(f"User created: {user.id}")
                    
                    # Get status or use default
                    status_id = row.get('status')
                    customer_status = None
                    if status_id and status_id.isdigit():
                        try:
                            customer_status = Status.objects.get(id=int(status_id), context_id=1)
                            logger.info(f"Found status with ID {status_id}")
                        except Status.DoesNotExist:
                            logger.warning(f"Status ID {status_id} not found, using default")
                            customer_status = Status.objects.filter(context_id=1).first()
                    else:
                        logger.info("No valid status ID, using default")
                        customer_status = Status.objects.filter(context_id=1).first()
                    
                    if not customer_status:
                        logger.error("No customer status found (default or specified)")
                        raise Exception("Customer status not found")
                    
                    # Create customer
                    logger.info(f"Creating customer for user {user.id}")
                    customer = Customer.objects.create(
                        user=user,
                        phone_number=row.get('phone_number', ''),
                        status=customer_status,
                        preferred_notification=row.get('preferred_notification', 'email')
                    )
                    logger.info(f"Customer created: {customer.id}")
                    
                    created_count += 1
                    
            except Exception as e:
                error_msg = f"Row {row_num}: {str(e)}"
                logger.error(error_msg, exc_info=True)
                error_rows.append(error_msg)
        
        logger.info(f"Finished processing all rows. Created count: {created_count}")
        
        logger.info("Import completed successfully")
        return Response({
            'message': f'Successfully imported {created_count} customers',
            'count': created_count,
            'errors': error_rows if error_rows else None
        }, status=http_status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['DELETE'], permission_classes=[IsAdmin | IsManager])
    def delete_customer(self, request, pk=None):
        """Delete an existing customer"""
        try:
            customer = Customer.objects.get(pk=pk)
            # You might want to add permission checking here
            user = customer.user
            customer.delete()
            if user:  # If you want to delete the associated user too
                user.delete()
            return Response({"message": "Customer deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Customer.DoesNotExist:
            return Response({"error": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['GET'])
    def employees(self, request):
        # Get role filter parameter, default to None
        role_name = request.query_params.get('role_name', None)
        
        # Start with all employees
        employees = Employee.objects.all()

        search_query = request.query_params.get('search', '')        

        if search_query:
            employees = employees.filter(
                Q(user__first_name__icontains=search_query) |
                Q(user__last_name__icontains=search_query) |
                Q(user__email__icontains=search_query) 
            )
        
        # Apply filter if role_name is provided
        if role_name is not None:
            employees = employees.filter(role__name=role_name)
        
        # Handle pagination
        page = self.paginate_queryset(employees)
        if page is not None:
            serializer = EmployeeSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = EmployeeSerializer(employees, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['GET'], url_path='employee-details')
    def employee_details(self, request, pk=None):
        try:
            employee = Employee.objects.get(pk=pk)
            serializer = EmployeeSerializer(employee)
            return Response(serializer.data)
        except Employee.DoesNotExist:
            return Response({"error": "Employee not found"}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['PUT'])
    def update_employee(self, request, pk=None):
        """Update an existing employee and associated user"""
        try:
            employee = Employee.objects.get(pk=pk)
            user = employee.user
            
            # Extract user data from request
            user_data = {}
            if 'first_name' in request.data:
                user_data['first_name'] = request.data.pop('first_name')
            if 'last_name' in request.data:
                user_data['last_name'] = request.data.pop('last_name')  
            if 'email' in request.data:
                user_data['email'] = request.data.pop('email')
            if 'password' in request.data:
                user_data['password'] = request.data.pop('password')
                
            # Update user if there's user data
            if user_data:
                user_serializer = UserSerializer(user, data=user_data, partial=True)
                if user_serializer.is_valid():
                    user_serializer.save()
                else:
                    return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # Update employee data
            serializer = EmployeeSerializer(employee, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                
                # Return the updated employee with user details
                return Response(EmployeeSerializer(employee).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Employee.DoesNotExist:
            return Response({"error": "Employee not found"}, status=status.HTTP_404_NOT_FOUND)
        
    @action(detail=False, methods=['POST'])
    def create_employee(self, request):
        """Atomically create a new user and associated employee"""
        user_data = {}
        if 'first_name' in request.data:
            user_data['first_name'] = request.data.pop('first_name')
        if 'last_name' in request.data:
            user_data['last_name'] = request.data.pop('last_name')
        if 'email' in request.data:
            user_data['email'] = request.data.pop('email')
        if 'password' in request.data:
            user_data['password'] = request.data.pop('password')

        try:
            with transaction.atomic():
                # Step 1: Create the user
                user_serializer = UserSerializer(data=user_data)
                if user_serializer.is_valid():
                    user = user_serializer.save()
                else:
                    return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

                # Step 2: Create the employee
                request.data['user'] = user.id
                employee_serializer = EmployeeSerializer(data=request.data)
                if employee_serializer.is_valid():
                    employee = employee_serializer.save()
                    return Response(EmployeeSerializer(employee).data, status=status.HTTP_201_CREATED)
                else:
                    # Force rollback by raising exception
                    raise ValueError(employee_serializer.errors)

        except ValueError as e:
            return Response(e.args[0], status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['GET'])
    def export_employees_csv(self, request):
        """Export employees to CSV with Cyrillic support"""
        # Create a buffer
        buffer = io.StringIO()
        
        # Write BOM for UTF-8 recognition in Excel
        buffer.write('\ufeff')
        
        employees = Employee.objects.all().select_related('user', 'role')
        
        # Create CSV writer with the buffer
        writer = csv.writer(buffer)
        
        # Write header row
        writer.writerow(['id', 'first_name', 'last_name', 'email', 'password', 'role'])
        
        # Write data rows
        for employee in employees:
            writer.writerow([
                employee.id,
                employee.user.first_name,
                employee.user.last_name,
                employee.user.email,
                employee.user.password,  # Note: This will be the hashed password
                employee.role.name
            ])
        
        # Create response with the buffer content
        response = HttpResponse(buffer.getvalue(), content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="employees.csv"'
        
        return response
    
    @action(detail=False, methods=['POST'], parser_classes=[MultiPartParser])
    def import_employees_csv(self, request):
        """Import employees from CSV"""
        import logging
        logger = logging.getLogger(__name__)
        logger.info("Starting employee import")
        
        if 'csv_file' not in request.FILES:
            return Response({'message': 'No CSV file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        csv_file = request.FILES['csv_file']
        
        # Check file type
        if not csv_file.name.endswith('.csv'):
            return Response({'message': 'File must be a CSV'}, status=status.HTTP_400_BAD_REQUEST)

        decoded_file = csv_file.read().decode('utf-8')
        csv_data = csv.DictReader(StringIO(decoded_file))
        
        created_count = 0
        error_rows = []
        
        logger.info(f"CSV file decoded, starting to process rows")
        
        for row_num, row in enumerate(csv_data, start=2):  # Start at line 2 (after header)
            logger.info(f"Processing row {row_num}: {row}")
            
            # Skip empty rows
            if not row.get('first_name') or not row.get('last_name') or not row.get('email') or not row.get('role'):
                error_msg = f"Row {row_num}: Missing required fields"
                logger.warning(error_msg)
                error_rows.append(error_msg)
                continue
            
            # Process each row in its own transaction
            try:
                with transaction.atomic():
                    logger.info(f"Creating user with email: {row.get('email')}")
                    user = User.objects.create_user(
                        email=row.get('email'),
                        first_name=row.get('first_name'),
                        last_name=row.get('last_name'),
                        password=row.get('password')
                    )
                    logger.info(f"User created: {user.id}")
                    
                    # Get role or create if it doesn't exist
                    role_name = row.get('role')
                    try:
                        employee_role = EmployeeRole.objects.get(name=role_name)
                        logger.info(f"Found role: {role_name}")
                    except EmployeeRole.DoesNotExist:
                        logger.warning(f"Role {role_name} not found, creating it")
                        employee_role = EmployeeRole.objects.create(name=role_name)
                    
                    # Create employee
                    logger.info(f"Creating employee for user {user.id}")
                    employee = Employee.objects.create(
                        user=user,
                        role=employee_role
                    )
                    logger.info(f"Employee created: {employee.id}")
                    
                    created_count += 1
                    
            except Exception as e:
                error_msg = f"Row {row_num}: {str(e)}"
                logger.error(error_msg, exc_info=True)
                error_rows.append(error_msg)
        
        logger.info(f"Finished processing all rows. Created count: {created_count}")
        
        logger.info("Import completed successfully")
        return Response({
            'message': f'Successfully imported {created_count} employees',
            'count': created_count,
            'errors': error_rows if error_rows else None
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['GET'])
    def export_tariffs_csv(self, request):
        """Export tariffs to CSV with Cyrillic support"""
        # Create a buffer
        buffer = io.StringIO()
        
        # Write BOM for UTF-8 recognition in Excel
        buffer.write('\ufeff')
        
        tariffs = Tariff.objects.all().prefetch_related('tariffservice_set', 'tariffservice_set__service')
        
        # Create CSV writer with the buffer
        writer = csv.writer(buffer)
        
        # Write header row
        writer.writerow(['id', 'name', 'price', 'description', 'is_active', 'services'])
        
        # Write data rows
        for tariff in tariffs:
            services = ','.join([ts.service.name for ts in tariff.tariffservice_set.all()])
            writer.writerow([
                tariff.id,
                tariff.name,
                tariff.price,
                tariff.description,
                tariff.is_active,
                services
            ])
        
        # Create response with the buffer content
        response = HttpResponse(buffer.getvalue(), content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="tariffs.csv"'
        
        return response
    
    @action(detail=False, methods=['POST'], parser_classes=[MultiPartParser])
    def import_tariffs_csv(self, request):
        """Import tariffs from CSV"""
        import logging
        logger = logging.getLogger(__name__)
        logger.info("Starting tariff import")
        
        if 'csv_file' not in request.FILES:
            return Response({'message': 'No CSV file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        csv_file = request.FILES['csv_file']
        
        # Check file type
        if not csv_file.name.endswith('.csv'):
            return Response({'message': 'File must be a CSV'}, status=status.HTTP_400_BAD_REQUEST)

        decoded_file = csv_file.read().decode('utf-8')
        csv_data = csv.DictReader(StringIO(decoded_file))
        
        created_count = 0
        error_rows = []
        
        logger.info(f"CSV file decoded, starting to process rows")
        
        for row_num, row in enumerate(csv_data, start=2):  # Start at line 2 (after header)
            logger.info(f"Processing row {row_num}: {row}")
            
            # Skip empty rows
            if not row.get('name') or not row.get('price'):
                error_msg = f"Row {row_num}: Missing required fields (name or price)"
                logger.warning(error_msg)
                error_rows.append(error_msg)
                continue
            
            # Process each row in its own transaction
            try:
                with transaction.atomic():
                    # Create or update tariff
                    is_active = row.get('is_active', 'True').lower() in ('true', 'yes', '1')
                    
                    tariff, created = Tariff.objects.update_or_create(
                        name=row.get('name'),
                        defaults={
                            'price': float(row.get('price')),
                            'description': row.get('description', ''),
                            'is_active': is_active
                        }
                    )
                    
                    logger.info(f"{'Created' if created else 'Updated'} tariff: {tariff.id}")
                    
                    # Process services if provided
                    if row.get('services'):
                        # Remove existing service relationships
                        TariffService.objects.filter(tariff=tariff).delete()
                        
                        # Add new service relationships
                        service_names = [s.strip() for s in row.get('services').split(',')]
                        for service_name in service_names:
                            if not service_name:
                                continue
                                
                            try:
                                service = Service.objects.get(name=service_name)
                                TariffService.objects.create(tariff=tariff, service=service)
                                logger.info(f"Added service {service.name} to tariff {tariff.name}")
                            except Service.DoesNotExist:
                                logger.warning(f"Service {service_name} not found, skipping")
                    
                    created_count += 1
                        
            except Exception as e:
                error_msg = f"Row {row_num}: {str(e)}"
                logger.error(error_msg, exc_info=True)
                error_rows.append(error_msg)
        
        logger.info(f"Finished processing all rows. Created/updated count: {created_count}")
        
        logger.info("Import completed successfully")
        return Response({
            'message': f'Successfully imported {created_count} tariffs',
            'count': created_count,
            'errors': error_rows if error_rows else None
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['DELETE'])
    def delete_employee(self, request, pk=None):
        """Delete an existing employee"""
        try:
            employee = Employee.objects.get(pk=pk)
            # You might want to add permission checking here
            user = employee.user
            employee.delete()
            if user:  # If you want to delete the associated user too
                user.delete()
            return Response({"message": "Employee deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Employee.DoesNotExist:
            return Response({"error": "Employee not found"}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['GET'], permission_classes=[IsAdmin | IsManager])
    def contracts(self, request):
        contracts = Contract.objects.all()

        from django.db.models import Case, When, IntegerField, Q
        
        # Get current date for comparison
        current_date = timezone.now().date()
        
        # Annotate contracts with a status priority based on active/inactive status
        contracts = contracts.annotate(
            status_priority=Case(
                # Contract is active if start_date <= current_date <= end_date (or end_date is None)
                When(
                    Q(start_date__lte=current_date) & 
                    (Q(end_date__gte=current_date) | Q(end_date__isnull=True)), 
                    then=0
                ),  # Active contracts get highest priority (0)
                default=1,  # Inactive contracts get lower priority (1)
                output_field=IntegerField(),
            )
        ).order_by('status_priority', '-created_at')

        page = self.paginate_queryset(contracts)
        if page is not None:
            serializer = ContractSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = ContractSerializer(contracts, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['GET'], url_path='contract-details', permission_classes=[IsAdmin | IsManager])
    def contract_details(self, request, pk=None):
        try:
            contract = Contract.objects.get(pk=pk)
            serializer = ContractSerializer(contract)
            return Response(serializer.data)
        except Contract.DoesNotExist:
            return Response({"error": "Contract not found"}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['GET'], permission_classes=[IsAdmin | IsManager])
    def invoices(self, request):
        status_filter = request.query_params.get('status', None)
        invoices = Invoice.objects.all()
        
        if status_filter:
            invoices = invoices.filter(status=status_filter)
        
        page = self.paginate_queryset(invoices)
        if page is not None:
            serializer = InvoiceSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = InvoiceSerializer(invoices, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['GET'], url_path='invoice-details', permission_classes=[IsAdmin | IsManager])
    def invoice_details(self, request, pk=None):
        try:
            invoice = Invoice.objects.get(pk=pk)
            serializer = InvoiceSerializer(invoice)
            return Response(serializer.data)
        except Invoice.DoesNotExist:
            return Response({"error": "Invoice not found"}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['GET'], permission_classes=[IsAdmin | IsSupport | IsManager])
    def support_tickets(self, request):
        status_filter = request.query_params.get('status', None)
        tickets = SupportTicket.objects.all()
        
        if status_filter:
            tickets = tickets.filter(status__status=status_filter)
        
        from django.db.models import Case, When, IntegerField
        
        # Apply the same priority ordering to support tickets
        tickets = tickets.annotate(
            status_priority=Case(
                When(status__status='New', then=0),     # "New" status gets highest priority (0)
                When(status__status='Open', then=1),    # "Open" status gets second priority (1)
                default=2,                              # All other statuses get lowest priority (2)
                output_field=IntegerField(),
            )
        ).order_by('status_priority', '-created_at')  # Sort by priority first, then by creation date
        
        page = self.paginate_queryset(tickets)
        if page is not None:
            serializer = SupportTicketSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = SupportTicketSerializer(tickets, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['GET'], url_path='support-ticket-details', permission_classes=[IsAdmin | IsSupport | IsManager])
    def supportticket_details(self, request, pk=None):
        try:
            supportticket = SupportTicket.objects.get(pk=pk)
            serializer = SupportTicketSerializer(supportticket)
            return Response(serializer.data)
        except SupportTicket.DoesNotExist:
            return Response({"error": "Support ticket not found"}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['GET'], permission_classes=[IsAdmin | IsManager])
    def connection_requests(self, request):
        status_filter = request.query_params.get('status', None)
        requests = ConnectionRequest.objects.all().order_by('-created_at')
        
        if status_filter:
            requests = requests.filter(status__status=status_filter)

        from django.db.models import Case, When, IntegerField
    
        requests = requests.annotate(
            status_priority=Case(
                When(status__status='New', then=0),  # "New" status gets highest priority (0)
                default=1,                           # All other statuses get lower priority (1)
                output_field=IntegerField(),
            )
        ).order_by('status_priority', '-created_at')
        
        page = self.paginate_queryset(requests)
        if page is not None:
            serializer = ConnectionRequestSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = ConnectionRequestSerializer(requests, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['GET'], url_path='connection-request-details', permission_classes=[IsAdmin | IsManager])
    def connectionrequest_details(self, request, pk=None):
        try:
            connectionrequest = ConnectionRequest.objects.get(pk=pk)
            serializer = ConnectionRequestSerializer(connectionrequest)
            return Response(serializer.data)
        except SupportTicket.DoesNotExist:
            return Response({"error": "Connection request not found"}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['GET'])
    def tariffs(self, request):
        tariffs = Tariff.objects.all()
        serializer = TariffSerializer(tariffs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['GET'])
    def equipment(self, request):
        equipments = Equipment.objects.all()
        serializer = EquipmentSerializer(equipments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['GET'])
    def financial_summary(self, request):
        # Get query params for date filtering
        from_date = request.query_params.get('from_date', None)
        to_date = request.query_params.get('to_date', None)
        
        payments = Payment.objects.all()
        invoices = Invoice.objects.all()
        
        if from_date:
            payments = payments.filter(payment_date__gte=from_date)
            invoices = invoices.filter(issue_date__gte=from_date)
        
        if to_date:
            payments = payments.filter(payment_date__lte=to_date)
            invoices = invoices.filter(issue_date__lte=to_date)
        
        total_revenue = payments.aggregate(total=Sum('amount'))['total'] or 0
        total_invoiced = invoices.aggregate(total=Sum('amount'))['total'] or 0
        pending_amount = invoices.filter(status='pending').aggregate(total=Sum('amount'))['total'] or 0
        overdue_amount = invoices.filter(status='overdue').aggregate(total=Sum('amount'))['total'] or 0
        
        return Response({
            'total_revenue': total_revenue,
            'total_invoiced': total_invoiced,
            'pending_amount': pending_amount,
            'overdue_amount': overdue_amount,
            'payment_collection_rate': (total_revenue / total_invoiced * 100) if total_invoiced > 0 else 0
        })
    
    @action(detail=True, methods=['POST'], url_path='approve', permission_classes=[IsAdmin | IsManager])
    def approve_request(self, request, pk=None):
        try:
            print(f"[DEBUG] Starting approval process for connection request ID {pk}")
            
            connection_request = ConnectionRequest.objects.get(pk=pk)
            print(f"[DEBUG] Found ConnectionRequest: {connection_request}")

            try:
                # Parse start_date
                if 'start_date' in request.data and request.data['start_date']:
                    print(f"[DEBUG] Received start_date: {request.data['start_date']}")
                    start_date = datetime.strptime(request.data['start_date'], "%Y-%m-%d").replace(hour=0, minute=0, second=0)
                    start_date = timezone.make_aware(start_date)
                else:
                    start_date = timezone.now()
                    print(f"[DEBUG] No start_date provided, using current time: {start_date}")

                # Parse end_date
                if 'end_date' in request.data and request.data['end_date']:
                    print(f"[DEBUG] Received end_date: {request.data['end_date']}")
                    end_date = datetime.strptime(request.data['end_date'], "%Y-%m-%d").replace(hour=0, minute=0, second=0)
                    end_date = timezone.make_aware(end_date)
                else:
                    end_date = None
                    print("[DEBUG] No end_date provided.")

            except ValueError as e:
                print(f"[ERROR] Invalid date format: {e}")
                return Response({"error": f"Invalid date format: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

            # FIRST TRANSACTION: Create contract
            try:
                with transaction.atomic():
                    # First update the connection request status 
                    print("[DEBUG] Setting ConnectionRequest status to Approved...")
                    approved_status = Status.objects.get(status='Approved', context__context='ConnectionRequest')
                    ConnectionRequest.objects.filter(pk=pk).update(status=approved_status)
                    print(f"[DEBUG] ConnectionRequest ID {connection_request.id} status set to Approved.")
                    
                    # Refresh the connection request from DB to get the updated status
                    connection_request = ConnectionRequest.objects.get(pk=pk)
                    
                    print("[DEBUG] Creating new Contract...")
                    contract = Contract.objects.create(
                        customer=connection_request.customer,
                        connection_request=connection_request,
                        address=connection_request.address,
                        tariff=connection_request.tariff,
                        service=connection_request.tariff.services.first(),
                        start_date=start_date,
                        end_date=end_date,
                    )
                    print(f"[DEBUG] Contract created with ID {contract.id}")
            except Exception as e:
                print(f"[ERROR] Error in first transaction: {e}")
                return Response({"error": f"Failed to create contract: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

            # Make sure we have the contract ID to use in the next transaction
            contract_id = Contract.objects.get(connection_request=connection_request).id
            
            # SECOND TRANSACTION: Add equipment and create invoice
            try:
                with transaction.atomic():
                    # Get a fresh copy of the contract from the database
                    fresh_contract = Contract.objects.get(id=contract_id)
                    print(f"[DEBUG] Retrieved fresh contract with ID {fresh_contract.id}")
                    
                    # Add equipment if provided
                    if 'equipment' in request.data and request.data['equipment']:
                        print(f"[DEBUG] Adding equipment to Contract ID {fresh_contract.id}")
                        for equipment_id in request.data['equipment']:
                            try:
                                equipment = Equipment.objects.get(id=equipment_id)
                                ContractEquipment.objects.create(
                                    contract=fresh_contract,  # Use fresh_contract here
                                    equipment=equipment
                                )
                                print(f"[DEBUG] Added equipment ID {equipment_id} to contract {fresh_contract.id}.")
                            except Equipment.DoesNotExist:
                                print(f"[ERROR] Equipment ID {equipment_id} not found.")
                                raise Exception(f"Equipment ID {equipment_id} not found")
                                
                    print(f"[DEBUG] Creating invoice for Contract ID {fresh_contract.id}")
                    invoice = Invoice.objects.create(
                        contract=fresh_contract,  # Use fresh_contract here
                        amount=fresh_contract.tariff.price,
                        due_date=timezone.now() + timedelta(days=30),
                        description=f"Monthly fee for {fresh_contract.tariff.name}"
                    )
                    print(f"[DEBUG] Invoice created with ID {invoice.id} for Contract ID {fresh_contract.id}")
            except Exception as e:
                print(f"[ERROR] Error in second transaction: {e}")
                # We'll allow the API to return success even if the invoice creation fails
                # since the contract was created successfully

            return Response({
                "success": True,
                "message": "Connection request approved and contract created",
                "contract_id": contract_id
            }, status=status.HTTP_200_OK)

        except ConnectionRequest.DoesNotExist:
            print(f"[ERROR] ConnectionRequest ID {pk} not found.")
            return Response({"error": "Connection request not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"[ERROR] Unexpected error during approval: {e}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=True, methods=['PATCH'], url_path='decline', permission_classes=[IsAdmin | IsManager])
    def decline_request(self, request, pk=None):
        try:
            # Check if the connection request exists
            connection_request = ConnectionRequest.objects.get(pk=pk)
            
            # Check if the request already has a contract
            if hasattr(connection_request, 'contract') or getattr(connection_request, 'contract', None):
                return Response({
                    "error": "Cannot decline a connection request that already has an associated contract"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                # Get the status object
                declined_status = Status.objects.get(status='Denied', context__context='ConnectionRequest')
                
                # Update the connection request directly in the database
                ConnectionRequest.objects.filter(pk=pk).update(status=declined_status)
                
                return Response({
                    "success": True,
                    "message": "Connection request declined"
                }, status=status.HTTP_200_OK)
                
            except Exception as db_error:
                print(f"Error occurred: {str(db_error)}")
                return Response({
                    "error": f"Database error: {str(db_error)}"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        except ConnectionRequest.DoesNotExist:
            return Response({"error": "Connection request not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=True, methods=['PATCH'], url_path='terminate-contract', permission_classes=[IsAdmin | IsManager])
    def terminate_contract(self, request, pk=None):
        try:
            contract = Contract.objects.get(pk=pk)
            
            # Use timezone.now() to get timezone-aware date
            today = timezone.now().date()
            
            # Check if termination is possible
            if contract.end_date is None or contract.end_date.date() > today:
                # Update directly with timezone-aware date
                today_datetime = timezone.make_aware(datetime.combine(today, datetime.min.time()))
                Contract.objects.filter(pk=pk).update(end_date=today_datetime)
                
                # Log the update for debugging
                print(f"[DEBUG] Contract {pk} terminated. Set end_date to {today_datetime}")
                
                # Refresh the contract instance from the database
                contract.refresh_from_db()
                
                return Response({
                    "success": True,
                    "message": "Contract terminated successfully",
                    "end_date": contract.end_date
                }, status=status.HTTP_200_OK)
            else:
                print(f"[DEBUG] Contract already terminated: end_date = {contract.end_date}, today = {today}")
                return Response({
                    "success": False,
                    "message": "Contract is already terminated or expired"
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Contract.DoesNotExist:
            print(f"[ERROR] Contract {pk} not found")
            return Response({"error": "Contract not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"[ERROR] Exception when terminating contract {pk}: {e}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
           
    @action(detail=False, methods=['GET'])
    def performance_metrics(self, request):
        # Get query params for date filtering
        from_date = request.query_params.get('from_date', None)
        to_date = request.query_params.get('to_date', None)
        
        # Base querysets
        connection_requests = ConnectionRequest.objects.all()
        support_tickets = SupportTicket.objects.all()
        
        # Apply date filters if provided
        if from_date:
            connection_requests = connection_requests.filter(created_at__gte=from_date)
            support_tickets = support_tickets.filter(created_at__gte=from_date)
        
        if to_date:
            connection_requests = connection_requests.filter(created_at__lte=to_date)
            support_tickets = support_tickets.filter(created_at__lte=to_date)
        
        # Calculate metrics
        total_requests = connection_requests.count()
        completed_requests = connection_requests.filter(status__status='completed').count()
        total_tickets = support_tickets.count()
        resolved_tickets = support_tickets.filter(status__status__in=['resolved', 'closed']).count()
        
        completion_rate = (completed_requests / total_requests * 100) if total_requests > 0 else 0
        resolution_rate = (resolved_tickets / total_tickets * 100) if total_tickets > 0 else 0
        
        return Response({
            'total_connection_requests': total_requests,
            'completed_connection_requests': completed_requests,
            'connection_request_completion_rate': completion_rate,
            'total_support_tickets': total_tickets,
            'resolved_support_tickets': resolved_tickets,
            'ticket_resolution_rate': resolution_rate
        })

    def generate_financial_report(self, request):
        """Generate comprehensive financial report with multiple filtering options"""
        # Get query params
        from_date = request.query_params.get('from_date', None)
        to_date = request.query_params.get('to_date', None)
        customer_id = request.query_params.get('customer_id', None)
        tariff_id = request.query_params.get('tariff_id', None)
        group_by = request.query_params.get('group_by', 'day')  # day, month, tariff, customer
        
        # Base query for payments
        payments = Payment.objects.all()
        invoices = Invoice.objects.all()
        
        # Apply filters
        if from_date:
            payments = payments.filter(payment_date__gte=from_date)
            invoices = invoices.filter(issue_date__gte=from_date)
            
        if to_date:
            payments = payments.filter(payment_date__lte=to_date)
            invoices = invoices.filter(issue_date__lte=to_date)
            
        if customer_id:
            payments = payments.filter(customer_id=customer_id)
            invoices = invoices.filter(contract__customer_id=customer_id)
            
        if tariff_id:
            invoices = invoices.filter(contract__tariff_id=tariff_id)
        
        # Generate report based on grouping
        report_data = []
        
        if group_by == 'day':
            daily_payments = payments.annotate(
                day=TruncDay('payment_date')
            ).values('day').annotate(
                total=Sum('amount'),
                count=Count('id')
            ).order_by('day')
            
            daily_invoices = invoices.annotate(
                day=TruncDay('issue_date')
            ).values('day').annotate(
                total=Sum('amount'),
                count=Count('id')
            ).order_by('day')
            
            # Combine payment and invoice data by day
            day_data = {}
            for payment in daily_payments:
                day = payment['day'].strftime('%Y-%m-%d')
                if day not in day_data:
                    day_data[day] = {'received': 0, 'invoiced': 0, 'received_count': 0, 'invoiced_count': 0}
                day_data[day]['received'] = payment['total']
                day_data[day]['received_count'] = payment['count']
                
            for invoice in daily_invoices:
                day = invoice['day'].strftime('%Y-%m-%d')
                if day not in day_data:
                    day_data[day] = {'received': 0, 'invoiced': 0, 'received_count': 0, 'invoiced_count': 0}
                day_data[day]['invoiced'] = invoice['total']
                day_data[day]['invoiced_count'] = invoice['count']
            
            for day, data in day_data.items():
                report_data.append({
                    'date': day,
                    'revenue': data['received'],
                    'invoiced': data['invoiced'],
                    'payment_count': data['received_count'],
                    'invoice_count': data['invoiced_count']
                })
                
        elif group_by == 'month':
            # Similar to day but with TruncMonth
            monthly_payments = payments.annotate(
                month=TruncMonth('payment_date')
            ).values('month').annotate(
                total=Sum('amount'),
                count=Count('id')
            ).order_by('month')
            
            monthly_invoices = invoices.annotate(
                month=TruncMonth('issue_date')
            ).values('month').annotate(
                total=Sum('amount'),
                count=Count('id')
            ).order_by('month')
            
            month_data = {}
            for payment in monthly_payments:
                month = payment['month'].strftime('%Y-%m')
                if month not in month_data:
                    month_data[month] = {'received': 0, 'invoiced': 0, 'received_count': 0, 'invoiced_count': 0}
                month_data[month]['received'] = payment['total']
                month_data[month]['received_count'] = payment['count']
                
            for invoice in monthly_invoices:
                month = invoice['month'].strftime('%Y-%m')
                if month not in month_data:
                    month_data[month] = {'received': 0, 'invoiced': 0, 'received_count': 0, 'invoiced_count': 0}
                month_data[month]['invoiced'] = invoice['total']
                month_data[month]['invoiced_count'] = invoice['count']
            
            for month, data in month_data.items():
                report_data.append({
                    'month': month,
                    'revenue': data['received'],
                    'invoiced': data['invoiced'],
                    'payment_count': data['received_count'],
                    'invoice_count': data['invoiced_count']
                })
                
        elif group_by == 'customer':
            # Use existing Customer model
            customer_payments = payments.values(
                'customer_id', 
                'customer__user__first_name', 
                'customer__user__last_name'
            ).annotate(
                total=Sum('amount'),
                count=Count('id')
            ).order_by('-total')
            
            customer_invoices = invoices.values(
                'contract__customer_id', 
                'contract__customer__user__first_name', 
                'contract__customer__user__last_name'
            ).annotate(
                total=Sum('amount'),
                count=Count('id')
            ).order_by('-total')
            
            customer_data = {}
            for payment in customer_payments:
                customer_id = payment['customer_id']
                if customer_id not in customer_data:
                    customer_data[customer_id] = {
                        'name': f"{payment['customer__user__first_name']} {payment['customer__user__last_name']}",
                        'received': 0, 
                        'invoiced': 0, 
                        'received_count': 0, 
                        'invoiced_count': 0
                    }
                customer_data[customer_id]['received'] = payment['total']
                customer_data[customer_id]['received_count'] = payment['count']
                
            for invoice in customer_invoices:
                customer_id = invoice['contract__customer_id']
                if customer_id not in customer_data:
                    customer_data[customer_id] = {
                        'name': f"{invoice['contract__customer__user__first_name']} {invoice['contract__customer__user__last_name']}",
                        'received': 0, 
                        'invoiced': 0, 
                        'received_count': 0, 
                        'invoiced_count': 0
                    }
                customer_data[customer_id]['invoiced'] = invoice['total']
                customer_data[customer_id]['invoiced_count'] = invoice['count']
            
            for customer_id, data in customer_data.items():
                report_data.append({
                    'customer_id': customer_id,
                    'customer_name': data['name'],
                    'revenue': data['received'],
                    'invoiced': data['invoiced'],
                    'payment_count': data['received_count'],
                    'invoice_count': data['invoiced_count']
                })
                
        elif group_by == 'tariff':
            # Group by tariff using the Contract relationship
            tariff_invoices = invoices.values(
                'contract__tariff_id', 
                'contract__tariff__name'
            ).annotate(
                total=Sum('amount'),
                count=Count('id')
            ).order_by('-total')
            
            tariff_data = {}
            for invoice in tariff_invoices:
                tariff_id = invoice['contract__tariff_id']
                if not tariff_id:
                    continue
                if tariff_id not in tariff_data:
                    tariff_data[tariff_id] = {
                        'name': invoice['contract__tariff__name'],
                        'invoiced': 0, 
                        'invoiced_count': 0
                    }
                tariff_data[tariff_id]['invoiced'] = invoice['total']
                tariff_data[tariff_id]['invoiced_count'] = invoice['count']
            
            for tariff_id, data in tariff_data.items():
                report_data.append({
                    'tariff_id': tariff_id,
                    'tariff_name': data['name'],
                    'invoiced': data['invoiced'],
                    'invoice_count': data['invoiced_count']
                })
        
        # Calculate summary values
        total_revenue = payments.aggregate(total=Sum('amount'))['total'] or 0
        total_invoiced = invoices.aggregate(total=Sum('amount'))['total'] or 0
        
        return Response({
            'report_data': report_data,
            'summary': {
                'total_revenue': total_revenue,
                'total_invoiced': total_invoiced,
                'collection_rate': (total_revenue / total_invoiced * 100) if total_invoiced > 0 else 0
            }
        })
    
    @action(detail=False, methods=['GET'])
    def service_usage_report(self, request):
        """Generate reports on service usage by customers"""
        # Get query params
        from_date = request.query_params.get('from_date', None)
        to_date = request.query_params.get('to_date', None)
        customer_id = request.query_params.get('customer_id', None)
        service_id = request.query_params.get('service_id', None)
        
        # Using NetworkUsage model from the serializers
        usage_data = NetworkUsage.objects.all()
        
        # Apply filters
        if from_date:
            usage_data = usage_data.filter(date__gte=from_date)
        
        if to_date:
            usage_data = usage_data.filter(date__lte=to_date)
            
        if customer_id:
            usage_data = usage_data.filter(contract__customer_id=customer_id)
            
        if service_id:
            usage_data = usage_data.filter(contract__service_id=service_id)
        
        # Get total usage by customer
        customer_usage = usage_data.values(
            'contract__customer_id',
            'contract__customer__user__first_name',
            'contract__customer__user__last_name'
        ).annotate(
            download_total=Sum('download_gb'),
            upload_total=Sum('upload_gb'),
            total_gb=Sum(F('download_gb') + F('upload_gb'))
        ).order_by('-total_gb')
        
        customer_usage_formatted = [
            {
                'customer_id': item['contract__customer_id'],
                'customer_name': f"{item['contract__customer__user__first_name']} {item['contract__customer__user__last_name']}",
                'download_gb': item['download_total'],
                'upload_gb': item['upload_total'],
                'total_gb': item['total_gb']
            }
            for item in customer_usage
        ]
        
        # Get usage by service
        service_usage = usage_data.values(
            'contract__service_id',
            'contract__service__name'
        ).annotate(
            download_total=Sum('download_gb'),
            upload_total=Sum('upload_gb'),
            total_gb=Sum(F('download_gb') + F('upload_gb')),
            customer_count=Count('contract__customer_id', distinct=True)
        ).order_by('-total_gb')
        
        service_usage_formatted = [
            {
                'service_id': item['contract__service_id'],
                'service_name': item['contract__service__name'],
                'download_gb': item['download_total'],
                'upload_gb': item['upload_total'],
                'total_gb': item['total_gb'],
                'customer_count': item['customer_count']
            }
            for item in service_usage
        ]
        
        # Daily usage trend
        daily_usage = usage_data.annotate(
            day=TruncDay('date')
        ).values('day').annotate(
            download_total=Sum('download_gb'),
            upload_total=Sum('upload_gb'),
            total_gb=Sum(F('download_gb') + F('upload_gb')),
            customer_count=Count('contract__customer_id', distinct=True)
        ).order_by('day')
        
        daily_usage_formatted = [
            {
                'date': item['day'].strftime('%Y-%m-%d'),
                'download_gb': item['download_total'],
                'upload_gb': item['upload_total'],
                'total_gb': item['total_gb'],
                'customer_count': item['customer_count']
            }
            for item in daily_usage
        ]
        
        # Usage by tariff
        tariff_usage = usage_data.values(
            'contract__tariff_id',
            'contract__tariff__name'
        ).annotate(
            download_total=Sum('download_gb'),
            upload_total=Sum('upload_gb'),
            total_gb=Sum(F('download_gb') + F('upload_gb')),
            customer_count=Count('contract__customer_id', distinct=True)
        ).order_by('-total_gb')
        
        tariff_usage_formatted = [
            {
                'tariff_id': item['contract__tariff_id'],
                'tariff_name': item['contract__tariff__name'],
                'download_gb': item['download_total'],
                'upload_gb': item['upload_total'],
                'total_gb': item['total_gb'],
                'customer_count': item['customer_count']
            }
            for item in tariff_usage if item['contract__tariff_id'] is not None
        ]
        
        return Response({
            'customer_usage': customer_usage_formatted,
            'service_usage': service_usage_formatted,
            'daily_usage': daily_usage_formatted,
            'tariff_usage': tariff_usage_formatted,
            'summary': {
                'total_download_gb': usage_data.aggregate(total=Sum('download_gb'))['total'] or 0,
                'total_upload_gb': usage_data.aggregate(total=Sum('upload_gb'))['total'] or 0,
                'total_data_gb': usage_data.aggregate(total=Sum(F('download_gb') + F('upload_gb')))['total'] or 0,
                'unique_customers': usage_data.values('contract__customer_id').distinct().count()
            }
        })
    
    @action(detail=False, methods=['GET'])
    def connection_activity(self, request):
        """Monitor connection activity of customers"""
        # Since there is no ConnectionLog model in the original code, we'll adapt this to use 
        # the existing models, specifically ConnectionRequest to track connection activity
        
        # Get query params
        from_date = request.query_params.get('from_date', timezone.now() - timedelta(days=30))
        to_date = request.query_params.get('to_date', timezone.now())
        status_filter = request.query_params.get('status', None)
        
        # Get connection requests
        requests = ConnectionRequest.objects.filter(
            created_at__gte=from_date,
            created_at__lte=to_date
        )
        
        if status_filter:
            requests = requests.filter(status__status=status_filter)
        
        # Active requests (status not in completed/rejected/cancelled)
        active_requests = requests.exclude(
            status__status__in=['completed', 'rejected', 'cancelled']
        ).count()
        
        # Connection statistics by day
        daily_requests = requests.annotate(
            day=TruncDay('created_at')
        ).values('day').annotate(
            request_count=Count('id'),
            unique_customers=Count('customer_id', distinct=True)
        ).order_by('day')
        
        daily_formatted = [
            {
                'date': item['day'].strftime('%Y-%m-%d'),
                'request_count': item['request_count'],
                'unique_customers': item['unique_customers']
            }
            for item in daily_requests
        ]
        
        # Most active customers
        active_customers = requests.values(
            'customer_id', 
            'customer__user__first_name',
            'customer__user__last_name'
        ).annotate(
            request_count=Count('id')
        ).order_by('-request_count')
        
        active_customers_formatted = [
            {
                'customer_id': item['customer_id'],
                'customer_name': f"{item['customer__user__first_name']} {item['customer__user__last_name']}",
                'request_count': item['request_count']
            }
            for item in active_customers
        ]
        
        # Status statistics
        status_stats = requests.values('status__status').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Assignments
        assignment_stats = ConnectionRequestAssignment.objects.filter(
            connection_request__in=requests
        ).values(
            'role__name'
        ).annotate(
            assignment_count=Count('id')
        ).order_by('-assignment_count')
        
        return Response({
            'active_requests': active_requests,
            'daily_requests': daily_formatted,
            'active_customers': active_customers_formatted,
            'status_distribution': status_stats,
            'assignment_distribution': assignment_stats,
            'summary': {
                'total_requests': requests.count(),
                'unique_customers': requests.values('customer_id').distinct().count(),
                'completed_rate': (requests.filter(status__status='completed').count() / requests.count() * 100) 
                              if requests.count() > 0 else 0
            }
        })
    
    @action(detail=False, methods=['GET'])
    def internet_usage_statistics(self, request):
        """Get detailed statistics on internet usage"""
        # Get query params
        from_date = request.query_params.get('from_date', timezone.now() - timedelta(days=30))
        to_date = request.query_params.get('to_date', timezone.now())
        customer_id = request.query_params.get('customer_id', None)
        
        # Using NetworkUsage model as inferred from the serializers
        usage_data = NetworkUsage.objects.filter(
            date__gte=from_date,
            date__lte=to_date
        )
        
        if customer_id:
            usage_data = usage_data.filter(contract__customer_id=customer_id)
        
        # Total usage by customer
        customer_usage = usage_data.values(
            'contract__customer_id', 
            'contract__customer__user__first_name',
            'contract__customer__user__last_name'
        ).annotate(
            download=Sum('download_gb'),
            upload=Sum('upload_gb'),
            total_bytes=Sum(F('download_gb') + F('upload_gb'))
        ).order_by('-total_bytes')
        
        customer_usage_formatted = [
            {
                'customer_id': item['contract__customer_id'],
                'customer_name': f"{item['contract__customer__user__first_name']} {item['contract__customer__user__last_name']}",
                'download_gb': item['download'],
                'upload_gb': item['upload'],
                'total_gb': item['total_bytes']
            }
            for item in customer_usage
        ]
        
        # Daily usage
        daily_usage = usage_data.annotate(
            day=TruncDay('date')
        ).values('day').annotate(
            download=Sum('download_gb'),
            upload=Sum('upload_gb'),
            total_bytes=Sum(F('download_gb') + F('upload_gb')),
            active_customers=Count('contract__customer_id', distinct=True)
        ).order_by('day')
        
        daily_formatted = [
            {
                'date': item['day'].strftime('%Y-%m-%d'),
                'download_gb': item['download'],
                'upload_gb': item['upload'],
                'total_gb': item['total_bytes'],
                'active_customers': item['active_customers']
            }
            for item in daily_usage
        ]
        
        # Usage by tariff
        tariff_usage = usage_data.values(
            'contract__tariff_id',
            'contract__tariff__name'
        ).annotate(
            download=Sum('download_gb'),
            upload=Sum('upload_gb'),
            total_bytes=Sum(F('download_gb') + F('upload_gb')),
            customer_count=Count('contract__customer_id', distinct=True)
        ).order_by('-total_bytes')
        
        tariff_usage_formatted = [
            {
                'tariff_id': item['contract__tariff_id'],
                'tariff_name': item['contract__tariff__name'],
                'download_gb': item['download'],
                'upload_gb': item['upload'],
                'total_gb': item['total_bytes'],
                'customer_count': item['customer_count']
            }
            for item in tariff_usage if item['contract__tariff_id'] is not None
        ]
        
        # Monthly trends
        monthly_usage = usage_data.annotate(
            month=TruncMonth('date')
        ).values('month').annotate(
            download=Sum('download_gb'),
            upload=Sum('upload_gb'),
            total_bytes=Sum(F('download_gb') + F('upload_gb')),
            active_customers=Count('contract__customer_id', distinct=True)
        ).order_by('month')
        
        monthly_formatted = [
            {
                'month': item['month'].strftime('%Y-%m'),
                'download_gb': item['download'],
                'upload_gb': item['upload'],
                'total_gb': item['total_bytes'],
                'active_customers': item['active_customers']
            }
            for item in monthly_usage
        ]
        
        # Calculate totals
        total_download = usage_data.aggregate(total=Sum('download_gb'))['total'] or 0
        total_upload = usage_data.aggregate(total=Sum('upload_gb'))['total'] or 0
        total_usage = total_download + total_upload
        
        return Response({
            'customer_usage': customer_usage_formatted,
            'daily_usage': daily_formatted,
            'monthly_usage': monthly_formatted,
            'tariff_usage': tariff_usage_formatted,
            'summary': {
                'total_download_gb': total_download,
                'total_upload_gb': total_upload,
                'total_usage_gb': total_usage,
                'unique_customers': usage_data.values('contract__customer_id').distinct().count(),
                'average_per_customer_gb': (total_usage / usage_data.values('contract__customer_id').distinct().count()) 
                                        if usage_data.values('contract__customer_id').distinct().count() > 0 else 0
            }
        })
    
    @action(detail=False, methods=['POST'])
    def create_tariff(self, request):
        """Create a new tariff plan"""
        serializer = TariffSerializer(data=request.data)
        if serializer.is_valid():
            tariff = serializer.save()
            
            # Handle services if provided
            services = request.data.get('services', [])
            if services:
                for service_id in services:
                    try:
                        service = Service.objects.get(pk=service_id)
                        TariffService.objects.create(tariff=tariff, service=service)
                    except Service.DoesNotExist:
                        pass
            
            return Response(TariffDetailSerializer(tariff).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['POST'])
    def create_service(self, request):
        """Create a new service"""
        serializer = ServiceSerializer(data=request.data)
        
        if serializer.is_valid():
            service = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['PUT'])
    def update_tariff(self, request, pk=None):
        """Update an existing tariff plan"""
        try:
            tariff = Tariff.objects.get(pk=pk)
            serializer = TariffSerializer(tariff, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                
                # Handle services if provided
                services = request.data.get('services', None)
                if services is not None:
                    # Clear existing services
                    TariffService.objects.filter(tariff=tariff).delete()
                    
                    # Add new services
                    for service_id in services:
                        try:
                            service = Service.objects.get(pk=service_id)
                            TariffService.objects.create(tariff=tariff, service=service)
                        except Service.DoesNotExist:
                            pass
                
                return Response(TariffDetailSerializer(tariff).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Tariff.DoesNotExist:
            return Response({"error": "Tariff not found"}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['PUT'])
    def update_service(self, request, pk=None):
        """Update an existing service"""
        try:
            service = Service.objects.get(pk=pk)
            serializer = ServiceSerializer(service, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Service.DoesNotExist:
            return Response({"error": "Service not found"}, status=status.HTTP_404_NOT_FOUND)
        
    @action(detail=True, methods=['DELETE'])
    def delete_tariff(self, request, pk=None):
        """Delete a tariff plan"""
        try:
            tariff = Tariff.objects.get(pk=pk)
            # Check if any contracts are using this tariff
            contracts_count = Contract.objects.filter(tariff=tariff).count()
            if contracts_count > 0:
                return Response({
                    "error": f"Cannot delete tariff: it is currently used in {contracts_count} contracts"
                }, status=status.HTTP_400_BAD_REQUEST)
                
            tariff.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Tariff.DoesNotExist:
            return Response({"error": "Tariff not found"}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['GET'], permission_classes = [IsAdmin])
    def equipment_statistics(self, request):
        """Get statistics about equipment inventory and usage"""
        equipment = Equipment.objects.all()
        
        equipment_stats = []
        
        for item in equipment:
            # Count contracts or orders using this equipment
            # Assuming you have a model tracking equipment assignments
            active_assignments = ContractEquipment.objects.filter(
                equipment__id=item.id,
                is_active=True
            ).count()
            
            equipment_stats.append({
                'id': item.id,
                'name': item.name,
                'description': item.description,
                'price': item.price,
                'stock_quantity': item.stock_quantity,
                'category_name': item.category.name,
                'state': item.state,
                'active_assignments': active_assignments,
            })
        
        # Sort by stock quantity (lowest first to highlight potential stock issues)
        equipment_stats_sorted = sorted(equipment_stats, key=lambda x: x['stock_quantity'])
        
        # Get equipment by category
        categories = EquipmentCategory.objects.all()
        category_breakdown = {}
        
        for category in categories:
            count = equipment.filter(category=category.id).count()
            if count > 0:
                category_breakdown[category.name] = count
        
        return Response({
            'equipment_statistics': equipment_stats_sorted,
            'total_equipment': equipment.count(),
            'low_stock_items': equipment.filter(stock_quantity__lte=5).count(),
            'category_breakdown': category_breakdown,
            'most_expensive': sorted(equipment_stats, key=lambda x: float(x['price']), reverse=True)[0] if equipment_stats else None
        })

    @action(detail=False, methods=['POST'])
    def create_equipment(self, request):
        """Create a new equipment item"""
        serializer = EquipmentSerializer(data=request.data)
        if serializer.is_valid():
            equipment = serializer.save()
            return Response(EquipmentSerializer(equipment).data, status=status.HTTP_201_CREATED)

        print("Validation errors:", serializer.errors)  # DEBUG LINE
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['PUT'])
    def update_equipment(self, request, pk=None):
        """Update an existing equipment item"""
        try:
            equipment = Equipment.objects.get(pk=pk)
            serializer = EquipmentSerializer(equipment, data=request.data, partial=True)
            if serializer.is_valid():
                updated_equipment = serializer.save()
                return Response(EquipmentSerializer(updated_equipment).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Equipment.DoesNotExist:
            return Response({"error": "Equipment not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['DELETE'])
    def delete_equipment(self, request, pk=None):
        """Delete an equipment item"""
        try:
            equipment = Equipment.objects.get(pk=pk)
            # Check if this equipment is assigned or in use
            assignments_count = ContractEquipment.objects.filter(equipment=equipment, is_active=True).count()
            if assignments_count > 0:
                return Response({
                    "error": f"Cannot delete equipment: it is currently assigned in {assignments_count} active contracts"
                }, status=status.HTTP_400_BAD_REQUEST)
                
            equipment.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Equipment.DoesNotExist:
            return Response({"error": "Equipment not found"}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['DELETE'])
    def delete_service(self, request, pk=None):
        """Delete a service"""
        try:
            service = Service.objects.get(pk=pk)
            # Check if any contracts are using this service
            contracts_count = Contract.objects.filter(service=service).count()
            if contracts_count > 0:
                return Response({
                    "error": f"Cannot delete service: it is currently used in {contracts_count} contracts"
                }, status=status.HTTP_400_BAD_REQUEST)

            service.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Service.DoesNotExist:
            return Response({"error": "Service not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['GET'])
    def tariff_statistics(self, request):
        """Get statistics about tariff usage"""
        tariffs = Tariff.objects.all()
        
        tariff_stats = []
        
        for tariff in tariffs:
            # The error is here - Contract model doesn't have 'is_active' field
            # Using current date between start_date and end_date instead

            active_contracts = Contract.objects.filter(
                Q(end_date__gte=now()) | Q(end_date__isnull=True),
                start_date__isnull=False,
                tariff=tariff  # Add this filter to get only contracts for this specific tariff
            ).count()
            
            # Sum of monthly invoices for this tariff
            monthly_revenue = Invoice.objects.filter(
                contract__tariff=tariff,
                issue_date__gte=timezone.now().replace(day=1)
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            # Services included in this tariff
            services = Service.objects.filter(
                tariffservice__tariff=tariff
            ).values('id', 'name')
            
            tariff_stats.append({
                'id': tariff.id,
                'name': tariff.name,
                'price': tariff.price,
                'active_contracts': active_contracts,
                'monthly_revenue': monthly_revenue,
                'is_active': tariff.is_active,
                'included_services': services
            })
        
        # Sort by number of active contracts
        tariff_stats_sorted = sorted(tariff_stats, key=lambda x: x['active_contracts'], reverse=True)
        
        return Response({
            'tariff_statistics': tariff_stats_sorted,
            'total_tariffs': tariffs.count(),
            'active_tariffs': tariffs.filter(is_active=True).count(),
            'most_popular': tariff_stats_sorted[0] if tariff_stats_sorted else None
        })

    @action(detail=False, methods=['GET'])
    def service_statistics(self, request):
        """Get statistics about service usage"""
        services = Service.objects.all()
        
        service_stats = []
        
        for service in services:
            # Find contracts that include this service through tariffs
            active_contracts = Contract.objects.filter(
                Q(end_date__gte=timezone.now()) | Q(end_date__isnull=True),
                start_date__isnull=False,
                tariff__tariffservice__service=service
            ).count()
            
            # Sum of monthly invoices for contracts that include this service
            monthly_revenue = Invoice.objects.filter(
                contract__tariff__tariffservice__service=service,
                issue_date__gte=timezone.now().replace(day=1)
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            service_stats.append({
                'id': service.id,
                'name': service.name,
                'active_contracts': active_contracts,
                'monthly_revenue': monthly_revenue,
                'is_active': service.is_active
            })
        
        # Sort by number of active contracts
        service_stats_sorted = sorted(service_stats, key=lambda x: x['active_contracts'], reverse=True)
        
        return Response({
            'service_statistics': service_stats_sorted,
            'total_services': services.count(),
            'active_services': services.filter(is_active=True).count(),
            'most_popular': service_stats_sorted[0] if service_stats_sorted else None
        })
    
    @action(detail=True, methods=['PUT'], permission_classes=[IsAdmin | IsSupport | IsManager])
    def update_ticket(self, request, pk=None):
        try:
            ticket = SupportTicket.objects.get(pk=pk)
            
            if 'status' in request.data:
                try:
                    status_obj = Status.objects.get(pk=request.data['status'])
                    # Check if status context is appropriate for support tickets
                    if status_obj.context.context.lower() != "supportticket":
                        return Response({"error": "Invalid status for support ticket"}, status=status.HTTP_400_BAD_REQUEST)
                    ticket.status = status_obj
                except Status.DoesNotExist:
                    return Response({"error": "Status not found"}, status=status.HTTP_404_NOT_FOUND)
            
            # Handle technician assignment
            if 'assigned_to' in request.data:
                try:
                    employee = Employee.objects.get(pk=request.data['assigned_to'])
                    # Optionally: Check if employee is a technician
                    if employee.role.name.lower() != "technician":
                        return Response({"error": "Assigned employee must be a technician"}, status=status.HTTP_400_BAD_REQUEST)
                    ticket.assigned_to = employee
                except Employee.DoesNotExist:
                    return Response({"error": "Employee not found"}, status=status.HTTP_404_NOT_FOUND)
            
            # Update other fields
            serializer = SupportTicketSerializer(ticket, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except SupportTicket.DoesNotExist:
            return Response({"error": "Support ticket not found"}, status=status.HTTP_404_NOT_FOUND)