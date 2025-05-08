from django.db.models import Sum, Count, Q
from django.utils.timezone import now
from django.http import HttpResponse
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny, BasePermission, SAFE_METHODS
from datetime import timedelta
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.platypus import HRFlowable
import io
from datetime import datetime

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

# Custom permissions
class IsCustomer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and not request.user.is_staff

# Authentication views
class UserRegistrationView(APIView):   
    def post(self, request):
        user_serializer = UserRegisterSerializer(data=request.data)
        if user_serializer.is_valid():
            user = user_serializer.save()
            return Response({
                'status': 'success',
                'message': 'User registered successfully',
                'user_id': user.id
            }, status=status.HTTP_201_CREATED)
        return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        data = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_employee': hasattr(user, 'employee_profile'),
            'is_customer': hasattr(user, 'customer_profile'),
        }
        
        if hasattr(user, 'employee_profile'):
            data['employee'] = {
                'id': user.employee_profile.id,
                'role': user.employee_profile.role.name
            }
        
        if hasattr(user, 'customer_profile'):
            data['customer'] = {
                'id': user.customer_profile.id,
                'status': user.customer_profile.status.status,
                'balance': float(user.customer_profile.balance)
            }
        
        return Response(data)

# Customer views
class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['user__first_name', 'user__last_name', 'user__email', 'phone_number']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CustomerCreateSerializer
        return CustomerSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if hasattr(user, 'customer_profile'):
            return queryset.filter(id=user.customer_profile.id)
        
        return queryset
    
    @action(detail=True, methods=['get'], permission_classes=[IsCustomer | IsManager | IsSupport | IsAdmin])
    def dashboard(self, request, pk=None):      
        customer = self.get_object()
        
        # If user is a customer, they can only see their own dashboard
        if hasattr(request.user, 'customer_profile') and request.user.customer_profile.id != customer.id:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get total monthly payment
        total_monthly_payment = customer.get_total_monthly_payment()
        
        serializer = CustomerDashboardSerializer(customer)
        data = serializer.data
        data['total_monthly_payment'] = float(total_monthly_payment)
        
        return Response(data)
    
    @action(detail=True, methods=['get'], permission_classes=[IsCustomer | IsManager | IsSupport | IsAdmin])
    def contracts(self, request, pk=None):
        customer = self.get_object()
        if hasattr(request.user, 'customer_profile') and request.user.customer_profile.id != customer.id:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        contracts = Contract.objects.filter(customer=customer)
        serializer = ContractSerializer(contracts, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[IsCustomer | IsManager | IsSupport | IsAdmin])
    def invoices(self, request, pk=None):
        customer = self.get_object()
        if hasattr(request.user, 'customer_profile') and request.user.customer_profile.id != customer.id:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        invoices = Invoice.objects.filter(contract__customer=customer).order_by('-issue_date')
        serializer = InvoiceSerializer(invoices, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[IsCustomer | IsManager | IsSupport | IsAdmin])
    def payments(self, request, pk=None):
        customer = self.get_object()
        if hasattr(request.user, 'customer_profile') and request.user.customer_profile.id != customer.id:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        payments = Payment.objects.filter(customer=customer).order_by('-payment_date')
        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[IsCustomer | IsManager | IsSupport | IsAdmin])
    def support_tickets(self, request, pk=None):
        customer = self.get_object()
        if hasattr(request.user, 'customer_profile') and request.user.customer_profile.id != customer.id:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        tickets = SupportTicket.objects.filter(customer=customer).order_by('-created_at')
        serializer = SupportTicketSerializer(tickets, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[IsCustomer | IsManager | IsSupport | IsAdmin])
    def network_usage(self, request, pk=None):
        customer = self.get_object()
        if hasattr(request.user, 'customer_profile') and request.user.customer_profile.id != customer.id:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        usage_query = NetworkUsage.objects.filter(contract__customer=customer)
        
        if start_date:
            usage_query = usage_query.filter(date__gte=start_date)
        if end_date:
            usage_query = usage_query.filter(date__lte=end_date)
            
        usage_query = usage_query.order_by('-date')
        serializer = NetworkUsageSerializer(usage_query, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsCustomer])
    def add_address(self, request, pk=None):
        customer = self.get_object()
        if request.user.customer_profile.id != customer.id:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = AddressSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(customer=customer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['patch'], permission_classes=[IsCustomer])
    def update_customer_profile(self, request):
        try:
            customer = Customer.objects.get(user=request.user)
            user = customer.user
            
            # Update user fields
            if 'first_name' in request.data:
                user.first_name = request.data['first_name']
            if 'last_name' in request.data:
                user.last_name = request.data['last_name']
            if 'email' in request.data:
                user.email = request.data['email']
            user.save()
            
            # Update customer fields
            if 'phone_number' in request.data:
                customer.phone_number = request.data['phone_number']
            customer.save()
            
            serializer = CustomerSerializer(customer)
            return Response(serializer.data)
        
        except Customer.DoesNotExist:
            return Response({"detail": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# Address views
class AddressViewSet(viewsets.ModelViewSet):
    queryset = Address.objects.all()
    serializer_class = AddressSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if hasattr(user, 'customer_profile'):
            return queryset.filter(customer=user.customer_profile)
        
        return queryset
    
    def perform_create(self, serializer):
        if hasattr(self.request.user, 'customer_profile'):
            serializer.save(customer=self.request.user.customer_profile)
        else:
            serializer.save()

# Region views
class RegionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Region.objects.all()
    serializer_class = RegionSerializer

# Service views
class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = []
        else:
            permission_classes = [IsManager]
        return [permission() for permission in permission_classes]

# Tariff views
class TariffViewSet(viewsets.ModelViewSet):
    queryset = Tariff.objects.filter(is_active=True)
    serializer_class = TariffSerializer
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TariffDetailSerializer
        return TariffSerializer
    
    @action(detail=True, methods=['post'], permission_classes=[IsManager])
    def add_service(self, request, pk=None):
        tariff = self.get_object()
        service_id = request.data.get('service_id')
        
        try:
            service = Service.objects.get(id=service_id)
        except Service.DoesNotExist:
            return Response({'error': 'Service not found'}, status=status.HTTP_404_NOT_FOUND)
        
        TariffService.objects.create(tariff=tariff, service=service)
        serializer = TariffDetailSerializer(tariff)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsManager])
    def remove_service(self, request, pk=None):
        tariff = self.get_object()
        service_id = request.data.get('service_id')
        
        try:
            tariff_service = TariffService.objects.get(tariff=tariff, service_id=service_id)
            tariff_service.delete()
            serializer = TariffDetailSerializer(tariff)
            return Response(serializer.data)
        except TariffService.DoesNotExist:
            return Response({'error': 'Service not found in this tariff'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def by_service(self, request):
        service_id = request.query_params.get('service_id', None)
        if not service_id:
            return Response({'error': 'Service ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            service = Service.objects.get(id=service_id)
        except Service.DoesNotExist:
            return Response({'error': 'Service not found'}, status=status.HTTP_404_NOT_FOUND)

        # Fetch tariffs associated with this service
        tariff_services = TariffService.objects.filter(service=service)
        tariffs = [tariff_service.tariff for tariff_service in tariff_services]

        # Serialize and return the tariffs
        serializer = TariffSerializer(tariffs, many=True)
        return Response(serializer.data)

# Connection Request views
class ConnectionRequestViewSet(viewsets.ModelViewSet):
    queryset = ConnectionRequest.objects.all().order_by('-created_at')
    serializer_class = ConnectionRequestSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['customer__user__first_name', 'customer__user__last_name', 'customer__phone_number']
    
    def get_permissions(self):
        if self.action in ['create']:
            permission_classes = [IsAuthenticated]
        elif self.action in ['list', 'retrieve']:
            permission_classes = [IsAdminUser | IsCustomer]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if hasattr(user, 'customer_profile'):
            return queryset.filter(customer=user.customer_profile)
        
        return queryset
    
    def perform_create(self, serializer):
        print(f"DEBUG: User is {self.request.user}, has customer_profile: {hasattr(self.request.user, 'customer_profile')}")
        
        if hasattr(self.request.user, 'customer_profile'):
            # Customer creating a connection request
            customer = self.request.user.customer_profile
            print(f"DEBUG: Customer profile found: {customer}")
            
            try:
                # Note the change from context_id__context to context__context
                new_status = Status.objects.get(status='New', context__context='ConnectionRequest')
                print(f"DEBUG: Found new status: {new_status}")
                serializer.save(customer=customer, status=new_status)
                print(f"DEBUG: Successfully saved connection request with status")
            except Status.DoesNotExist:
                print(f"DEBUG: Status with 'New' and context 'ConnectionRequest' not found")
                # You might want to handle this case, perhaps with a default status
            except Exception as e:
                print(f"DEBUG: Exception occurred: {str(e)}")
        else:
            # Employee creating a connection request
            print(f"DEBUG: No customer profile, assuming employee")
            try:
                # Let's try to set the status for employees too
                new_status = Status.objects.get(status='New', context__context='ConnectionRequest')
                serializer.save(status=new_status)
                print(f"DEBUG: Successfully saved connection request as employee with status")
            except Status.DoesNotExist:
                print(f"DEBUG: Status not found for employee path, saving without status")
                serializer.save()
                print(f"DEBUG: Saved without status")
            except Exception as e:
                print(f"DEBUG: Exception in employee path: {str(e)}")
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def assign_technician(self, request, pk=None):
        connection_request = self.get_object()
        employee_id = request.data.get('employee_id')
        
        try:
            employee = Employee.objects.get(id=employee_id)
        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        
        assignment = connection_request.assign_technician(employee)
        
        # Update status to "In Progress"
        in_progress_status = Status.objects.get(status='In Progress')
        connection_request.status = in_progress_status
        connection_request.save()
        
        return Response({'status': 'Technician assigned successfully'})
    
    @action(detail=True, methods=['post'], permission_classes=[IsManager | IsAdmin])
    def mark_completed(self, request, pk=None):
        connection_request = self.get_object()
        connection_request.mark_as_completed()
        return Response({'status': 'Connection request marked as completed and contract created'})

# Contract views
class ContractViewSet(viewsets.ModelViewSet):
    queryset = Contract.objects.all().order_by('-created_at')
    serializer_class = ContractSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['customer__user__first_name', 'customer__user__last_name', 'customer__phone_number']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if hasattr(user, 'customer_profile'):
            return queryset.filter(customer=user.customer_profile)
        
        # Filter by active status if requested
        active_only = self.request.query_params.get('active', None)
        if active_only == 'true':
            queryset = queryset.filter(Q(end_date__isnull=True) | Q(end_date__gt=now()))
        
        return queryset
    
    @action(detail=True, methods=['post'], permission_classes=[IsManager])
    def add_equipment(self, request, pk=None):
        contract = self.get_object()
        equipment_id = request.data.get('equipment_id')
        
        try:
            equipment = Equipment.objects.get(id=equipment_id)
            if equipment.stock_quantity <= 0:
                return Response({'error': 'Equipment not in stock'}, status=status.HTTP_400_BAD_REQUEST)
            
            contract_equipment = ContractEquipment.objects.create(
                contract=contract,
                equipment=equipment
            )
            
            serializer = ContractEquipmentSerializer(contract_equipment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Equipment.DoesNotExist:
            return Response({'error': 'Equipment not found'}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'], permission_classes=[IsAdminUser | IsCustomer])
    def export_pdf(self, request, pk=None):
        contract = self.get_object()
        
        # Ensure customer can only export their own contract
        if hasattr(request.user, 'customer_profile') and request.user.customer_profile != contract.customer:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get related data
        invoices = Invoice.objects.filter(contract=contract)
        equipments = ContractEquipment.objects.filter(contract=contract)
        
        # Create a file-like buffer to receive PDF data
        buffer = io.BytesIO()
        
        # Create the PDF object using the buffer as its "file"
        doc = SimpleDocTemplate(buffer, pagesize=letter, 
                                rightMargin=72, leftMargin=72,
                                topMargin=72, bottomMargin=18)
        
        # Container for the 'Flowable' objects
        elements = []
        
        # Define styles
        styles = getSampleStyleSheet()
        title_style = styles['Heading1']
        title_style.alignment = 1  # Center alignment
        
        subtitle_style = styles['Heading2']
        normal_style = styles['Normal']
        
        # Add company logo and header info
        elements.append(Paragraph(f"Contract #{contract.id}", title_style))
        elements.append(Spacer(1, 0.25*inch))
        
        # Add date
        date_text = f"Generated on: {datetime.now().strftime('%B %d, %Y')}"
        elements.append(Paragraph(date_text, normal_style))
        elements.append(Spacer(1, 0.25*inch))
        
        # Customer Information
        elements.append(Paragraph("Customer Information", subtitle_style))
        customer_data = [
            ["Name:", f"{contract.customer.user.first_name} {contract.customer.user.last_name}"],
            ["Email:", contract.customer.user.email],
            ["Phone:", contract.customer.phone_number],
        ]
        customer_table = Table(customer_data, colWidths=[1.5*inch, 4*inch])
        customer_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.25, colors.lightgrey),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(customer_table)
        elements.append(Spacer(1, 0.25*inch))
        
        # Contract Details
        elements.append(Paragraph("Contract Details", subtitle_style))
        contract_data = [
            ["Service:", contract.service.name],
            ["Tariff:", contract.tariff.name if contract.tariff else "N/A"],
            ["Monthly Price:", f"${float(contract.tariff.price):.2f}" if contract.tariff else "N/A"],
            ["Address:", str(contract.address)],
            ["Start Date:", contract.start_date.strftime('%B %d, %Y')],
            ["End Date:", contract.end_date.strftime('%B %d, %Y') if contract.end_date else "Open-ended"],
            ["Status:", "Active" if contract.is_active else "Inactive"],
        ]
        contract_table = Table(contract_data, colWidths=[1.5*inch, 4*inch])
        contract_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.25, colors.lightgrey),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(contract_table)
        elements.append(Spacer(1, 0.25*inch))
        
        # Equipment
        if equipments:
            elements.append(Paragraph("Equipment", subtitle_style))
            equipment_data = [["ID", "Name", "Assigned Date"]]
            for eq in equipments:
                equipment_data.append([
                    str(eq.equipment.id),
                    eq.equipment.name,
                    eq.assigned_at.strftime('%B %d, %Y')
                ])
            equipment_table = Table(equipment_data, colWidths=[0.75*inch, 3.25*inch, 1.5*inch])
            equipment_table.setStyle(TableStyle([
                ('GRID', (0, 0), (-1, -1), 0.25, colors.lightgrey),
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('PADDING', (0, 0), (-1, -1), 6),
                ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ]))
            elements.append(equipment_table)
            elements.append(Spacer(1, 0.25*inch))
        
        # Invoices
        if invoices:
            elements.append(Paragraph("Invoices", subtitle_style))
            invoice_data = [["ID", "Amount", "Due Date", "Status"]]
            for inv in invoices:
                invoice_data.append([
                    str(inv.id),
                    f"${float(inv.amount):.2f}",
                    inv.due_date.strftime('%B %d, %Y'),
                    inv.status
                ])
            invoice_table = Table(invoice_data, colWidths=[0.75*inch, 1.25*inch, 1.5*inch, 2*inch])
            invoice_table.setStyle(TableStyle([
                ('GRID', (0, 0), (-1, -1), 0.25, colors.lightgrey),
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('PADDING', (0, 0), (-1, -1), 6),
                ('ALIGN', (0, 0), (0, -1), 'CENTER'),
                ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ]))
            elements.append(invoice_table)
            elements.append(Spacer(1, 0.25*inch))
        
        # Terms and conditions (optional)
        elements.append(Paragraph("Terms and Conditions", subtitle_style))
        terms_text = """This document serves as a summary of contract information between the service provider and the customer. 
        All services are subject to the full terms and conditions specified in the original contract agreement. 
        For any questions, please contact customer service."""
        elements.append(Paragraph(terms_text, normal_style))
        
        # Footer with page numbers
        def add_page_number(canvas, doc):
            canvas.saveState()
            canvas.setFont('Helvetica', 9)
            page_number_text = f"Page {canvas.getPageNumber()}"
            canvas.drawRightString(letter[0] - 72, 0.5 * inch, page_number_text)
            canvas.restoreState()
        
        # Build PDF
        doc.build(elements, onFirstPage=add_page_number, onLaterPages=add_page_number)
        
        # FileResponse sets the Content-Disposition header so that browsers
        # present the option to save the file.
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="contract_{contract.id}.pdf"'
        
        return response

# Payment views
class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all().order_by('-payment_date')
    serializer_class = PaymentSerializer
    
    def get_permissions(self):
        permission_classes = [IsAdmin | IsManager | IsCustomer]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if hasattr(user, 'customer_profile'):
            return queryset.filter(customer=user.customer_profile)
        
        return queryset
    
    def perform_create(self, serializer):
        # Get the customer profile from the current user
        customer = self.request.user.customer_profile
        # Save the payment with the customer set properly
        payment = serializer.save(customer=customer)
        payment.apply_to_balance()  # Apply payment to customer balance

    # Add this method to your PaymentViewSet class
    @action(detail=True, methods=['get'], permission_classes=[IsAdmin | IsManager | IsCustomer])
    def generate_receipt(self, request, pk=None):
        payment = self.get_object()
        
        # Ensure customer can only access their own payment receipt
        if hasattr(request.user, 'customer_profile') and request.user.customer_profile != payment.customer:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        # Create a file-like buffer to receive PDF data
        buffer = io.BytesIO()
        
        # Create the PDF object using the buffer as its "file"
        doc = SimpleDocTemplate(buffer, pagesize=letter, 
                            rightMargin=72, leftMargin=72,
                            topMargin=72, bottomMargin=18)
        
        # Container for the 'Flowable' objects
        elements = []
        
        # Define styles
        styles = getSampleStyleSheet()
        title_style = styles['Heading1']
        title_style.alignment = 1  # Center alignment
        
        subtitle_style = styles['Heading2']
        subtitle_style.alignment = 1  # Center
        
        normal_style = styles['Normal']
        
        # Add company header
        elements.append(Paragraph("PAYMENT RECEIPT", title_style))
        elements.append(Spacer(1, 0.25*inch))
        
        # Add receipt number and date
        receipt_text = f"Receipt #{payment.id}"
        elements.append(Paragraph(receipt_text, subtitle_style))
        elements.append(Spacer(1, 0.1*inch))
        
        date_text = f"Date: {payment.payment_date.strftime('%B %d, %Y')}"
        elements.append(Paragraph(date_text, subtitle_style))
        elements.append(Spacer(1, 0.5*inch))
        
        # Customer Information
        customer = payment.customer
        elements.append(Paragraph("Customer Details:", styles['Heading3']))
        customer_data = [
            ["Name:", f"{customer.user.first_name} {customer.user.last_name}"],
            ["Account #:", f"{customer.id}"],
            ["Email:", customer.user.email],
            ["Phone:", customer.phone_number],
        ]
        customer_table = Table(customer_data, colWidths=[1.5*inch, 4*inch])
        customer_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.25, colors.lightgrey),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(customer_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Payment Details
        elements.append(Paragraph("Payment Details:", styles['Heading3']))
        payment_data = [
            ["Payment Method:", payment.method.method],
            ["Amount:", f"${float(payment.amount):.2f}"],
            ["Payment Date:", payment.payment_date.strftime('%B %d, %Y %H:%M')],
            ["Transaction ID:", str(payment.id)],
        ]
        payment_table = Table(payment_data, colWidths=[1.5*inch, 4*inch])
        payment_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.25, colors.lightgrey),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(payment_table)
        elements.append(Spacer(1, 0.5*inch))
        
        # Summary
        elements.append(Paragraph("Payment Summary", styles['Heading3']))
        summary_data = [["Description", "Amount"]]
        summary_data.append(["Service payment", f"${float(payment.amount):.2f}"])
        summary_data.append(["Total", f"${float(payment.amount):.2f}"])
        
        summary_table = Table(summary_data, colWidths=[4*inch, 1.5*inch])
        summary_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.25, colors.lightgrey),
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 0.5*inch))
        
        # Thank you note
        thank_you_style = ParagraphStyle(
            'ThankYou',
            parent=normal_style,
            alignment=1,  # Center
            fontSize=11
        )
        elements.append(Paragraph("Thank you for your payment!", thank_you_style))
        elements.append(Spacer(1, 0.1*inch))
        elements.append(Paragraph("This is an official receipt for your records.", thank_you_style))
        
        # Add footer with company info
        footer_style = ParagraphStyle(
            'Footer',
            parent=normal_style,
            fontSize=8,
            alignment=1  # Center
        )
        elements.append(Spacer(1, 1*inch))
        elements.append(Paragraph("Your ISP <3", footer_style))
        elements.append(Paragraph("support@not.polynet", footer_style))
        
        # Build PDF
        doc.build(elements)
        
        # FileResponse sets the Content-Disposition header so that browsers
        # present the option to save the file.
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="payment_receipt_{payment.id}.pdf"'
        
        return response

