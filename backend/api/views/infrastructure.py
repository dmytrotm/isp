from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.timezone import now
from datetime import timedelta
from django.db.models import Sum, Count

from ..models import Equipment, EquipmentCategory, NetworkUsage, Status
from ..serializers import EquipmentSerializer, EquipmentCategorySerializer, NetworkUsageSerializer, StatusSerializer
from ..utils.permissions import IsManager, IsAdmin, IsCustomer
from ..utils.mixins import StandardResponseMixin

class EquipmentViewSet(StandardResponseMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'category__name']
    ordering_fields = ['name', 'price', 'stock_quantity', 'category__name']
    ordering = ['name']

class EquipmentCategoryViewSet(StandardResponseMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = EquipmentCategory.objects.all()
    serializer_class = EquipmentCategorySerializer

class NetworkUsageViewSet(StandardResponseMixin, viewsets.ModelViewSet):
    queryset = NetworkUsage.objects.all().order_by('-date')
    serializer_class = NetworkUsageSerializer
    
    @action(detail=False, methods=['get'], permission_classes=[IsManager])
    def summary(self, request):
        days = int(request.query_params.get('days', 30))
        start_date = now() - timedelta(days=days)
        
        daily_usage = NetworkUsage.objects.filter(
            date__gte=start_date
        ).values('date').annotate(
            total_download=Sum('download_gb'),
            total_upload=Sum('upload_gb')
        ).order_by('date')
        
        return Response(list(daily_usage))

class StatusViewSet(StandardResponseMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Status.objects.all()
    serializer_class = StatusSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        context_name = self.request.query_params.get('context_name')
        if context_name:
            queryset = queryset.filter(context__context=context_name)
        return queryset
