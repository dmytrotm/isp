from celery import shared_task
from django.core.management import call_command

@shared_task
def generate_invoices_task():
    call_command('generate_invoices')

@shared_task
def generate_invoices_with_payment_task():
    call_command('generate_invoices', 'process_payments')

@shared_task
def get_network_usage_task():
    call_command('get_network_usage')