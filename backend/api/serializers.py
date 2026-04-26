from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils.timezone import now
from .mixins import ContextAwareSerializerMixin

from .models import (
    User, Customer, Employee, Address, Region, Service, Tariff, TariffService,
    ConnectionRequest, ConnectionRequestAssignment, Contract, Payment, Invoice,
    SupportTicket, NetworkUsage, EmployeeRole, Status, PaymentMethod, 
    Equipment, EquipmentCategory, ContractEquipment, BalanceTransaction,
    ClientScore, TariffRecommendation, Notification
)

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField(source='get_full_name')
    
    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "full_name", "is_active", "created_at")
        read_only_fields = ("created_at", "full_name")

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "password", "confirm_password")

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        try:
            validate_password(attrs["password"])
        except ValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})
        
        return attrs
    
    def create(self, validated_data):
        validated_data.pop("confirm_password")
        user = User.objects.create_user(**validated_data)
        return user

class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = ("id", "name")

class AddressSerializer(serializers.ModelSerializer):
    region_name = serializers.ReadOnlyField(source="region.name")
    
    class Meta:
        model = Address
        fields = ("id", "apartment", "building", "street", "city", "region", "region_name", "customer")
        read_only_fields = ("customer",)

class StatusSerializer(serializers.ModelSerializer):
    context_name = serializers.ReadOnlyField(source="context.context")
    
    class Meta:
        model = Status
        fields = ("id", "status", "context", "context_name")

class EmployeeRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeRole
        fields = ("id", "name")

class CustomerSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source="user", read_only=True)
    status_name = serializers.ReadOnlyField(source="status.status")
    addresses = AddressSerializer(many=True, read_only=True)
    contracts = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    all_invoices = serializers.SerializerMethodField()
    payments = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    support_tickets = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    def get_all_invoices(self, obj):
        invoices = Invoice.objects.filter(contract__customer=obj)
        return InvoiceSerializer(invoices, many=True).data
    
    class Meta:
        model = Customer
        fields = ("id", "user", "user_details", "status", "status_name", "phone_number", 
                  "balance", "balance_negative_since", "preferred_notification", "addresses", "contracts", "all_invoices", "payments", "support_tickets")
        read_only_fields = ("balance", "balance_negative_since")

class CustomerCreateSerializer(serializers.ModelSerializer, ContextAwareSerializerMixin):
    user = UserRegisterSerializer()
    addresses = AddressSerializer(many=True, required=False)
    
    class Meta:
        model = Customer
        fields = ("id", "user", "status", "phone_number", "preferred_notification", "addresses")
    
    def create(self, validated_data):
        user_data = validated_data.pop("user")
        addresses_data = validated_data.pop("addresses", [])
        
        user = UserRegisterSerializer().create(user_data)
        customer = Customer.objects.create(user=user, **validated_data)
        
        for address_data in addresses_data:
            Address.objects.create(customer=customer, **address_data)
        
        return customer

class EmployeeSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source="user", read_only=True)
    role_name = serializers.ReadOnlyField(source="role.name")
    
    class Meta:
        model = Employee
        fields = ("id", "user", "user_details", "role", "role_name")

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ("id", "name", "description", "is_active")

class TariffServiceSerializer(serializers.ModelSerializer):
    service_name = serializers.ReadOnlyField(source="service.name")
    service_description = serializers.ReadOnlyField(source="service.description")
    
    class Meta:
        model = TariffService
        fields = ("id", "tariff", "service", "service_name", "service_description")

class TariffSerializer(serializers.ModelSerializer):
    services = ServiceSerializer(many=True, read_only=True)
    
    class Meta:
        model = Tariff
        fields = ("id", "name", "price", "description", "is_active", "services")

class TariffDetailSerializer(serializers.ModelSerializer):
    services = ServiceSerializer(many=True, read_only=True)
    tariff_services = TariffServiceSerializer(source="tariffservice_set", many=True, read_only=True)
    
    class Meta:
        model = Tariff
        fields = ("id", "name", "price", "description", "is_active", "services", "tariff_services")

class ConnectionRequestAssignmentSerializer(serializers.ModelSerializer):
    employee_details = EmployeeSerializer(source="employee", read_only=True)
    
    class Meta:
        model = ConnectionRequestAssignment
        fields = ("id", "connection_request", "employee", "employee_details", "role", "assigned_at")
        read_only_fields = ("assigned_at",)

class ConnectionRequestSerializer(serializers.ModelSerializer):
    customer_details = CustomerSerializer(source="customer", read_only=True)
    status_name = serializers.ReadOnlyField(source="status.status")
    tariff_details = TariffSerializer(source="tariff", read_only=True)
    assignments = ConnectionRequestAssignmentSerializer(source="connectionrequestassignment_set", many=True, read_only=True)
    address_details = AddressSerializer(source="address", read_only=True)

    class Meta:
        model = ConnectionRequest
        fields = ("id", "customer", "customer_details", "status", "status_name", 
                  "created_at", "updated_at", "address", "address_details", 
                  "tariff", "tariff_details", "notes", "assignments")
        read_only_fields = ("created_at", "updated_at", "customer")

class EquipmentCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentCategory
        fields = ("id", "name")

class EquipmentSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source="category.name")
    
    class Meta:
        model = Equipment
        fields = ("id", "name", "description", "price", "stock_quantity", "category", "category_name", "state")

class ContractEquipmentSerializer(serializers.ModelSerializer):
    equipment_details = EquipmentSerializer(source="equipment", read_only=True)
    
    class Meta:
        model = ContractEquipment
        fields = ("id", "contract", "equipment", "equipment_details", "assigned_at", "is_active")
        read_only_fields = ("assigned_at",)

class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = ("id", "method")

