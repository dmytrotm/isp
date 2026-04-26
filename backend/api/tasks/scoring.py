from celery import shared_task
import logging
from ..models import Customer
from ..services.scoring import calculate_customer_score

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def calculate_all_scores(self):
    """
    Weekly task to recalculate reliability scores for all active customers.
    """
    try:
        active_customers = Customer.objects.filter(status__status__iexact='Active').select_related('user')
        
        success_count = 0
        failure_count = 0
        
        for customer in active_customers:
            try:
                score_obj = calculate_customer_score(customer)
                score_obj.save()
                success_count += 1
            except Exception as e:
                logger.error(f"Failed to calculate score for customer {customer.id}: {str(e)}")
                failure_count += 1
                
        return f"Scoring complete. Success: {success_count}, Failures: {failure_count}"
    except Exception as exc:
        self.retry(exc=exc)
