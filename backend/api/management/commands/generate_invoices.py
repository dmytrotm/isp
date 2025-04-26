from django.core.management.base import BaseCommand
from django.utils.timezone import now
from datetime import timedelta
from django.conf import settings
from django.core.mail import send_mail
from api.models import Contract, Invoice, Customer
from django.db.models import Q
from calendar import monthrange
from twilio.rest import Client

class Command(BaseCommand):
    help = 'Generate invoices for contracts due for monthly payment tomorrow and send notifications'

    def handle(self, *args, **options):
        today = now().date()
        tomorrow = today + timedelta(days=1)

        # Mark overdue invoices
        overdue_invoices = Invoice.objects.filter(due_date__date__lt=today, status='pending')
        overdue_count = overdue_invoices.update(status='overdue')

        self.stdout.write(
            self.style.WARNING(
                f'Marked {overdue_count} invoice(s) as overdue.'
            )
        )

        active_contracts = Contract.objects.filter(
            Q(end_date__isnull=True) | Q(end_date__gt=now())
        )

        self.stdout.write(f"Today: {today}, Tomorrow: {tomorrow}")
        self.stdout.write(f"Found {active_contracts.count()} active contracts")

        invoices_created = 0
        notifications_sent = 0

        for contract in active_contracts:
            start_date = contract.start_date.date()
            start_day = start_date.day
            
            year = tomorrow.year
            month = tomorrow.month
            last_day_of_month = monthrange(year, month)[1]
            billing_day_this_month = min(start_day, last_day_of_month)
            expected_billing_date = start_date.replace(year=year, month=month, day=billing_day_this_month)
            
            self.stdout.write(f"Contract ID: {contract.id}, Start date: {start_date}, Start day: {start_day}, Expected billing: {expected_billing_date}, Match with tomorrow: {expected_billing_date == tomorrow}")
            
            # Check if invoice already exists
            existing_invoice = Invoice.objects.filter(
                contract=contract,
                due_date__date=tomorrow
            ).first()
            
            if existing_invoice:
                self.stdout.write(f"  - Invoice already exists: #{existing_invoice.id}, due date: {existing_invoice.due_date.date()}")

            if expected_billing_date == tomorrow:
                if not existing_invoice:
                    invoice = Invoice.objects.create(
                        contract=contract,
                        amount=contract.tariff.price,
                        due_date=tomorrow,
                        description=f"Monthly fee for {contract.tariff.name} - {tomorrow}"
                    )
                    invoices_created += 1
                    self.stdout.write(f"  - Created new invoice #{invoice.id} for contract #{contract.id}")
                else:
                    invoice = existing_invoice  # Use the existing invoice
                    self.stdout.write(f"  - Using existing invoice #{invoice.id} for contract #{contract.id}")
                    
                customer = contract.customer
                if customer.preferred_notification == 'email':
                    self._send_email_notification(customer, invoice)
                    notifications_sent += 1
                    self.stdout.write(f"  - Sent email notification to {customer.user.email}")
                elif customer.preferred_notification == 'sms':
                    self._send_sms_notification(customer, invoice)
                    notifications_sent += 1
                    self.stdout.write(f"  - Sent SMS notification to {customer.phone_number}")

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully generated {invoices_created} invoices and sent {notifications_sent} notifications'
            )
        )

    def _send_email_notification(self, customer, invoice):
        subject = f'Payment Due Tomorrow - Invoice #{invoice.id}'
        message = f"""
        Dear {customer.user.first_name} {customer.user.last_name},
        
        This is a reminder that your payment of {invoice.amount}$ for your service is due tomorrow.

        Invoice details:
        - Invoice #: {invoice.id}
        - Amount: {invoice.amount}$
        - Due date: {invoice.due_date.strftime('%Y-%m-%d')}
        - Description: {invoice.description}

        Please ensure your account balance has sufficient funds for the automatic payment.

        Thank you for choosing our service.

        Best regards,
        Your ISP Team
        """

        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [customer.user.email],
            fail_silently=False,
        )

    def _send_sms_notification(self, customer, invoice):
        # Implement SMS sending logic here
        # This would typically involve a third-party SMS service API
        phone_number = customer.phone_number
        message_text = f"Payment of {invoice.amount}$ is due tomorrow for your internet service. Please ensure your account has sufficient funds."

        print(message_text)
        # client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        
        # message = client.messages.create(
        #     body=message_text,
        #     from_=settings.TWILIO_PHONE_NUMBER,
        #     to=phone_number
        # )