from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import SupportTicket
from .services.assignment import auto_assign_technician

@receiver(post_save, sender=SupportTicket)
def on_ticket_created(sender, instance, created, **kwargs):
    """
    Automatically assign technical tickets on creation.
    """
    if created and instance.ticket_type == 'technical':
        auto_assign_technician(instance)
