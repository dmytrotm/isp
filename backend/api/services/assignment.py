from django.db.models import Count, Q
from ..models import Employee, SupportTicket, ConnectionRequest, ConnectionRequestAssignment, Status
from .notifications import send_notification

def auto_assign_technician(ticket):
    """
    Finds the available staff with the fewest open tickets.
    Technicians for 'technical' and 'connection' tickets.
    Support staff for 'billing' and 'other' tickets.
    """
    role_name = 'technician' if ticket.ticket_type in ['technical', 'connection'] else 'Support'
    
    # Find available staff
    staff = (
        Employee.objects
        .filter(
            role__name__iexact=role_name,
            is_available=True
        )
        .annotate(
            open_ticket_count=Count(
                'supportticket',
                filter=Q(supportticket__status__status__in=['Open', 'In Progress', 'New'])
            )
        )
        .order_by('open_ticket_count')
        .first()
    )
    
    if staff is None:
        # Fallback: if no specific role available, try any available employee if it's 'other'
        if ticket.ticket_type == 'other':
            staff = Employee.objects.filter(is_available=True).annotate(
                open_ticket_count=Count('supportticket', filter=Q(supportticket__status__status__in=['Open', 'In Progress', 'New']))
            ).order_by('open_ticket_count').first()
        
    if staff is None:
        return None
    
    ticket.assigned_to = staff
    
    # Update status to 'Open' if it was 'New'
    try:
        from ..models import StatusContext
        context = StatusContext.objects.filter(context='SupportTicket').first()
        open_status = Status.objects.filter(status='Open', context=context).first()
        if open_status:
            ticket.status = open_status
    except Exception:
        pass
        
    ticket.save(update_fields=['assigned_to', 'status'])
    
    # Send notification to customer
    try:
        send_notification(
            customer=ticket.customer,
            notification_type='ticket_assigned',
            message=f'An employee has been assigned to your ticket #{ticket.id}: {ticket.subject}'
        )
    except Exception:
        pass
        
    return staff

def auto_assign_connection_request(conn_req):
    """
    Finds the available technician with the fewest open connection requests.
    """
    technician = (
        Employee.objects
        .filter(
            role__name__iexact='technician',
            is_available=True
        )
        .annotate(
            open_req_count=Count(
                'connectionrequestassignment',
                filter=Q(connectionrequest__status__status__in=['New', 'In Progress', 'Pending'])
            )
        )
        .order_by('open_req_count')
        .first()
    )
    
    if technician is None:
        return None
    
    # Check if already assigned to this technician
    if not ConnectionRequestAssignment.objects.filter(connection_request=conn_req, employee=technician).exists():
        ConnectionRequestAssignment.objects.create(
            connection_request=conn_req,
            employee=technician,
            role='technician'
        )
        
        # Update status to 'In Progress' if it was 'New'
        try:
            from ..models import StatusContext
            context = StatusContext.objects.filter(context='ConnectionRequest').first()
            in_progress_status = Status.objects.filter(status='In Progress', context=context).first()
            if in_progress_status and conn_req.status.status == 'New':
                conn_req.status = in_progress_status
                conn_req.save(update_fields=['status'])
        except Exception:
            pass
            
        # Send notification to customer
        try:
            send_notification(
                customer=conn_req.customer,
                notification_type='request_assigned',
                message=f'A technician has been assigned to your connection request #{conn_req.id}'
            )
        except Exception:
            pass
            
    return technician
