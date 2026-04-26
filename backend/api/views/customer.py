from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction

from ..models import (
    Customer, Address, Region, Status, Contract, Invoice, Payment, 
    SupportTicket, NetworkUsage, BalanceTransaction, ClientScore, Notification
)
from ..serializers import (
    CustomerSerializer, CustomerCreateSerializer, AddressSerializer, RegionSerializer,
    CustomerDashboardSerializer, ContractSerializer, InvoiceSerializer, PaymentSerializer,
    SupportTicketSerializer, NetworkUsageSerializer, CustomerDetailSerializer, 
    BalanceTransactionSerializer, ClientScoreSerializer, NotificationSerializer
)
from ..utils.permissions import IsCustomer, IsManager, IsSupport, IsAdmin
from ..utils.pagination import StandardResultsSetPagination
from ..utils.mixins import StandardResponseMixin

class CustomerViewSet(StandardResponseMixin, viewsets.ModelViewSet):
    queryset = Customer.objects.select_related("user", "status").prefetch_related("addresses")
    serializer_class = CustomerSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__first_name', 'user__last_name', 'user__email', 'phone_number']
    ordering_fields = ['user__last_name', 'user__first_name', 'user__email', 'created_at', 'balance']
    ordering = ['user__last_name', 'user__first_name']
    pagination_class = StandardResultsSetPagination
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CustomerCreateSerializer
        if self.action in ['retrieve', 'customer_details']:
            return CustomerDetailSerializer
        return CustomerSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if hasattr(user, 'customer_profile'):
            return queryset.filter(id=user.customer_profile.id)
        
        # Admin/Manager filters
        status_filter = self.request.query_params.get('status')
        if status_filter:
            try:
                status_id = int(status_filter)
                queryset = queryset.filter(status=status_id)
            except (ValueError, TypeError):
                queryset = queryset.filter(status__status__iexact=status_filter)
                
        return queryset

    def perform_create(self, serializer):
        try:
            default_status = Status.objects.get(status='New', context__context='Customer')
            serializer.save(status=default_status)
        except Status.DoesNotExist:
            serializer.save()
        except Status.MultipleObjectsReturned:
            default_status = Status.objects.filter(status='New', context__context='Customer').first()
            serializer.save(status=default_status)
    
    @action(detail=True, methods=['get'], permission_classes=[IsCustomer | IsManager | IsSupport | IsAdmin])
    def dashboard(self, request, pk=None):      
        customer = self.get_object()
        
        if hasattr(request.user, 'customer_profile') and request.user.customer_profile.id != customer.id:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        total_monthly_payment = customer.get_total_monthly_payment()
        serializer = CustomerDashboardSerializer(customer)
        data = serializer.data
        data['total_monthly_payment'] = float(total_monthly_payment)
        
        return Response(data)
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def contracts(self, request, pk=None):
        customer = self.get_object()
        queryset = Contract.objects.filter(customer=customer)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = ContractSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = ContractSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def invoices(self, request, pk=None):
        customer = self.get_object()
        queryset = Invoice.objects.filter(contract__customer=customer).order_by('-issue_date')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = InvoiceSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = InvoiceSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def payments(self, request, pk=None):
        customer = self.get_object()
        queryset = Payment.objects.filter(customer=customer).order_by('-payment_date')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = PaymentSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = PaymentSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def support_tickets(self, request, pk=None):
        customer = self.get_object()
        queryset = SupportTicket.objects.filter(customer=customer).order_by('-created_at')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = SupportTicketSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = SupportTicketSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def network_usage(self, request, pk=None):
        customer = self.get_object()
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        usage_query = NetworkUsage.objects.filter(contract__customer=customer)
        if start_date:
            usage_query = usage_query.filter(date__gte=start_date)
        if end_date:
            usage_query = usage_query.filter(date__lte=end_date)
            
        queryset = usage_query.order_by('-date')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = NetworkUsageSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = NetworkUsageSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['patch'], permission_classes=[IsCustomer])
    def update_profile(self, request):
        try:
            customer = Customer.objects.get(user=request.user)
            user = customer.user
            
            # Update user fields
            for field in ['first_name', 'last_name']:
                if field in request.data:
                    setattr(user, field, request.data[field])
            user.save()
            
            # Update customer fields
            if 'phone_number' in request.data:
                customer.phone_number = request.data['phone_number']
            customer.save()
            
            return Response(CustomerSerializer(customer).data)
        except Customer.DoesNotExist:
            return Response({"detail": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def transactions(self, request, pk=None):
        customer = self.get_object()
        
        # Permission check
        user = request.user
        is_manager = user.groups.filter(name__in=['Manager', 'Admin']).exists() or user.is_superuser
        is_owner = hasattr(user, 'customer_profile') and user.customer_profile.id == customer.id
        
        if not (is_manager or is_owner):
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
            
        from ..models import BalanceTransaction
        from ..serializers import BalanceTransactionSerializer
        
        transactions = BalanceTransaction.objects.filter(customer=customer).order_by('-created_at')
        
        page = self.paginate_queryset(transactions)
        if page is not None:
            serializer = BalanceTransactionSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = BalanceTransactionSerializer(transactions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def scores(self, request, pk=None):
        customer = self.get_object()
        
        # Permission check
        user = request.user
        is_manager = user.groups.filter(name__in=['Manager', 'Admin']).exists() or user.is_superuser
        is_owner = hasattr(user, 'customer_profile') and user.customer_profile.id == customer.id
        
        if not (is_manager or is_owner):
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
            
        scores = ClientScore.objects.filter(customer=customer).order_by('-calculated_at')[:10]
        serializer = ClientScoreSerializer(scores, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def notifications(self, request, pk=None):
        customer = self.get_object()
        
        # Permission check: owner only
        if not (hasattr(request.user, 'customer_profile') and request.user.customer_profile.id == customer.id):
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
            
        unread_notifications = Notification.objects.filter(customer=customer, is_read=False).order_by('-created_at')
        serializer = NotificationSerializer(unread_notifications, many=True)
        
        # Mark as read after fetch
        unread_notifications.update(is_read=True)
        
        return Response(serializer.data)

    # Management actions
    @action(detail=True, methods=['GET'], url_path='details', permission_classes=[IsManager | IsAdmin])
    def customer_details(self, request, pk=None):
        return self.retrieve(request, pk)

    @action(detail=False, methods=['GET'], url_path='export_csv', permission_classes=[IsManager | IsAdmin])
    def export_csv(self, request):
        from ..services.csv_service import CSVService
        from django.http import HttpResponse
        
        queryset = self.filter_queryset(self.get_queryset())
        csv_data = CSVService.export_customers(queryset)
        
        response = HttpResponse(csv_data, content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="customers.csv"'
        return response

    @action(detail=False, methods=['POST'], url_path='import_csv', permission_classes=[IsManager | IsAdmin])
    def import_csv(self, request):
        from ..services.csv_service import CSVService
        csv_file = request.FILES.get('csv_file')
        if not csv_file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
            
        created_count, errors = CSVService.import_customers(csv_file)
        if errors:
            return Response({'created': created_count, 'errors': errors}, status=status.HTTP_207_MULTI_STATUS)
        return Response({'created': created_count}, status=status.HTTP_201_CREATED)

class AddressViewSet(StandardResponseMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Address.objects.select_related("region", "customer")
    serializer_class = AddressSerializer
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'customer_profile'):
            return self.queryset.filter(customer=user.customer_profile)
        return self.queryset
    
    def perform_create(self, serializer):
        if hasattr(self.request.user, 'customer_profile'):
            serializer.save(customer=self.request.user.customer_profile)
        else:
            serializer.save()

class RegionViewSet(StandardResponseMixin, viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Region.objects.all().order_by('name')
    serializer_class = RegionSerializer
