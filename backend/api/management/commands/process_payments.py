from django.core.management.base import BaseCommand
from django.utils.timezone import now
from django.db.models import Q
from api.models import Customer, Invoice

class Command(BaseCommand):
    help = 'Process payments for pending invoices using customer balances'

    def handle(self, *args, **options):
        self.stdout.write('Starting automatic payment processing...')
        
        # Get all customers with positive balance
        customers = Customer.objects.filter(balance__gt=0)
        
        total_paid = 0
        
        for customer in customers:
            # Get pending or overdue invoices for this customer, ordered by due date
            pending_invoices = Invoice.objects.filter(
                contract__customer=customer,
                status__in=['pending', 'overdue']
            ).order_by('due_date')
            
            for invoice in pending_invoices:
                if customer.balance >= invoice.amount:
                    original_balance = customer.balance
                    
                    # Deduct the amount from the balance
                    customer.balance -= invoice.amount
                    customer.save()
                    
                    # Mark invoice as paid
                    invoice.status = 'paid'
                    invoice.save()
                    
                    self.stdout.write(self.style.SUCCESS(
                        f'Paid invoice #{invoice.id} for {customer.user.first_name} {customer.user.last_name} '
                        f'(Amount: {invoice.amount}₴, Balance before: {original_balance}₴, Balance after: {customer.balance}₴)'
                    ))
                    
                    total_paid += 1
                else:
                    break
                    
        self.stdout.write(self.style.SUCCESS(f'Successfully processed {total_paid} payments'))
