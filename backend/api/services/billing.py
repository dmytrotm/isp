from django.db import transaction
from django.utils import timezone
from ..models import BalanceTransaction, Customer

def record_transaction(customer, amount, transaction_type, description=''):
    """
    Atomic balance update and transaction logging.
    """
    with transaction.atomic():
        customer = Customer.objects.select_for_update().get(id=customer.id)
        
        # Update balance
        customer.balance += amount
        
        # Task 4 logic: Track when balance becomes negative
        if customer.balance < 0 and customer.balance_negative_since is None:
            customer.balance_negative_since = timezone.now()
        elif customer.balance >= 0:
            customer.balance_negative_since = None
            
        customer.save(update_fields=['balance', 'balance_negative_since'])
        
        # Create transaction record
        transaction_record = BalanceTransaction.objects.create(
            customer=customer,
            amount=amount,
            balance_after=customer.balance,
            transaction_type=transaction_type,
            description=description
        )
        
        return transaction_record
