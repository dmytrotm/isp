from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse

from ..models import Contract, ContractEquipment, Equipment
from ..serializers import ContractSerializer, ContractEquipmentSerializer
from ..utils.permissions import IsManager, IsAdmin, IsCustomer
from ..services.pdf_service import generate_contract_pdf
from ..utils.mixins import StandardResponseMixin

class ContractViewSet(StandardResponseMixin, viewsets.ModelViewSet):
    queryset = Contract.objects.select_related("customer", "service", "tariff", "address").order_by("-created_at")
    serializer_class = ContractSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['customer__user__last_name', 'address__street']
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'customer_profile'):
            return self.queryset.filter(customer=user.customer_profile)
        return self.queryset

    @action(detail=True, methods=['get'], permission_classes=[IsCustomer | IsManager])
    def pdf(self, request, pk=None):
        contract = self.get_object()
        buffer = generate_contract_pdf(contract)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="contract_{contract.id}.pdf"'
        return response

    @action(detail=True, methods=['post'], permission_classes=[IsManager])
    def add_equipment(self, request, pk=None):
        contract = self.get_object()
        equipment_id = request.data.get('equipment_id')
        try:
            equipment = Equipment.objects.get(id=equipment_id)
            if equipment.stock_quantity <= 0:
                return Response({'error': 'Equipment not in stock'}, status=status.HTTP_400_BAD_REQUEST)
            
            ce = ContractEquipment.objects.create(contract=contract, equipment=equipment)
            return Response(ContractEquipmentSerializer(ce).data, status=status.HTTP_201_CREATED)
        except Equipment.DoesNotExist:
            return Response({'error': 'Equipment not found'}, status=status.HTTP_404_NOT_FOUND)
