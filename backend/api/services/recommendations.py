from django.utils import timezone
from datetime import timedelta
from django.db.models import Avg, Sum
from ..models import TariffRecommendation, Tariff, NetworkUsage, Contract

def generate_tariff_recommendation(customer):
    """
    Analyzes last 3 months of usage and recommends a better tariff.
    """
    # a) Get active contract
    active_contract = Contract.objects.filter(
        customer=customer, 
        status__in=['active', 'Active']
    ).select_related('tariff').first()
    
    if not active_contract or not active_contract.tariff:
        return None
        
    current_tariff = active_contract.tariff
    
    # b) Get NetworkUsage for last 3 months
    three_months_ago = timezone.now() - timedelta(days=90)
    usage_records = NetworkUsage.objects.filter(
        contract=active_contract,
        date__gte=three_months_ago
    )
    
    if usage_records.count() < 7:
        return None
        
    # c) Calculate avg usage (download + upload) as percentage of tariff limit
    # Note: download_gb and upload_gb are in GB. traffic_limit_gb is in GB.
    # Calculate sum per day then avg.
    # Wait, aggregate(Avg(Sum...)) is not valid in standard Django like this.
    # Need to calculate sum per day then avg.
    daily_usages = [r.download_gb + r.upload_gb for r in usage_records]
    avg_total_gb = sum(daily_usages) / len(daily_usages)
    
    if current_tariff.traffic_limit_gb == 0: # Unlimited?
        avg_usage_percent = 0
    else:
        avg_usage_percent = (avg_total_gb / current_tariff.traffic_limit_gb) * 100
        
    # d) Determine recommendation
    recommended_tariff = None
    reason = None
    
    if avg_usage_percent < 40:
        reason = TariffRecommendation.UNDERUSING
        # Cheapest tariff where price < current and speed >= current * 0.5
        recommended_tariff = Tariff.objects.filter(
            is_active=True,
            price__lt=current_tariff.price,
            speed_mbps__gte=current_tariff.speed_mbps * 0.5
        ).order_by('price').first()
        
    elif avg_usage_percent > 90:
        reason = TariffRecommendation.OVERUSING
        # Cheapest tariff where limit > current and price <= current * 1.5
        recommended_tariff = Tariff.objects.filter(
            is_active=True,
            traffic_limit_gb__gt=current_tariff.traffic_limit_gb,
            price__lte=current_tariff.price * 1.5
        ).order_by('price').first()
        
    if not recommended_tariff or recommended_tariff == current_tariff:
        return None
        
    # f) Duplicate prevention
    existing = TariffRecommendation.objects.filter(
        customer=customer,
        recommended_tariff=recommended_tariff,
        created_at__month=timezone.now().month,
        created_at__year=timezone.now().year
    ).exists()
    
    if existing:
        return None
        
    return TariffRecommendation(
        customer=customer,
        current_tariff=current_tariff,
        recommended_tariff=recommended_tariff,
        reason=reason,
        avg_usage_percent=avg_usage_percent
    )
