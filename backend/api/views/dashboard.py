from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..utils.permissions import IsManagerOrAdmin
from ..services.analytics import get_dashboard_stats
from ..serializers import TariffRecommendationSerializer, SupportTicketSerializer
from ..utils.mixins import StandardResponseMixin

class ManagerDashboardView(StandardResponseMixin, APIView):
    """
    Consolidated analytics for the Manager Dashboard.
    """
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]
    
    def get(self, request):
        # PERF: consider caching if frequency of access increases
        data = get_dashboard_stats()
        from ..serializers import ConnectionRequestSerializer
        
        return Response({
            'data': {
                'total_customers': data['total_customers'],
                'total_employees': data['total_employees'],
                'active_contracts': data['active_contracts'],
                'monthly_payments': data['monthly_payments'],
                'paid_invoices': data['paid_invoices'],
                'pending_invoices': data['pending_invoices'],
                'overdue_invoices': data['overdue_invoices'],
                'open_tickets': data['open_tickets'],
                'in_progress_tickets': data['in_progress_tickets'],
                'resolved_tickets': data['resolved_tickets'],
                'latest_tickets': SupportTicketSerializer(data['latest_tickets'], many=True).data,
                'recent_requests': ConnectionRequestSerializer(data['recent_requests'], many=True).data,
                'client_stats': data['client_stats'],
                'monthly_revenue': [
                    {
                        'month': item['month'].strftime('%Y-%m') if item['month'] else None,
                        'total': float(item['total']) if item['total'] else 0
                    }
                    for item in data['monthly_revenue']
                ],
                'top_problem_clients': [
                    {
                        'id': c.id,
                        'full_name': c.user.get_full_name(),
                        'ticket_count': c.ticket_count,
                        'status': c.status.status,
                        'balance': float(c.balance)
                    }
                    for c in data['top_problem_clients']
                ],
                'pending_recommendations': TariffRecommendationSerializer(
                    data['pending_recommendations'], many=True
                ).data,
                'overdue_tickets': SupportTicketSerializer(
                    data['overdue_tickets'], many=True
                ).data,
                'tariff_statistics': data['tariff_statistics'],
                'service_statistics': data['service_statistics'],
                'total_tariffs': data['total_tariffs'],
                'active_tariffs': data['active_tariffs'],
                'most_popular': data['most_popular'],
            },
            'error': None
        })
