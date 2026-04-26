from django.core.mail import send_mail
from django.conf import settings
import logging
from ..models import Notification

logger = logging.getLogger(__name__)

def send_notification(customer, notification_type, message):
    """
    Creates a Notification record and optionally sends an email.
    """
    # Create DB record
    notif = Notification.objects.create(
        customer=customer,
        notification_type=notification_type,
        message=message
    )
    
    # Send email if preferred
    if customer.preferred_notification == 'email':
        try:
            send_mail(
                subject=f"Notification: {notification_type.replace('_', ' ').title()}",
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[customer.user.email],
                fail_silently=False,
            )
        except Exception as e:
            logger.error(f"Failed to send email to {customer.user.email}: {str(e)}")
            
    return notif
