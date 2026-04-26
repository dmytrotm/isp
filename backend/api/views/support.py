from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from ..models import SupportTicket, ConnectionRequest, Status, Employee
from ..serializers import SupportTicketSerializer, ConnectionRequestSerializer
from ..utils.permissions import IsCustomer, IsSupport, IsManager, IsAdmin
from ..utils.mixins import StandardResponseMixin

class SupportTicketViewSet(StandardResponseMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = SupportTicket.objects.all().order_by('-created_at')
    serializer_class = SupportTicketSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['subject', 'description', 'customer__user__first_name']

    def get_permissions(self):
        if self.action == 'create':
            return [IsCustomer()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'customer_profile'):
            return self.queryset.filter(customer=user.customer_profile)
        return self.queryset

class ConnectionRequestViewSet(StandardResponseMixin, viewsets.ModelViewSet):
    queryset = ConnectionRequest.objects.all().order_by('-created_at')
    serializer_class = ConnectionRequestSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated()]
        return [IsAdminUser()]

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def assign_technician(self, request, pk=None):
        conn_req = self.get_object()
        employee_id = request.data.get('employee_id')
        try:
            employee = Employee.objects.get(id=employee_id)
            conn_req.assign_technician(employee)
            # Logic to update status...
            return Response({'status': 'Technician assigned'})
        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
