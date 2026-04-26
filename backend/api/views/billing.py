from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse

from ..models import Tariff, Service, Payment, Invoice, PaymentMethod, TariffService
from ..serializers import (
    TariffSerializer, ServiceSerializer, PaymentSerializer, InvoiceSerializer, 
    PaymentMethodSerializer, TariffDetailSerializer
)
from ..utils.permissions import IsManager, IsAdmin, IsCustomer, ReadOnlyOrAdmin
from ..services.pdf_service import generate_invoice_pdf, generate_receipt_pdf
from ..utils.mixins import StandardResponseMixin

class TariffViewSet(StandardResponseMixin, viewsets.ModelViewSet):
    permission_classes = [ReadOnlyOrAdmin]
    queryset = Tariff.objects.filter(is_active=True)
    serializer_class = TariffSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['name', 'price']
    ordering = ['name']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TariffDetailSerializer
        return TariffSerializer

    @action(detail=False, methods=['get'])
    def by_service(self, request):
        service_id = request.query_params.get('service_id')
        if not service_id:
            return Response({"error": "service_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # A tariff is connected to a service via TariffService
        queryset = Tariff.objects.filter(tariffservice__service_id=service_id, is_active=True)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class ServiceViewSet(StandardResponseMixin, viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [ReadOnlyOrAdmin]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['name']
    ordering = ['name']

class PaymentViewSet(StandardResponseMixin, viewsets.ModelViewSet):
    queryset = Payment.objects.select_related("customer", "method").order_by("-payment_date")
    serializer_class = PaymentSerializer
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'customer_profile'):
            return self.queryset.filter(customer=user.customer_profile)
        return self.queryset

    @action(detail=True, methods=['get'], permission_classes=[IsCustomer | IsManager])
    def receipt(self, request, pk=None):
        payment = self.get_object()
        buffer = generate_receipt_pdf(payment)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="receipt_{payment.id}.pdf"'
        return response

class InvoiceViewSet(StandardResponseMixin, viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related("contract", "contract__customer", "contract__service").order_by("-issue_date")
    serializer_class = InvoiceSerializer
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'customer_profile'):
            return self.queryset.filter(contract__customer=user.customer_profile)
        return self.queryset

    @action(detail=True, methods=['get'], permission_classes=[IsCustomer | IsManager])
    def pdf(self, request, pk=None):
        invoice = self.get_object()
        buffer = generate_invoice_pdf(invoice)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="invoice_{invoice.id}.pdf"'
        return response

class PaymentMethodViewSet(StandardResponseMixin, viewsets.ModelViewSet):
    queryset = PaymentMethod.objects.all()
    serializer_class = PaymentMethodSerializer
    permission_classes = [ReadOnlyOrAdmin]
