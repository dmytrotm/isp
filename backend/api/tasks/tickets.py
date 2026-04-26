from celery import shared_task
from django.utils import timezone
from ..models import SupportTicket

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def check_sla_breaches(self):
    """
    Checks for open tickets that have exceeded their SLA deadline.
    """
    try:
        tickets = SupportTicket.objects.filter(
            status__context__context='SupportTicket',
            status__status__in=['Open', 'In Progress', 'New'],
            sla_deadline__lt=timezone.now(),
            is_sla_breached=False
        )
        
        count = tickets.count()
        if count > 100:
            tickets.update(is_sla_breached=True)
        else:
            for ticket in tickets:
                ticket.is_sla_breached = True
                ticket.save(update_fields=['is_sla_breached'])
                
        return f"Marked {count} tickets as SLA breached."
    except Exception as exc:
        self.retry(exc=exc)