# Invoice views
class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by('-issue_date')
    serializer_class = InvoiceSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if hasattr(user, 'customer_profile'):
            return queryset.filter(contract__customer=user.customer_profile)
        
        # Filter by status if requested
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    @action(detail=True, methods=['post'], permission_classes=[IsManager | IsAdmin])
    def mark_paid(self, request, pk=None):
        invoice = self.get_object()
        invoice.status = 'paid'
        invoice.save()
        return Response({'status': 'Invoice marked as paid'})
    
    @action(detail=False, methods=['post'], permission_classes=[IsManager | IsAdmin])
    def check_overdue(self, request):
        overdue_invoices = Invoice.overdue()
        return Response({
            'status': 'Overdue check completed',
            'overdue_count': overdue_invoices.count()
        })

    @action(detail=True, methods=['get'], permission_classes=[IsAdmin | IsManager | IsCustomer])
    def generate_pdf(self, request, pk=None):
        invoice = self.get_object()
        
        # Ensure customer can only access their own invoice
        if hasattr(request.user, 'customer_profile') and request.user.customer_profile != invoice.contract.customer:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        # Create a file-like buffer to receive PDF data
        buffer = io.BytesIO()
        
        # Create the PDF object using the buffer as its "file"
        doc = SimpleDocTemplate(buffer, pagesize=letter, 
                            rightMargin=72, leftMargin=72,
                            topMargin=72, bottomMargin=18)
        
        # Container for the 'Flowable' objects
        elements = []
        
        # Define styles
        styles = getSampleStyleSheet()
        title_style = styles['Heading1']
        title_style.alignment = 1  # Center alignment
        
        subtitle_style = styles['Heading2']
        normal_style = styles['Normal']
        
        # Add invoice header
        elements.append(Paragraph("INVOICE", title_style))
        elements.append(Spacer(1, 0.25*inch))
        
        # Company and invoice information
        company_info = [
            ["Your ISP <3", f"Invoice #: {invoice.id}"],
            ["123 Internet Street", f"Issue Date: {invoice.issue_date.strftime('%B %d, %Y')}"],
            ["Network City, ST 12345", f"Due Date: {invoice.due_date.strftime('%B %d, %Y')}"],
            ["Phone: +18174820667", f"Status: {invoice.status.upper()}"]
        ]
        
        company_table = Table(company_info, colWidths=[3*inch, 2.5*inch])
        company_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (0, 0), 14),
        ]))
        elements.append(company_table)
        elements.append(Spacer(1, 0.25*inch))
        
        # Divider
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.grey))
        elements.append(Spacer(1, 0.25*inch))
        
        # Customer information
        customer = invoice.contract.customer
        elements.append(Paragraph("BILL TO:", styles['Heading3']))
        address = invoice.contract.address if hasattr(invoice.contract, 'address') else None

        customer_info = [
            [f"{customer.user.first_name} {customer.user.last_name}"],
            [f"Account #: {customer.id}"],
            [f"{address.street}, Apt {address.apartment}, Bldg {address.building}" if address else ''],
            [f"{address.city}, {address.region.name}" if address and hasattr(address, 'region') and address.region else ''],
            [f"Phone: {customer.phone_number}"],
            [f"Email: {customer.user.email}"]
        ]
        
        customer_table = Table(customer_info, colWidths=[3*inch])
        customer_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
        ]))
        elements.append(customer_table)
        elements.append(Spacer(1, 0.25*inch))
        
        # Service information
        elements.append(Paragraph("SERVICE DETAILS:", styles['Heading3']))
        service_info = [
            ["Service", "Period", "Rate", "Amount"]
        ]
        
        # Service line items
        service_info.append([
            invoice.contract.service.name,
            f"{invoice.period_start.strftime('%m/%d/%Y')} - {invoice.period_end.strftime('%m/%d/%Y')}" if hasattr(invoice, 'period_start') and hasattr(invoice, 'period_end') else 'Monthly Service',
            f"${float(invoice.contract.tariff.price):.2f}/mo" if invoice.contract.tariff else "",
            f"${float(invoice.amount):.2f}"
        ])
        
        # Add any additional charges if applicable
        # This is a placeholder - you would need to modify according to your actual data structure
        if hasattr(invoice, 'additional_charges') and invoice.additional_charges:
            for charge in invoice.additional_charges:
                service_info.append([
                    charge.description,
                    "",
                    "",
                    f"${float(charge.amount):.2f}"
                ])
        
        # Add total row
        service_info.append([
            "",
            "",
            "Total Due:",
            f"${float(invoice.amount):.2f}"
        ])
        
        col_widths = [2.5*inch, 1.5*inch, 1.25*inch, 1*inch]
        service_table = Table(service_info, colWidths=col_widths)
        service_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -2), 0.25, colors.lightgrey),
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (2, 1), (3, -1), 'RIGHT'),  # Align price columns to the right
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),  # Header row bold
            ('FONTNAME', (2, -1), (3, -1), 'Helvetica-Bold'),  # Total row bold
            ('LINEABOVE', (0, -1), (-1, -1), 1, colors.black),  # Line above total
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(service_table)
        elements.append(Spacer(1, 0.5*inch))
        
        # Payment instructions
        payment_title_style = ParagraphStyle(
            'PaymentTitle',
            parent=styles['Heading3'],
            spaceAfter=6
        )
        elements.append(Paragraph("PAYMENT INSTRUCTIONS", payment_title_style))
        
        payment_text = """
        Please pay by the due date to avoid service interruption. You can pay online at www.yourisp.com/pay 
        or by calling customer service at +18174820667.
        """
        elements.append(Paragraph(payment_text, normal_style))
        
        # Thank you note
        elements.append(Spacer(1, 0.25*inch))
        thank_you_style = ParagraphStyle(
            'ThankYou',
            parent=normal_style,
            fontSize=10,
            alignment=1  # Center
        )
        elements.append(Paragraph("Thank you for your business!", thank_you_style))
        
        # Footer
        def add_footer(canvas, doc):
            canvas.saveState()
            canvas.setFont('Helvetica', 8)
            footer_text = "For questions about this invoice, please contact customer service."
            canvas.drawCentredString(letter[0]/2, 0.5*inch, footer_text)
            canvas.restoreState()
        
        # Build PDF
        doc.build(elements, onFirstPage=add_footer, onLaterPages=add_footer)
        
        # FileResponse sets the Content-Disposition header so that browsers
        # present the option to save the file.
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="invoice_{invoice.id}.pdf"'
        
        return response