class InvoiceSerializer(serializers.ModelSerializer):
    is_overdue = serializers.BooleanField(read_only=True)
    contract_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Invoice
        fields = ("id", "contract", "contract_details", "amount", "issue_date", 
                  "due_date", "description", "status", "is_overdue")
        read_only_fields = ("issue_date", "is_overdue")
    
    def get_contract_details(self, obj):
        return {
            "id": obj.contract.id,
            "customer": f"{obj.contract.customer.user.first_name} {obj.contract.customer.user.last_name}",
            "service": obj.contract.service.name,
            "tariff": obj.contract.tariff.name if obj.contract.tariff else None
        }

class PaymentSerializer(serializers.ModelSerializer):
    method_name = serializers.ReadOnlyField(source="method.method")
    
    class Meta:
        model = Payment
        fields = ("id", "amount", "payment_date", "method", "method_name", "customer")
        read_only_fields = ("payment_date", "customer")

class ContractSerializer(serializers.ModelSerializer):
    customer_details = CustomerSerializer(source="customer", read_only=True)
    service_details = ServiceSerializer(source="service", read_only=True)
    tariff_details = TariffSerializer(source="tariff", read_only=True)
    address_details = AddressSerializer(source="address", read_only=True)
    equipment_list = ContractEquipmentSerializer(source="contractequipment_set", many=True, read_only=True)
    invoices = InvoiceSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Contract
        fields = ("id", "customer", "customer_details", "connection_request", "address", 
                  "address_details", "service", "service_details", "tariff", "tariff_details", 
                  "created_at", "updated_at", "start_date", "end_date", "is_active", "status",
                  "equipment_list", "invoices", "payments")
        read_only_fields = ("created_at", "updated_at", "start_date")

class SupportTicketSerializer(serializers.ModelSerializer):
    customer_details = CustomerSerializer(source="customer", read_only=True)
    assigned_to_details = EmployeeSerializer(source="assigned_to", read_only=True)
    status_name = serializers.ReadOnlyField(source="status.status")

    class Meta:
        model = SupportTicket
        fields = (
            "id", "customer", "customer_details", "subject", "description",
            "created_at", "updated_at", "status", "status_name", "assigned_to", "assigned_to_details",
            "ticket_type", "sla_deadline", "is_sla_breached"
        )
        read_only_fields = ("created_at", "updated_at", "sla_deadline", "is_sla_breached")

class NetworkUsageSerializer(serializers.ModelSerializer):
    contract_details = serializers.SerializerMethodField()
    total_usage = serializers.SerializerMethodField()
    
    class Meta:
        model = NetworkUsage
        fields = ("id", "contract", "contract_details", "date", "download_gb", "upload_gb", "total_usage")
    
    def get_contract_details(self, obj):
        return {
            "id": obj.contract.id,
            "customer": f"{obj.contract.customer.user.first_name} {obj.contract.customer.user.last_name}",
            "service": obj.contract.service.name,
            "tariff": obj.contract.tariff.name if obj.contract.tariff else None
        }
    
    def get_total_usage(self, obj):
        return obj.download_gb + obj.upload_gb

class BalanceTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BalanceTransaction
        fields = ("id", "customer", "amount", "balance_after", "transaction_type", "description", "created_at")
        read_only_fields = ("created_at",)

class CustomerDashboardSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source="user", read_only=True)
    status_name = serializers.ReadOnlyField(source="status.status")
    active_contracts = serializers.SerializerMethodField()
    total_monthly_payment = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    pending_invoices = serializers.SerializerMethodField()
    
    class Meta:
        model = Customer
        fields = ("id", "user_details", "status_name", "phone_number", "balance", "balance_negative_since",
                  "preferred_notification", "active_contracts", "total_monthly_payment", 
                  "pending_invoices")
        read_only_fields = ("balance", "balance_negative_since")
    
    def get_active_contracts(self, obj):
        active_contracts = obj.get_active_contracts()
        return ContractSerializer(active_contracts, many=True, context=self.context).data
    
    def get_pending_invoices(self, obj):
        pending_invoices = Invoice.objects.filter(
            contract__customer=obj, 
            status="pending"
        ).order_by("due_date")
        return InvoiceSerializer(pending_invoices, many=True, context=self.context).data
    
class CustomerDetailSerializer(CustomerSerializer):
    contracts = ContractSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    support_tickets = SupportTicketSerializer(many=True, read_only=True)
    transactions = BalanceTransactionSerializer(many=True, read_only=True)

class ClientScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientScore
        fields = ("score", "contract_points", "overdue_points", "ticket_points", "calculated_at")
        read_only_fields = ("calculated_at",)

class TariffRecommendationSerializer(serializers.ModelSerializer):
    customer_name = serializers.ReadOnlyField(source="customer.user.get_full_name")
    current_tariff_details = serializers.SerializerMethodField()
    recommended_tariff_details = serializers.SerializerMethodField()
    
    class Meta:
        model = TariffRecommendation
        fields = (
            "id", "customer", "customer_name", "current_tariff", "current_tariff_details",
            "recommended_tariff", "recommended_tariff_details", "reason", 
            "avg_usage_percent", "is_reviewed", "created_at"
        )
        read_only_fields = ("created_at",)

    def get_current_tariff_details(self, obj):
        if obj.current_tariff:
            return {"id": obj.current_tariff.id, "name": obj.current_tariff.name, "price": obj.current_tariff.price}
        return None

    def get_recommended_tariff_details(self, obj):
        if obj.recommended_tariff:
            return {"id": obj.recommended_tariff.id, "name": obj.recommended_tariff.name, "price": obj.recommended_tariff.price}
        return None

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ("id", "customer", "notification_type", "message", "is_read", "created_at")
        read_only_fields = ("created_at",)
