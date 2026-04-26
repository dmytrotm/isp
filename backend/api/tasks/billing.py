from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from django.db.models import Prefetch
from ..models import Customer, Contract, Notification
from ..services.billing import record_transaction
from ..services.notifications import send_notification

@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def check_negative_balances(self):
    """
    Suspends active contracts for customers with negative balance for > 3 days.
    """
    try:
        threshold = timezone.now() - timedelta(days=3)
        
        # Find customers with persistent negative balance
        customers = Customer.objects.filter(
            balance__lt=0,
            balance_negative_since__lte=threshold,
            status__status__iexact='Active'
        ).select_related('status')
        
        count = 0
        for customer in customers:
            # Suspend only contracts with overdue invoices
            from ..models import Invoice
            overdue_contract_ids = Invoice.objects.filter(
                contract__customer=customer,
                status='overdue',
                due_date__lt=timezone.now()
            ).values_list('contract_id', flat=True)

            contracts = Contract.objects.filter(
                id__in=overdue_contract_ids,
                status__in=['active', 'Active']
            )
            
            if contracts.exists():
                contracts.update(status='suspended')
                
                # Log as penalty transaction
                record_transaction(
                    customer=customer,
                    amount=0,
                    transaction_type='penalty',
                    description='Account suspended due to negative balance > 3 days'
                )
                
                # Task 3: Send suspension notification
                send_notification(
                    customer=customer,
                    notification_type='account_suspended',
                    message='Your internet service has been suspended due to prolonged negative balance. Please top up to restore access.'
                )
                
                count += 1
                
        return f"Suspended contracts for {count} customers."
    except Exception as exc:
        self.retry(exc=exc)

@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def check_low_balances(self):
    """
    Daily task to alert customers before their balance runs out.
    """
    try:
        # Load customers with their active contracts and tariffs
        active_customers = Customer.objects.filter(
            status__status__iexact='Active'
        ).prefetch_related(
            Prefetch('contracts', queryset=Contract.objects.filter(status__in=['active', 'Active']).select_related('tariff'))
        )
        
        notified_count = 0
        
        for customer in active_customers:
            # For simplicity, we check the first active contract's tariff
            active_contract = customer.contracts.first()
            if not active_contract or not active_contract.tariff:
                continue
            
            monthly_charge = active_contract.tariff.price
            daily_charge = monthly_charge / 30
            
            # Avoid division by zero
            if daily_charge <= 0:
                continue
                
            days_left = customer.balance / daily_charge
            
            if days_left <= 3:
                # Check if notification already sent today
                already_notified = Notification.objects.filter(
                    customer=customer,
                    notification_type='low_balance',
                    created_at__date=timezone.now().date()
                ).exists()
                
                if not already_notified:
                    send_notification(
                        customer=customer,
                        notification_type='low_balance',
                        message=f'Your balance will run out in approximately {days_left:.1f} days. Please top up to avoid service interruption.'
                    )
                    notified_count += 1
                    
        return f"Sent low balance notifications to {notified_count} customers."
    except Exception as exc:
        self.retry(exc=exc)
