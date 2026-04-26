from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.timezone import now
from datetime import timedelta
from django.db.models import Sum

from ..models import Employee, EmployeeRole, Customer, ConnectionRequest, SupportTicket, Invoice, Payment
from ..serializers import EmployeeSerializer, EmployeeRoleSerializer, PaymentSerializer, SupportTicketSerializer
from ..utils.permissions import IsManager, IsAdmin
from ..utils.pagination import StandardResultsSetPagination
from ..utils.mixins import StandardResponseMixin

class EmployeeViewSet(StandardResponseMixin, viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__first_name', 'user__last_name', 'user__email']
    ordering_fields = ['user__last_name', 'user__first_name', 'role__name']
    ordering = ['user__last_name', 'user__first_name']
    pagination_class = StandardResultsSetPagination
    
    def get_permissions(self):
        from ..utils.permissions import IsManagerOrAdmin
        if self.action in ['list', 'retrieve']:
            return [IsManagerOrAdmin()]
        return [IsManager()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Allow superusers and managers/admins to see all employees
        if user.is_superuser:
            return queryset
            
        if hasattr(user, 'employee_profile'):
            role_name = user.employee_profile.role.name.lower()
            if role_name in ['manager', 'admin']:
                return queryset
            return queryset.filter(id=user.employee_profile.id)
        
        return queryset

    @action(detail=False, methods=['get'], permission_classes=[IsManager])
    def dashboard(self, request):
        """Management dashboard with key metrics"""
        active_customers = Customer.objects.filter(status__status='Active').count()
        pending_requests = ConnectionRequest.objects.filter(status__status='New').count()
        open_tickets = SupportTicket.objects.exclude(status__status__in=['Resolved', 'Closed']).count()
        overdue_invoices = Invoice.objects.filter(status='overdue').count()
        
        recent_payments = Payment.objects.all().order_by('-payment_date')[:5]
        recent_tickets = SupportTicket.objects.all().order_by('-created_at')[:5]
        
        last_month = now() - timedelta(days=30)
        monthly_revenue = Payment.objects.filter(
            payment_date__gte=last_month
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        return Response({
            'counts': {
                'active_customers': active_customers,
                'pending_requests': pending_requests,
                'open_tickets': open_tickets,
                'overdue_invoices': overdue_invoices,
            },
            'monthly_revenue': float(monthly_revenue),
            'recent_payments': PaymentSerializer(recent_payments, many=True).data,
            'recent_tickets': SupportTicketSerializer(recent_tickets, many=True).data
        })

    @action(detail=False, methods=['GET'], url_path='export_csv', permission_classes=[IsManager | IsAdmin])
    def export_csv(self, request):
        from ..services.csv_service import CSVService
        from django.http import HttpResponse
        
        queryset = self.filter_queryset(self.get_queryset())
        csv_data = CSVService.export_employees(queryset)
        
        response = HttpResponse(csv_data, content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="employees.csv"'
        return response

    @action(detail=False, methods=['POST'], url_path='import_csv', permission_classes=[IsManager | IsAdmin])
    def import_csv(self, request):
        from ..services.csv_service import CSVService
        csv_file = request.FILES.get('csv_file')
        if not csv_file:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)
        
        count, errors = CSVService.import_employees(csv_file)
        return Response({
            'count': count,
            'errors': errors
        }, status=status.HTTP_201_CREATED if count > 0 else status.HTTP_400_BAD_REQUEST)

class EmployeeRoleViewSet(StandardResponseMixin, viewsets.ModelViewSet):
    queryset = EmployeeRole.objects.all().order_by('name')
    serializer_class = EmployeeRoleSerializer
    permission_classes = [IsAdmin]
