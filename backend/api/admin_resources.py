from import_export import resources, fields
from import_export.widgets import ForeignKeyWidget, ManyToManyWidget
from .models import (
    User, Customer, Address, Employee, EmployeeRole, Service, Tariff, 
    Equipment, EquipmentCategory, Region, Status, StatusContext, 
    ConnectionRequest, Contract, Invoice, Payment, SupportTicket
)

from django.apps import apps
from django.db.models import Q

class ContextAwareStatusWidget(ForeignKeyWidget):
    def __init__(self, model, context_name, field='status', **kwargs):
        self.context_name = context_name
        super().__init__(model, field, **kwargs)
    
    def clean(self, value, row=None, *args, **kwargs):
        if value:
            try:
                # Get StatusContext
                StatusContext = apps.get_model('api', 'StatusContext')
                context = StatusContext.objects.get(context=self.context_name)
                
                # Try to find status in the correct context
                return self.model.objects.get(
                    Q(status=value) & Q(context=context)
                )
            except (self.model.DoesNotExist, StatusContext.DoesNotExist):
                raise ValueError(f"Status '{value}' not found in context '{self.context_name}'")
        return None

class UserResource(resources.ModelResource):
    class Meta:
        model = User
        import_id_fields = ('email',)
        fields = ('id', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'password')
        export_order = fields

class EmployeeRoleResource(resources.ModelResource):
    class Meta:
        model = EmployeeRole
        import_id_fields = ('name',)
        fields = ('id', 'name')

class StatusContextResource(resources.ModelResource):
    class Meta:
        model = StatusContext
        import_id_fields = ('context',)
        fields = ('id', 'context')

class StatusResource(resources.ModelResource):
    context = fields.Field(
        column_name='context',
        attribute='context',
        widget=ForeignKeyWidget(StatusContext, 'context')
    )
    
    class Meta:
        model = Status
        fields = ('id', 'status', 'context')
        export_order = fields

class RegionResource(resources.ModelResource):
    class Meta:
        model = Region
        import_id_fields = ('name',)
        fields = ('id', 'name')

class EquipmentCategoryResource(resources.ModelResource):
    class Meta:
        model = EquipmentCategory
        import_id_fields = ('name',)
        fields = ('id', 'name')

class EquipmentResource(resources.ModelResource):
    category = fields.Field(
        column_name='category',
        attribute='category',
        widget=ForeignKeyWidget(EquipmentCategory, 'name')
    )
    
    class Meta:
        model = Equipment
        fields = ('id', 'name', 'description', 'price', 'stock_quantity', 'category', 'state')
        export_order = fields


class CustomerResource(resources.ModelResource):
    user_email = fields.Field(
        column_name='user_email',
        attribute='user',
        widget=ForeignKeyWidget(User, 'email')
    )
    status = fields.Field(
        column_name='status',
        attribute='status',
        widget=ContextAwareStatusWidget(Status, context_name='Customer')
    )

    class Meta:
        model = Customer
        fields = ('id', 'user_email', 'status', 'phone_number', 'balance', 'preferred_notification')
        export_order = fields

class AddressResource(resources.ModelResource):
    region = fields.Field(
        column_name='region',
        attribute='region',
        widget=ForeignKeyWidget(Region, 'name')
    )
    customer_phone = fields.Field(
        column_name='customer_phone',
        attribute='customer',
        widget=ForeignKeyWidget(Customer, 'phone_number')
    )
    
    class Meta:
        model = Address
        fields = ('id', 'apartment', 'building', 'street', 'city', 'region', 'customer_phone')
        export_order = fields

class EmployeeResource(resources.ModelResource):
    user_email = fields.Field(
        column_name='user_email',
        attribute='user',
        widget=ForeignKeyWidget(User, 'email')
    )
    role = fields.Field(
        column_name='role',
        attribute='role',
        widget=ForeignKeyWidget(EmployeeRole, 'name')
    )
    
    class Meta:
        model = Employee
        fields = ('id', 'user_email', 'role')
        export_order = fields

class ServiceResource(resources.ModelResource):
    class Meta:
        model = Service
        import_id_fields = ('name',)
        fields = ('id', 'name', 'description', 'is_active')
        export_order = fields

class TariffResource(resources.ModelResource):
    services = fields.Field(
        column_name='services',
        attribute='services',
        widget=ManyToManyWidget(Service, field='name', separator=',')
    )
    
    class Meta:
        model = Tariff
        import_id_fields = ('name',)
        fields = ('id', 'name', 'price', 'description', 'is_active', 'services')
        export_order = fields

class ConnectionRequestResource(resources.ModelResource):
    customer_phone = fields.Field(
        column_name='customer_phone',
        attribute='customer',
        widget=ForeignKeyWidget(Customer, 'phone_number')
    )
    status = fields.Field(
        column_name='status',
        attribute='status',
        widget=ContextAwareStatusWidget(Status, context_name='ConnectionRequest')
    )
    address = fields.Field(
        column_name='address',
        attribute='address',
        widget=ForeignKeyWidget(Address, 'id')
    )
    tariff = fields.Field(
        column_name='tariff',
        attribute='tariff',
        widget=ForeignKeyWidget(Tariff, 'name')
    )
    
    class Meta:
        model = ConnectionRequest
        fields = ('id', 'customer_phone', 'status', 'created_at', 'updated_at', 'address', 'tariff', 'notes')
        export_order = fields

class ContractResource(resources.ModelResource):
    customer_phone = fields.Field(
        column_name='customer_phone',
        attribute='customer',
        widget=ForeignKeyWidget(Customer, 'phone_number')
    )
    connection_request = fields.Field(
        column_name='connection_request',
        attribute='connection_request',
        widget=ForeignKeyWidget(ConnectionRequest, 'id')
    )
    address = fields.Field(
        column_name='address',
        attribute='address',
        widget=ForeignKeyWidget(Address, 'id')
    )
    service = fields.Field(
        column_name='service',
        attribute='service',
        widget=ForeignKeyWidget(Service, 'name')
    )
    tariff = fields.Field(
        column_name='tariff',
        attribute='tariff',
        widget=ForeignKeyWidget(Tariff, 'name')
    )
    equipment = fields.Field(
        column_name='equipment',
        attribute='equipment',
        widget=ManyToManyWidget(Equipment, field='name', separator=',')
    )
    
    class Meta:
        model = Contract
        fields = ('id', 'customer_phone', 'connection_request', 'address', 'service', 'tariff', 
                 'created_at', 'start_date', 'end_date', 'equipment')
        export_order = fields

class InvoiceResource(resources.ModelResource):
    contract = fields.Field(
        column_name='contract',
        attribute='contract',
        widget=ForeignKeyWidget(Contract, 'id')
    )
    
    class Meta:
        model = Invoice
        fields = ('id', 'contract', 'amount', 'issue_date', 'due_date', 'description', 'status')
        export_order = fields

class SupportTicketResource(resources.ModelResource):
    customer_phone = fields.Field(
        column_name='customer_phone',
        attribute='customer',
        widget=ForeignKeyWidget(Customer, 'phone_number')
    )
    assigned_to = fields.Field(
        column_name='assigned_to',
        attribute='assigned_to',
        widget=ForeignKeyWidget(Employee, 'id')
    )
    status = fields.Field(
        column_name='status',
        attribute='status',
        widget=ContextAwareStatusWidget(Status, context_name='SupportTicket')
    )
    
    class Meta:
        model = SupportTicket
        fields = ('id', 'customer_phone', 'subject', 'description', 'created_at', 'updated_at', 
                 'status', 'assigned_to')
        export_order = fields