class SupportTicketViewSet(viewsets.ModelViewSet):
    queryset = SupportTicket.objects.all().order_by('-created_at')
    serializer_class = SupportTicketSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['subject', 'description', 'customer__user__first_name', 'customer__user__last_name']

    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [IsCustomer]
        elif self.action in ['list', 'retrieve']:
            permission_classes = [IsSupport | IsManager | IsAdmin | IsCustomer]
        else:
            permission_classes = [IsAdmin | IsSupport]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if hasattr(user, 'customer_profile'):
            queryset = queryset.filter(customer=user.customer_profile)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        default_status = Status.objects.get(status='New', context__context='SupportTicket')
        
        if hasattr(user, 'customer_profile'):
            serializer.save(customer=user.customer_profile, status=default_status)
        else:
            serializer.save(status=default_status)

    @action(detail=True, methods=['post'], permission_classes=[IsManager])
    def assign_to_employee(self, request, pk=None):
        ticket = self.get_object()
        employee_id = request.data.get('employee_id')

        try:
            employee = Employee.objects.get(id=employee_id)
            ticket.assign_employee(employee)
            return Response({'status': 'Ticket assigned successfully'})
        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
            
# Employee views
class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['user__first_name', 'user__last_name', 'user__email']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsManager | IsAdminUser]
        else:
            permission_classes = [IsManager]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # If employee is viewing, they can only see their own profile
        user = self.request.user
        if hasattr(user, 'employee_profile') and not hasattr(user.employee_profile.role, 'name') or user.employee_profile.role.name.lower() != 'manager':
            return queryset.filter(id=user.employee_profile.id)
        
        return queryset

