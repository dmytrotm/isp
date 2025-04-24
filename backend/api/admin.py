from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.models import Group
from django.db.models import Sum, Count, Q
from django.utils.timezone import now
from django.urls import reverse
from django.utils.html import format_html
from datetime import timedelta
from import_export.admin import ImportExportModelAdmin, ImportExportMixin

from .models import (
    User, Customer, Employee, Address, Region, Service, Tariff, TariffService,
    ConnectionRequest, ConnectionRequestAssignment, Contract, Payment, Invoice,
    SupportTicket, NetworkUsage, EmployeeRole, Status, StatusContext, PaymentMethod, 
    Equipment, EquipmentCategory, ContractEquipment
)

from .admin_resources import (
    UserResource, CustomerResource, AddressResource, EmployeeResource, 
    EmployeeRoleResource, ServiceResource, TariffResource, EquipmentResource, 
    EquipmentCategoryResource, RegionResource, StatusResource, StatusContextResource,
    ConnectionRequestResource, ContractResource, InvoiceResource, SupportTicketResource
)

# Register default User admin
class CustomUserAdmin(ImportExportMixin, UserAdmin):
    resource_class = UserResource
    list_display = ('email', 'first_name', 'last_name', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active', 'created_at')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name')}),
        (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser',
                                       'groups', 'user_permissions')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )


class AddressInline(admin.TabularInline):
    model = Address
    extra = 0


@admin.register(Customer)
class CustomerAdmin(ImportExportModelAdmin):
    resource_class = CustomerResource
    list_display = ('id', 'get_full_name', 'phone_number', 'balance', 'status', 'preferred_notification')
    list_filter = ('status', 'preferred_notification')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'phone_number')
    inlines = [AddressInline]
    
    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
    get_full_name.short_description = 'Full Name'
    get_full_name.admin_order_field = 'user__last_name'


@admin.register(Employee)
class EmployeeAdmin(ImportExportModelAdmin):
    resource_class = EmployeeResource
    list_display = ('id', 'get_full_name', 'role')
    list_filter = ('role',)
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    
    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
    get_full_name.short_description = 'Full Name'
    get_full_name.admin_order_field = 'user__last_name'


class TariffServiceInline(admin.TabularInline):
    model = TariffService
    extra = 1


@admin.register(Tariff)
class TariffAdmin(ImportExportModelAdmin):
    resource_class = TariffResource
    list_display = ('id', 'name', 'price', 'is_active', 'get_services')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    inlines = [TariffServiceInline]
    
    def get_services(self, obj):
        return ", ".join([s.name for s in obj.services.all()])
    get_services.short_description = 'Services'


@admin.register(Service)
class ServiceAdmin(ImportExportModelAdmin):
    resource_class = ServiceResource
    list_display = ('id', 'name', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')


class ConnectionRequestAssignmentInline(admin.TabularInline):
    model = ConnectionRequestAssignment
    extra = 1


@admin.register(ConnectionRequest)
class ConnectionRequestAdmin(ImportExportModelAdmin):
    resource_class = ConnectionRequestResource
    list_display = ('id', 'customer', 'status', 'tariff', 'created_at', 'updated_at')
    list_filter = ('status', 'created_at')
    search_fields = ('customer__user__last_name', 'notes')
    inlines = [ConnectionRequestAssignmentInline]
    date_hierarchy = 'created_at'
    
    actions = ['mark_as_completed']
    
    def mark_as_completed(self, request, queryset):
        completed_count = 0
        for connection_request in queryset:
            connection_request.mark_as_completed()
            completed_count += 1
        
        self.message_user(request, f"{completed_count} connection requests marked as completed.")
    mark_as_completed.short_description = "Mark selected connection requests as completed"


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0


class InvoiceInline(admin.TabularInline):
    model = Invoice
    extra = 0


class ContractEquipmentInline(admin.TabularInline):
    model = ContractEquipment
    extra = 0


@admin.register(Contract)
class ContractAdmin(ImportExportModelAdmin):
    resource_class = ContractResource
    list_display = ('id', 'customer', 'service', 'tariff', 'start_date', 'end_date', 'is_active')
    list_filter = ('service', 'start_date')
    search_fields = ('customer__user__last_name',)
    inlines = [InvoiceInline, ContractEquipmentInline]
    date_hierarchy = 'start_date'
    
    actions = ['terminate_contracts']
    
    def terminate_contracts(self, request, queryset):
        terminated_count = 0
        for contract in queryset:
            contract.terminate()
            terminated_count += 1
        
        self.message_user(request, f"{terminated_count} contracts have been terminated.")
    terminate_contracts.short_description = "Terminate selected contracts"


@admin.register(Invoice)
class InvoiceAdmin(ImportExportModelAdmin):
    resource_class = InvoiceResource
    list_display = ('id', 'contract', 'amount', 'issue_date', 'due_date', 'status')
    list_filter = ('status', 'issue_date')
    search_fields = ('contract__customer__user__last_name', 'description')
    date_hierarchy = 'issue_date'
    
    actions = ['mark_as_paid', 'mark_as_overdue']
    
    def mark_as_paid(self, request, queryset):
        updated = queryset.update(status='paid')
        self.message_user(request, f"{updated} invoices marked as paid.")
    mark_as_paid.short_description = "Mark selected invoices as paid"
    
    def mark_as_overdue(self, request, queryset):
        overdue_count = 0
        for invoice in queryset:
            if invoice.mark_as_overdue():
                overdue_count += 1
        
        self.message_user(request, f"{overdue_count} invoices marked as overdue.")
    mark_as_overdue.short_description = "Mark selected invoices as overdue"


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'amount', 'payment_date', 'method')
    list_filter = ('method', 'payment_date')
    search_fields = ['customer__user__last_name']
    date_hierarchy = 'payment_date'
    
    actions = ['apply_payments_to_balance']
    
    def apply_payments_to_balance(self, request, queryset):
        applied_count = 0
        for payment in queryset:
            payment.apply_to_balance()
            applied_count += 1
        
        self.message_user(request, f"Applied {applied_count} payments to customer balances.")
    apply_payments_to_balance.short_description = "Apply selected payments to customer balances"


