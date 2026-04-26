from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from ..models import TariffRecommendation
from ..serializers import TariffRecommendationSerializer
from ..utils.permissions import IsManager, IsAdmin
from ..utils.mixins import StandardResponseMixin

class TariffRecommendationViewSet(StandardResponseMixin, viewsets.ModelViewSet):
    queryset = TariffRecommendation.objects.select_related(
        'customer', 'customer__user', 'current_tariff', 'recommended_tariff'
    ).all()
    serializer_class = TariffRecommendationSerializer
    permission_classes = [IsManager | IsAdmin]
    filter_backends = [filters.SearchFilter]
    search_fields = ['customer__user__first_name', 'customer__user__last_name', 'reason']

    def get_queryset(self):
        queryset = super().get_queryset()
        is_reviewed = self.request.query_params.get('is_reviewed')
        if is_reviewed is not None:
            queryset = queryset.filter(is_read=is_reviewed.lower() == 'true')
        
        customer_id = self.request.query_params.get('customer_id')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
            
        reason = self.request.query_params.get('reason')
        if reason:
            queryset = queryset.filter(reason=reason)
            
        return queryset.order_by('-created_at')

    def update(self, request, *args, **kwargs):
        # Restriction: Only is_reviewed can be updated via PATCH/PUT
        if any(key not in ['is_reviewed'] for key in request.data.keys()):
            return Response(
                {"detail": "Only 'is_reviewed' field can be updated."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().update(request, *args, **kwargs)
