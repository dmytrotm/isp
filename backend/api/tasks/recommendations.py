from celery import shared_task
import logging
from ..models import Customer
from ..services.recommendations import generate_tariff_recommendation

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def generate_all_recommendations(self):
    """
    Monthly task to generate tariff recommendations.
    """
    try:
        customers = Customer.objects.filter(contracts__status__iexact='Active').distinct()
        
        processed = 0
        created = 0
        skipped = 0
        
        for customer in customers:
            processed += 1
            try:
                rec = generate_tariff_recommendation(customer)
                if rec:
                    rec.save()
                    created += 1
                else:
                    skipped += 1
            except Exception as e:
                logger.error(f"Failed to generate recommendation for customer {customer.id}: {str(e)}")
                
        return f"Recommendations: Total {processed}, Created {created}, Skipped {skipped}"
    except Exception as exc:
        self.retry(exc=exc)
