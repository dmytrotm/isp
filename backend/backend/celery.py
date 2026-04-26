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
        'task': 'api.tasks.base.generate_invoices_task',  # назва шляху до задачі
        'schedule': crontab(hour=0, minute=0),  # щодня о 00:00
    },
    'generate-invoices-with-payment-every-day': {
        'task': 'api.tasks.base.generate_invoices_with_payment_task',
        'schedule': crontab(hour=1, minute=0),  # щодня о 01:00
    },
    'get-network-usage-every-day': {
        'task': 'api.tasks.base.get_network_usage_task',
        'schedule': crontab(hour=1, minute=0),  # щодня о 01:00
    },
    'check-sla-breaches-every-hour': {
        'task': 'api.tasks.tickets.check_sla_breaches',
        'schedule': crontab(minute=0),  # щогодини
    },
    'check-negative-balances-daily': {
        'task': 'api.tasks.billing.check_negative_balances',
        'schedule': crontab(hour=2, minute=0),  # щодня о 02:00
    },
    'calculate-scores-weekly': {
        'task': 'api.tasks.scoring.calculate_all_scores',
        'schedule': crontab(hour=3, minute=0, day_of_week='sunday'),
    },
    'generate-tariff-recommendations-monthly': {
        'task': 'api.tasks.recommendations.generate_all_recommendations',
        'schedule': crontab(hour=4, minute=0, day_of_month='1'),
    },
    'check-low-balances-daily': {
        'task': 'api.tasks.billing.check_low_balances',
        'schedule': crontab(hour=9, minute=0),  # щодня о 09:00
    },
}