@admin.register(SupportTicket)
class SupportTicketAdmin(ImportExportModelAdmin):
    resource_class = SupportTicketResource
    list_display = ('id', 'subject', 'customer', 'status', 'created_at', 'assigned_to')
    list_filter = ('status', 'created_at')
    search_fields = ('subject', 'description', 'customer__user__last_name')
    date_hierarchy = 'created_at'
    
    actions = ['mark_as_resolved', 'mark_as_closed']
    
    def mark_as_resolved(self, request, queryset):
        updated = queryset.update(status='resolved')
        self.message_user(request, f"{updated} tickets marked as resolved.")
    mark_as_resolved.short_description = "Mark selected tickets as resolved"
    
    def mark_as_closed(self, request, queryset):
        updated = queryset.update(status='closed')
        self.message_user(request, f"{updated} tickets marked as closed.")
    mark_as_closed.short_description = "Mark selected tickets as closed"


@admin.register(NetworkUsage)
class NetworkUsageAdmin(admin.ModelAdmin):
    list_display = ('id', 'contract', 'date', 'download_gb', 'upload_gb', 'total_usage')
    list_filter = ('date',)
    search_fields = ('contract__customer__user__last_name',)
    date_hierarchy = 'date'
    
    def total_usage(self, obj):
        return obj.download_gb + obj.upload_gb
    total_usage.short_description = 'Total Usage (GB)'


@admin.register(Equipment)
class EquipmentAdmin(ImportExportModelAdmin):
    resource_class = EquipmentResource
    list_display = ('id', 'name', 'category', 'price', 'stock_quantity', 'state')
    list_filter = ('category', 'state')
    search_fields = ('name', 'description')


# Register the rest of the models with import/export functionality
@admin.register(EmployeeRole)
class EmployeeRoleAdmin(ImportExportModelAdmin):
    resource_class = EmployeeRoleResource
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(Status)
class StatusAdmin(ImportExportModelAdmin):
    resource_class = StatusResource
    list_display = ('status', 'context')
    search_fields = ('status',)
    list_filter = ('context',)

@admin.register(StatusContext)
class StatusContextAdmin(ImportExportModelAdmin):
    resource_class = StatusContextResource
    list_display = ('context',)
    search_fields = ('context',)

@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ('method',)
    search_fields = ('method',)

@admin.register(Region)
class RegionAdmin(ImportExportModelAdmin):
    resource_class = RegionResource
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(EquipmentCategory)
class EquipmentCategoryAdmin(ImportExportModelAdmin):
    resource_class = EquipmentCategoryResource
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(Address)
class AddressAdmin(ImportExportModelAdmin):
    resource_class = AddressResource
    list_display = ('customer', 'building', 'street', 'city', 'region')
    search_fields = ('building', 'street', 'city', 'customer__user__last_name')
    list_filter = ('city', 'region')

# Register User model with custom admin
admin.site.register(User, CustomUserAdmin)

# Unregister the Group model from admin since we use our custom roles
admin.site.unregister(Group)


# Customize admin site
admin.site.site_header = "Internet Provider Administration"
admin.site.site_title = "Internet Provider Admin Portal"
admin.site.index_title = "Welcome to the Internet Provider Management System"


# Create admin dashboard
class DashboardAdmin(admin.AdminSite):
    site_header = "Internet Provider Dashboard"
    site_title = "Management Dashboard"
    index_title = "System Overview"

    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path('dashboard/', self.admin_view(self.dashboard_view), name='dashboard'),
        ]
        return custom_urls + urls
    
    def dashboard_view(self, request):
        from django.shortcuts import render
        
        # Get statistics
        total_customers = Customer.objects.count()
        active_contracts = Contract.objects.filter(
            Q(end_date__isnull=True) | Q(end_date__gt=now())
        ).count()
        pending_invoices = Invoice.objects.filter(status='pending').count()
        overdue_invoices = Invoice.objects.filter(status='overdue').count()
        open_tickets = SupportTicket.objects.exclude(status__in=['resolved', 'closed']).count()
        
        # Recent connection requests
        recent_requests = ConnectionRequest.objects.order_by('-created_at')[:10]
        
        # Monthly revenues
        this_month = now().replace(day=1)
        monthly_payments = Payment.objects.filter(
            payment_date__gte=this_month
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        context = {
            'title': 'Dashboard',
            'total_customers': total_customers,
            'active_contracts': active_contracts,
            'pending_invoices': pending_invoices,
            'overdue_invoices': overdue_invoices,
            'open_tickets': open_tickets,
            'recent_requests': recent_requests,
            'monthly_payments': monthly_payments,
        }
        
        return render(request, 'admin/dashboard.html', context)