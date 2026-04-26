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
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['customer__user__first_name', 'customer__user__last_name', 'reason']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if hasattr(user, 'customer_profile'):
            queryset = queryset.filter(customer=user.customer_profile)
        elif not user.is_staff:
            return self.queryset.none()
        
        is_reviewed = self.request.query_params.get('is_reviewed')
        if is_reviewed is not None:
            queryset = queryset.filter(is_reviewed=is_reviewed.lower() == 'true')
        
        customer_id = self.request.query_params.get('customer_id')
        if customer_id and user.is_staff:
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

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def apply(self, request, pk=None):
        recommendation = self.get_object()
        customer = recommendation.customer
        
        # Check if user is the owner
        if not request.user.is_staff and customer.user != request.user:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
            
        if recommendation.is_reviewed:
            return Response({"detail": "This recommendation has already been processed."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Create Connection Request
        from ..models import ConnectionRequest, Status
        
        # Get first address of customer
        address = customer.addresses.first()
        if not address:
             return Response({"detail": "You must have a registered address to create a request."}, status=status.HTTP_400_BAD_REQUEST)
             
        try:
            # Try to get 'New' or 'Pending' status for ConnectionRequest
            new_status = Status.objects.filter(context__context='ConnectionRequest', status__in=['New', 'Pending']).first()
            if not new_status:
                new_status = Status.objects.filter(context__context='ConnectionRequest').first()
        except Status.DoesNotExist:
            return Response({"detail": "Status system misconfigured."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        conn_req = ConnectionRequest.objects.create(
            customer=customer,
            tariff=recommendation.recommended_tariff,
            address=address,
            status=new_status,
            notes=f"Auto-generated from recommendation (Reason: {recommendation.get_reason_display()})"
        )
        
        recommendation.is_reviewed = True
        recommendation.save()
        
        return Response({
            "detail": "Connection request created successfully.",
            "connection_request_id": conn_req.id
        })
