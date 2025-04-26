import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')  # Замінити на своє

app = Celery('backend')

app.config_from_object('django.conf:settings', namespace='CELERY')

app.autodiscover_tasks()

# ⏰ Додай сюди розклад завдань
app.conf.beat_schedule = {
    'generate-invoices-every-day': {
        'task': 'api.tasks.generate_invoices_task',  # назва шляху до задачі
        'schedule': crontab(hour=0, minute=0),  # щодня о 00:00
    },
    'generate-invoices-with-payment-every-day': {
        'task': 'api.tasks.generate_invoices_with_payment_task',
        'schedule': crontab(hour=1, minute=0),  # щодня о 01:00
    },
    'generate-invoices-with-payment-every-day': {
        'task': 'api.tasks.get_network_usage_task',
        'schedule': crontab(hour=1, minute=0),  # щодня о 01:00
    },
}
