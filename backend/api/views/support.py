from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from ..models import SupportTicket, ConnectionRequest, Status, Employee
from ..serializers import SupportTicketSerializer, ConnectionRequestSerializer
from ..utils.permissions import IsCustomer, IsSupport, IsManager, IsAdmin
from ..utils.mixins import StandardResponseMixin
from ..services.assignment import auto_assign_technician, auto_assign_connection_request

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

    @action(detail=False, methods=['post'], permission_classes=[IsAdmin | IsManager])
    def auto_assign_all(self, request):
        """
        Auto-assign all unassigned tickets.
        """
        unassigned_tickets = SupportTicket.objects.filter(assigned_to__isnull=True)
        count = 0
        for ticket in unassigned_tickets:
            if auto_assign_technician(ticket):
                count += 1
        return Response({'status': f'Successfully assigned {count} tickets'})

class ConnectionRequestViewSet(StandardResponseMixin, viewsets.ModelViewSet):
    queryset = ConnectionRequest.objects.all().order_by('-created_at')
    serializer_class = ConnectionRequestSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated()]
        return [IsAdminUser()]

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin | IsManager])
    def assign_technician(self, request, pk=None):
        conn_req = self.get_object()
        employee_id = request.data.get('employee_id')
        try:
            employee = Employee.objects.get(id=employee_id)
            conn_req.assign_technician(employee)
            return Response({'status': 'Technician assigned'})
        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], permission_classes=[IsAdmin | IsManager])
    def auto_assign_all(self, request):
        """
        Auto-assign all unassigned connection requests.
        """
        # ConnectionRequests are unassigned if they have no entries in ConnectionRequestAssignment
        unassigned_requests = ConnectionRequest.objects.filter(connectionrequestassignment__isnull=True)
        count = 0
        for conn_req in unassigned_requests:
            if auto_assign_connection_request(conn_req):
                count += 1
        return Response({'status': f'Successfully assigned {count} connection requests'})
