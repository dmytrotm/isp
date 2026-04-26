from django.db.models import Sum, Count, Q, Avg, F
from django.db.models.functions import TruncMonth, TruncDay
from django.utils import timezone
from datetime import timedelta
from ..models import (
    Customer, BalanceTransaction, SupportTicket, TariffRecommendation, 
    Employee, Contract, Invoice, ConnectionRequest, Tariff, Service, NetworkUsage
)

def get_dashboard_stats():
    """
    Returns aggregated statistics for the Manager Dashboard.
    """
    now = timezone.now()
    thirty_days_ago = now - timedelta(days=30)
    
    # Basic Counts
    total_customers = Customer.objects.count()
    total_employees = Employee.objects.count()
    active_contracts = Contract.objects.filter(status='active').count()
    
    # Invoices
    paid_invoices = Invoice.objects.filter(status='paid').count()
    pending_invoices = Invoice.objects.filter(status='pending').count()
    overdue_invoices = Invoice.objects.filter(status='overdue').count()
    
    # Revenue (last 30 days) - Sum of all payments received
    from ..models import Payment
    monthly_payments = Payment.objects.filter(
        payment_date__gte=thirty_days_ago
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Tickets by status
    ticket_stats = SupportTicket.objects.aggregate(
        open=Count('id', filter=Q(status__status__iexact='Open') | Q(status__status__iexact='New')),
        in_progress=Count('id', filter=Q(status__status__iexact='In Progress')),
        resolved=Count('id', filter=Q(status__status__iexact='Resolved'))
    )
    
    # Recent items
    latest_tickets = SupportTicket.objects.select_related('customer__user', 'status').order_by('-created_at')[:5]
    recent_requests = ConnectionRequest.objects.select_related('customer__user', 'status').order_by('-created_at')[:5]
    
    # --- Client Statistics (original) ---
    client_stats = Customer.objects.aggregate(
        total=Count('id'),
        active=Count('id', filter=Q(status__status__iexact='Active')),
        blocked=Count('id', filter=Q(status__status__iexact='Blocked')),
        new_this_month=Count('id', filter=Q(user__created_at__gte=thirty_days_ago))
    )
    
    # --- Revenue (last 6 months) ---
    monthly_revenue = (
        Payment.objects
        .filter(payment_date__gte=now - timedelta(days=180))
        .annotate(month=TruncMonth('payment_date'))
        .values('month')
        .annotate(total=Sum('amount'))
        .order_by('month')
    )
    
    # --- Top 5 most problematic clients ---
    top_problem_clients = (
        Customer.objects
        .annotate(ticket_count=Count('support_tickets', filter=Q(support_tickets__created_at__gte=thirty_days_ago)))
        .filter(ticket_count__gt=0)
        .order_by('-ticket_count')
        .select_related('user', 'status')[:5]
    )
    
    # --- Pending tariff recommendations ---
    pending_recommendations = (
        TariffRecommendation.objects
        .filter(is_reviewed=False)
        .select_related('customer__user', 'current_tariff', 'recommended_tariff')
        .order_by('-created_at')[:10]
    )
    
    # --- Overdue tickets ---
    overdue_tickets_list = (
        SupportTicket.objects
        .filter(is_sla_breached=True, status__status__in=['Open', 'In Progress', 'New'])
        .select_related('customer__user', 'status')
        .order_by('sla_deadline')[:10]
    )

    # --- Tariff Statistics ---
    tariff_stats = (
        Tariff.objects.annotate(
            active_contracts=Count('contract', filter=Q(contract__status='active')),
            monthly_revenue=Sum('contract__tariff__price', filter=Q(contract__status='active'))
        )
        .values('id', 'name', 'price', 'active_contracts', 'monthly_revenue', 'is_active')
        .order_by('-active_contracts')
    )
    
    for t in tariff_stats:
        t['monthly_revenue'] = float(t['monthly_revenue']) if t['monthly_revenue'] else 0.0

    # --- Service Distribution ---
    service_stats = (
        Service.objects.annotate(
            active_contracts=Count('contract', filter=Q(contract__status='active'))
        )
        .values('name', 'active_contracts')
    )

    return {
        'total_customers': total_customers,
        'total_employees': total_employees,
        'active_contracts': active_contracts,
        'monthly_payments': float(monthly_payments),
        'paid_invoices': paid_invoices,
        'pending_invoices': pending_invoices,
        'overdue_invoices': overdue_invoices,
        'open_tickets': ticket_stats['open'],
        'in_progress_tickets': ticket_stats['in_progress'],
        'resolved_tickets': ticket_stats['resolved'],
        'latest_tickets': latest_tickets,
        'recent_requests': recent_requests,
        'client_stats': client_stats,
        'monthly_revenue': list(monthly_revenue),
        'top_problem_clients': top_problem_clients,
        'pending_recommendations': pending_recommendations,
        'overdue_tickets': overdue_tickets_list,
        'tariff_statistics': list(tariff_stats),
        'service_statistics': list(service_stats),
        'total_tariffs': Tariff.objects.count(),
        'active_tariffs': Tariff.objects.filter(is_active=True).count(),
        'most_popular': tariff_stats[0] if tariff_stats else None,
        'usage': get_network_usage_stats()
    }

def get_network_usage_stats(days=30):
    """
    Returns detailed network usage statistics for the specified period.
    NetworkUsage links to Contract (not Customer directly).
    Path to customer: contract__customer
    Path to tariff: contract__tariff
    """
    end_date = timezone.now()
    start_date = end_date - timedelta(days=days)
    
    usage_qs = NetworkUsage.objects.filter(date__range=[start_date, end_date])
    
    # 1. Summary
    summary = usage_qs.aggregate(
        total_download=Sum('download_gb'),
        total_upload=Sum('upload_gb'),
        unique_customers=Count('contract__customer', distinct=True),
    )
    total_usage = float((summary['total_download'] or 0) + (summary['total_upload'] or 0))
    unique_customers = summary['unique_customers'] or 1
    
    usage_summary = {
        'total_usage_gb': total_usage,
        'unique_customers': unique_customers,
        'average_per_customer_gb': total_usage / unique_customers
    }
    
    # 2. Daily Trends
    daily_usage = (
        usage_qs.values('date')
        .annotate(
            total_download=Sum('download_gb'),
            total_upload=Sum('upload_gb'),
            total_gb=Sum('download_gb') + Sum('upload_gb')
        )
        .order_by('date')
    )
    
    # 3. Monthly Trends
    monthly_usage = (
        NetworkUsage.objects.filter(date__gte=end_date - timedelta(days=180))
        .annotate(month=TruncMonth('date'))
        .values('month')
        .annotate(
            total_download=Sum('download_gb'),
            total_upload=Sum('upload_gb')
        )
        .order_by('month')
    )
    
    # 4. Usage by Tariff (via contract -> tariff)
    tariff_usage = (
        usage_qs.filter(contract__status='active')
        .values('contract__tariff__name')
        .annotate(total_gb=Sum('download_gb') + Sum('upload_gb'))
        .order_by('-total_gb')
    )
    
    # 5. Customer Usage Details (Top 10, via contract -> customer -> user)
    customer_usage = (
        usage_qs.values(
            'contract__customer_id',
            'contract__customer__user__first_name',
            'contract__customer__user__last_name'
        )
        .annotate(
            total_download=Sum('download_gb'),
            total_upload=Sum('upload_gb'),
            total_gb=Sum('download_gb') + Sum('upload_gb')
        )
        .order_by('-total_gb')[:10]
    )

    return {
        'summary': usage_summary,
        'daily_usage': [
            {
                'date': item['date'].strftime('%Y-%m-%d') if item['date'] else None,
                'download_gb': float(item['total_download']),
                'upload_gb': float(item['total_upload']),
                'total_gb': float(item['total_gb'])
            }
            for item in daily_usage
        ],
        'monthly_usage': [
            {
                'month': item['month'].strftime('%Y-%m') if item['month'] else None,
                'download_gb': float(item['total_download']),
                'upload_gb': float(item['total_upload'])
            }
            for item in monthly_usage
        ],
        'tariff_usage': [
            {
                'tariff_name': item['contract__tariff__name'] or 'Unknown',
                'total_gb': float(item['total_gb'])
            }
            for item in tariff_usage
        ],
        'customer_usage': [
            {
                'customer_id': item['contract__customer_id'],
                'customer_name': f"{item['contract__customer__user__last_name']}, {item['contract__customer__user__first_name']}",
                'download_gb': float(item['total_download']),
                'upload_gb': float(item['total_upload']),
                'total_gb': float(item['total_gb'])
            }
            for item in customer_usage
        ]
    }
