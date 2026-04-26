from django.db.models import Count, Q
from ..models import Employee, SupportTicket
from .notifications import send_notification

def auto_assign_technician(ticket):
    """
    Finds the available technician with the fewest open tickets.
    """
    # Find available technician
    technician = (
        Employee.objects
        .filter(
            role__name__iexact='technician',
            is_available=True
        )
        .annotate(
            open_ticket_count=Count(
                'supportticket', # Note: default related_name is supportticket or related_name='assigned_tickets'
                filter=Q(supportticket__status__status__in=['Open', 'In Progress', 'New'])
            )
        )
        .order_by('open_ticket_count')
        .first()
    )
    
    if technician is None:
        return None
    
    ticket.assigned_to = technician
    
    # Update status to 'Open' if it was 'New'
    try:
        from ..models import Status
        open_status = Status.objects.filter(status='Open', context__context='SupportTicket').first()
        if open_status:
            ticket.status = open_status
    except Exception:
        pass
        
    ticket.save(update_fields=['assigned_to', 'status'])
    
    # Try sending notification if possible
    try:
        # Check if technician has a customer profile (unlikely but following logic)
        # Or just use the service to create a Notification record for the employee
        send_notification(
            customer=technician.user.customer_profile if hasattr(technician.user, 'customer_profile') else None,
            notification_type='ticket_assigned',
            message=f'You have been assigned to ticket #{ticket.id}: {ticket.subject}'
        )
    except Exception:
        pass
        
    return technician
