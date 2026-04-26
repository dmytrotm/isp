from django.utils import timezone
from datetime import timedelta
from ..models import ClientScore, Contract, Invoice, SupportTicket

def calculate_customer_score(customer):
    """
    Calculates reliability score (0-100) based on history.
    Rules:
    - Contract Points (max 30): age based.
    - Overdue Points (max 30): based on invoices in last 12 months.
    - Ticket Points (max 20): based on support activity in last 30 days.
    """
    now = timezone.now()
    
    # 1. CONTRACT POINTS (max 30)
    contract_points = 0
    oldest_contract = Contract.objects.filter(
        customer=customer, 
        status__in=['active', 'Active']
    ).order_by('start_date').first()
    
    if oldest_contract:
        age_days = (now - oldest_contract.start_date).days
        if age_days > 365:
            contract_points = 30
        elif age_days > 180:
            contract_points = 20
        else:
            contract_points = 10
            
    # 2. OVERDUE POINTS (max 30)
    overdue_points = 0
    one_year_ago = now - timedelta(days=365)
    overdue_count = Invoice.objects.filter(
        contract__customer=customer,
        status='overdue',
        due_date__gte=one_year_ago
    ).count()
    
    if overdue_count == 0:
        overdue_points = 30
    elif overdue_count <= 2:
        overdue_points = 15
    else:
        overdue_points = 0
        
    # 3. TICKET POINTS (max 20)
    ticket_points = 0
    thirty_days_ago = now - timedelta(days=30)
    ticket_count = SupportTicket.objects.filter(
        customer=customer,
        created_at__gte=thirty_days_ago
    ).count()
    
    if ticket_count == 0:
        ticket_points = 20
    elif ticket_count <= 2:
        ticket_points = 10
    else:
        ticket_points = 0
        
    total_score = contract_points + overdue_points + ticket_points
    
    return ClientScore(
        customer=customer,
        score=total_score,
        contract_points=contract_points,
        overdue_points=overdue_points,
        ticket_points=ticket_points
    )