# Role views
class EmployeeRoleViewSet(viewsets.ModelViewSet):
    queryset = EmployeeRole.objects.all()
    serializer_class = EmployeeRoleSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [IsManager]
        return [permission() for permission in permission_classes]

class StatusViewSet(viewsets.ModelViewSet):
    queryset = Status.objects.all()
    serializer_class = StatusSerializer
    
    def get_queryset(self):
        queryset = Status.objects.all()
        context_name = self.request.query_params.get('context_name', None)
        
        if context_name is not None:
            queryset = queryset.filter(context__context=context_name)
            
        return queryset

# Payment Method views
class ReadOnlyOrAdmin(BasePermission):
    """
    Allow read access to anyone, but write access only to admins.
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:  # GET, HEAD, OPTIONS
            return True
        return request.user and request.user.is_staff

class PaymentMethodViewSet(viewsets.ModelViewSet):
    queryset = PaymentMethod.objects.all()
    serializer_class = PaymentMethodSerializer
    permission_classes = [ReadOnlyOrAdmin]

# Equipment views
class EquipmentViewSet(viewsets.ModelViewSet):
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'serial_number', 'category__name']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [IsManager]
        return [permission() for permission in permission_classes]

# Equipment Category views
class EquipmentCategoryViewSet(viewsets.ModelViewSet):
    queryset = EquipmentCategory.objects.all()
    serializer_class = EquipmentCategorySerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [IsManager]
        return [permission() for permission in permission_classes]

# Network Usage views
class NetworkUsageViewSet(viewsets.ModelViewSet):
    queryset = NetworkUsage.objects.all().order_by('-date')
    serializer_class = NetworkUsageSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAdminUser | IsCustomer]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if hasattr(user, 'customer_profile'):
            return queryset.filter(contract__customer=user.customer_profile)
        
        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        # Filter by contract if provided
        contract_id = self.request.query_params.get('contract')
        if contract_id:
            queryset = queryset.filter(contract_id=contract_id)
            
        return queryset
    
    @action(detail=False, methods=['get'], permission_classes=[IsManager])
    def summary(self, request):
        """
        Get summary statistics of network usage
        """
        days = int(request.query_params.get('days', 30))
        start_date = now() - timedelta(days=days)
        
        # Get total download/upload by day
        daily_usage = NetworkUsage.objects.filter(
            date__gte=start_date
        ).values('date').annotate(
            total_download=Sum('download_mb'),
            total_upload=Sum('upload_mb'),
            active_contracts=Count('contract', distinct=True)
        ).order_by('date')
        
        return Response(list(daily_usage))

# User management views
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['first_name', 'last_name', 'email']
    
    def get_permissions(self):
        if self.action in ['retrieve']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsManager]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if not hasattr(user, 'employee_profile') or user.employee_profile.role.name.lower() != 'manager':
            return queryset.filter(id=user.id)
        
        return queryset
    
    # Additional actions in UserViewSet
    @action(detail=True, methods=['post'], permission_classes=[IsManager])
    def assign_role(self, request, pk=None):
        """Assign a role to a user by creating or updating their employee profile"""
        user = self.get_object()
        role_id = request.data.get('role_id')
        
        if not role_id:
            return Response({'error': 'Role ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            role = EmployeeRole.objects.get(id=role_id)
            
            # Check if user is already an employee
            if hasattr(user, 'employee_profile'):
                # Update existing employee
                user.employee_profile.role = role
                user.employee_profile.save()
            else:
                # Create new employee profile
                Employee.objects.create(user=user, role=role)
                
            return Response({'status': 'Role assigned successfully'})
        except EmployeeRole.DoesNotExist:
            return Response({'error': 'Role not found'}, status=status.HTTP_404_NOT_FOUND)

    # Management Dashboard in EmployeeViewSet
    @action(detail=False, methods=['get'], permission_classes=[IsManager])
    def dashboard(self, request):
        """Management dashboard with key metrics"""
        # Get counts
        active_customers = Customer.objects.filter(status__status='Active').count()
        pending_requests = ConnectionRequest.objects.filter(status__status='New').count()
        open_tickets = SupportTicket.objects.filter(status='open').count()
        overdue_invoices = Invoice.objects.filter(status='overdue').count()
        
        # Recent activities
        recent_payments = Payment.objects.all().order_by('-payment_date')[:5]
        recent_tickets = SupportTicket.objects.all().order_by('-created_at')[:5]
        
        # Revenue data
        last_month = now() - timedelta(days=30)
        monthly_revenue = Payment.objects.filter(
            payment_date__gte=last_month
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        data = {
            'counts': {
                'active_customers': active_customers,
                'pending_requests': pending_requests,
                'open_tickets': open_tickets,
                'overdue_invoices': overdue_invoices,
            },
            'monthly_revenue': float(monthly_revenue),
            'recent_payments': PaymentSerializer(recent_payments, many=True).data,
            'recent_tickets': SupportTicketSerializer(recent_tickets, many=True).data
        }
        
        return Response(data)