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
from ..utils.permissions import IsManager, IsAdmin, IsCustomer, ReadOnlyOrAdmin, IsManagerOrAdmin, IsStaff
from ..services.pdf_service import generate_invoice_pdf, generate_receipt_pdf
from ..utils.mixins import StandardResponseMixin

class TariffViewSet(StandardResponseMixin, viewsets.ModelViewSet):
    permission_classes = [ReadOnlyOrAdmin]
    queryset = Tariff.objects.all()
    serializer_class = TariffSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['name', 'price']
    ordering = ['name']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TariffDetailSerializer
        return TariffSerializer

    def destroy(self, request, *args, **kwargs):
        from django.db.models.deletion import ProtectedError
        instance = self.get_object()
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            instance.is_active = False
            instance.save()
            return Response(
                {"message": "Tariff is in use and cannot be deleted, so it has been deactivated instead."},
                status=status.HTTP_200_OK
            )

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

    @action(detail=False, methods=['GET'], url_path='export_csv', permission_classes=[IsManagerOrAdmin])
    def export_csv(self, request):
        from ..services.csv_service import CSVService
        from django.http import HttpResponse
        
        queryset = self.filter_queryset(self.get_queryset())
        csv_data = CSVService.export_tariffs(queryset)
        
        response = HttpResponse(csv_data, content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="tariffs.csv"'
        return response

    @action(detail=False, methods=['POST'], url_path='import_csv', permission_classes=[IsManagerOrAdmin])
    def import_csv(self, request):
        from ..services.csv_service import CSVService
        csv_file = request.FILES.get('csv_file')
        if not csv_file:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)
        
        count, errors = CSVService.import_tariffs(csv_file)
        return Response({
            'count': count,
            'errors': errors
        }, status=status.HTTP_201_CREATED if count > 0 else status.HTTP_400_BAD_REQUEST)

class ServiceViewSet(StandardResponseMixin, viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [ReadOnlyOrAdmin]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['name']
    ordering = ['name']

    def destroy(self, request, *args, **kwargs):
        from django.db.models.deletion import ProtectedError
        instance = self.get_object()
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            instance.is_active = False
            instance.save()
            return Response(
                {"message": "Service is in use and cannot be deleted, so it has been deactivated instead."},
                status=status.HTTP_200_OK
            )

class PaymentViewSet(StandardResponseMixin, viewsets.ModelViewSet):
    queryset = Payment.objects.select_related("customer", "method").order_by("-payment_date")
    serializer_class = PaymentSerializer
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'customer_profile'):
            return self.queryset.filter(customer=user.customer_profile)
        return self.queryset

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
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

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
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
