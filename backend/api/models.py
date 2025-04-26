from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils.timezone import now
from django.core.validators import RegexValidator, validate_email
from django.core.exceptions import ValidationError
from datetime import timedelta

from .mixins import ContextAwareModelMixin

from django.db.models.signals import post_migrate, post_save, pre_delete
from django.dispatch import receiver
from django.contrib.auth.models import Permission, Group
from django.contrib.contenttypes.models import ContentType

phone_regex = RegexValidator(
    regex=r'^\+380\d{9}$', message="Phone number must be in the format +380XXXXXXXXX"
)

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        
        email = self.normalize_email(email)
        
        try:
            validate_email(email)  
        except ValidationError as e:
            raise ValueError(f"Invalid email: {str(e)}")
        
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=now, editable=False)
    
    objects = CustomUserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    def __str__(self):
        return f"{self.email}"
    
    class Meta:
        indexes = [
            models.Index(fields=['email']),
        ]

class EmployeeRole(models.Model):
    name = models.CharField(max_length=50, unique=True)
    
    def __str__(self):
        return self.name

class StatusContext(models.Model):
    context = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'api_statuscontext'
    
    def __str__(self):
        return self.context

class Status(models.Model):
    status = models.CharField(max_length=50)  # No longer unique at model level
    context = models.ForeignKey(StatusContext, on_delete=models.CASCADE, related_name='statuses')
    
    def __str__(self):
        return f"{self.status} ({self.context})"
    
    class Meta:
        verbose_name_plural = "Statuses"
        # This ensures status names are unique per context
        unique_together = ['status', 'context']
        db_table = 'api_status'
        
    @classmethod
    def get_statuses_by_context(cls, context_name):
        """Returns statuses filtered by the specified context"""
        try:
            specific_context = StatusContext.objects.get(context=context_name)
            return cls.objects.filter(context=specific_context)
        except StatusContext.DoesNotExist:
            return cls.objects.none()

class PaymentMethod(models.Model):
    method = models.CharField(max_length=50, unique=True)
    
    def __str__(self):
        return self.method

class Region(models.Model):
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name
    
class EquipmentCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name

class Equipment(models.Model):
    STATE_CHOICES = [
        ('new', 'New'),
        ('used', 'Used')
    ]

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.PositiveIntegerField(default=0)
    category = models.ForeignKey(EquipmentCategory, on_delete=models.CASCADE)
    state = models.CharField(max_length=20, choices=STATE_CHOICES, default='new')
    
    def __str__(self):
        return f"{self.name} - {self.category.name}, {self.price}$"

class Customer(models.Model, ContextAwareModelMixin):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    status = models.ForeignKey(Status, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=13, validators=[phone_regex], unique=True, null=False, blank=False)
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    preferred_notification = models.CharField(
        max_length=20, 
        choices=[('email', 'Email'), ('sms', 'SMS')],
        default='email'
    )
    
    def __str__(self):
        return f"Customer: {self.user.first_name} {self.user.last_name}"
    
    def get_active_contracts(self):
        return self.contracts.filter(end_date__gt=now())
    
    def get_total_monthly_payment(self):
        active_contracts = self.get_active_contracts()
        return sum(contract.tariff.price for contract in active_contracts)
    
    def save(self, *args, **kwargs):
        self.user.is_staff = False  
        self.user.is_superuser = False
        self.user.save()
        
        self.user.groups.clear()  # Remove any existing groups
        customer_group = Group.objects.get(name='Customer')
        self.user.groups.add(customer_group)
        
        super().save(*args, **kwargs)

    class Meta:
        indexes = [
            models.Index(fields=['phone_number']),
        ]

class Address(models.Model):
    apartment = models.CharField(max_length=50, blank=True, null=True)  
    building = models.CharField(max_length=255)
    street = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    region = models.ForeignKey(Region, on_delete=models.CASCADE)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='addresses')
    
    def __str__(self):
        return f"{self.apartment} {self.building}, {self.street}, {self.city}, {self.region.name}"
    
    class Meta:
        verbose_name_plural = "Addresses"


class Employee(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile')
    role = models.ForeignKey(EmployeeRole, on_delete=models.CASCADE)
    
    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name} - {self.role}"
    
    def save(self, *args, **kwargs):
        self.user.is_staff = True  

        # Set superuser status for admin role
        if self.role.name.lower() == 'admin':
            self.user.is_superuser = True
        else:
            self.user.is_superuser = False
        
        # Save the user first so we can add groups
        self.user.save()
        
        # Clear existing groups
        self.user.groups.clear()
        
        # Assign new group based on role
        role_name = self.role.name.lower()
        if role_name == 'support':
            group = Group.objects.get(name='Support')
            self.user.groups.add(group)
        elif role_name == 'manager':
            group = Group.objects.get(name='Manager')
            self.user.groups.add(group)
        # Add other role mappings as needed
        
        super().save(*args, **kwargs)  

class Service(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name

class Tariff(models.Model):
    name = models.CharField(max_length=100, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    services = models.ManyToManyField(Service, through='TariffService')
    
    def __str__(self):
        return f"{self.name} - {self.price}₴"
    
    def get_services_list(self):
        return ", ".join(service.name for service in self.services.all())

class TariffService(models.Model):
    tariff = models.ForeignKey(Tariff, on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    
    def __str__(self):
        return f"{self.tariff.name} - {self.service.name}"
    
    class Meta:
        unique_together = ('tariff', 'service')

class ConnectionRequest(models.Model, ContextAwareModelMixin):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    employees = models.ManyToManyField(Employee, through='ConnectionRequestAssignment')
    status = models.ForeignKey(Status, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False)
    address = models.ForeignKey(Address, on_delete=models.PROTECT, null=True, blank=True)
    tariff = models.ForeignKey(Tariff, on_delete=models.PROTECT)
    notes = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"Request #{self.id} - {self.customer.user.last_name} ({self.status})"

    def assign_technician(self, employee):
        """
        Assign an employee as a technician to this request.
        Automatically set role to 'technician'.
        """
        assignment, created = ConnectionRequestAssignment.objects.get_or_create(
            connection_request=self,
            employee=employee,
            role='technician'
        )
        return assignment

    def clean(self):
        """Validate that address belongs to the customer"""
        super().clean()
        
        if self.customer and self.address and self.address.customer != self.customer:
            raise ValidationError({
                'address': f"This address does not belong to the customer with phone number {self.customer.phone_number}."
            })
        
        if self.status and self.status.context.context != 'ConnectionRequest':
            raise ValidationError({
                'status': f"Status must belong to 'ConnectionRequest' context, not '{self.status.context.context}'"
            })
    
    def save(self, *args, **kwargs):
        """Ensure validation runs before saving"""
        self.full_clean()
        return super().save(*args, **kwargs)
    
    class Meta:
        indexes = [
            models.Index(fields=['customer', 'status']),
        ]

class ConnectionRequestAssignment(models.Model):
    ROLE_CHOICES = [
        ('technician', 'Technician'),
        ('manager', 'Manager'),
    ]
    connection_request = models.ForeignKey(ConnectionRequest, on_delete=models.CASCADE)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    assigned_at = models.DateTimeField(auto_now_add=True)

class Contract(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='contracts')
    connection_request = models.OneToOneField(ConnectionRequest, on_delete=models.PROTECT)
    address = models.ForeignKey(Address, on_delete=models.PROTECT)
    service = models.ForeignKey(Service, on_delete=models.PROTECT)
    tariff = models.ForeignKey(Tariff, on_delete=models.PROTECT, null=True, blank=True)
    created_at = models.DateTimeField(default=now, editable=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False)
    start_date = models.DateTimeField(default=now)
    end_date = models.DateTimeField(null=False, blank=True)

    @property
    def is_active(self):
        return self.end_date is None or self.end_date > now()
    
    equipment = models.ManyToManyField(Equipment, blank=True)
    
    def __str__(self):
        return f"Contract #{self.id} - {self.customer.user.last_name}"
    
    def clean(self):
        if self.end_date and self.end_date <= self.start_date:
            raise ValueError("End date must be later than start date")
    
    def save(self, *args, **kwargs):
        if self.connection_request and not hasattr(self, 'address'):
            self.address = self.connection_request.address
        super().save(*args, **kwargs)
    
    def terminate(self):
        """Terminate the contract by setting the end date to today."""
        # Set the end date to today if it's currently None or in the future
        today = now().date()
        if self.end_date is None or self.end_date > today:
            self.end_date = today
            # Use update() directly on the queryset instead of save() to avoid issues
            Contract.objects.filter(id=self.id).update(end_date=today)
            # Refresh from DB to get the updated values
            self.refresh_from_db()
            return True
        return False

    class Meta:
        indexes = [
            models.Index(fields=['customer', 'start_date']),
        ]

class ContractEquipment(models.Model):
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE)
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE)
    assigned_at = models.DateTimeField(auto_now_add=True, editable=False)
    is_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.pk:  # Only when the object is being created (not updated)
            equipment = self.equipment
            if equipment.stock_quantity > 0:  # Ensure there's stock available
                equipment.stock_quantity -= 1
                equipment.save()
            else:
                raise ValueError("Not enough equipment in stock")

        super().save(*args, **kwargs)  # Call the parent class's save method

    def return_equipment(self):
        """Позначає обладнання як повернене і оновлює кількість на складі"""
        if not self.is_returned:
            self.is_returned = True
            self.returned_at = now()
            self.save()
            
            # Повертаємо обладнання на склад
            equipment = self.equipment
            equipment.stock_quantity += 1
            equipment.save()
            
            return True
        return False

    def __str__(self):
        return f"Equipment {self.equipment} - Assigned at {self.assigned_at} to {self.contract.customer.user.first_name} {self.contract.customer.user.last_name}"

class Payment(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    method = models.ForeignKey(PaymentMethod, on_delete=models.CASCADE)
    
    def __str__(self):
        return f"Payment #{self.id} - {self.customer.user.first_name} {self.customer.user.last_name} - {self.amount}$"
    
    def apply_to_balance(self):
        customer = self.customer
        customer.balance += self.amount
        customer.save()

class Invoice(models.Model):
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='invoices')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    issue_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField()
    description = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'), 
            ('paid', 'Paid'),
            ('overdue', 'Overdue')
        ],
        default='pending'
    )
    
    def __str__(self):
        return f"Invoice #{self.id} - {self.contract.customer.user.first_name} {self.contract.customer.user.last_name} - {self.amount}₴"
    
    def is_overdue(self):
        return self.status == 'pending' and now() > self.due_date
    
    def mark_as_overdue(self):
        if self.is_overdue() and self.status != 'overdue':
            self.status = 'overdue'
            self.save()
            return True
        return False

    @classmethod
    def overdue(cls):
        overdue_invoices = cls.objects.filter(
            status='pending', 
            due_date__lt=now()
        )

        # Perform bulk update on all overdue invoices
        overdue_invoices.update(status='overdue')

        return overdue_invoices

    
    @classmethod
    def due_tomorrow(cls):
        tomorrow = now().date() + timedelta(days=1)
        return cls.objects.filter(
            status='pending',
            due_date__date=tomorrow
        )
    
    class Meta:
        indexes = [
            models.Index(fields=['status', 'due_date']),
        ]

class SupportTicket(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='support_tickets')
    subject = models.CharField(max_length=100)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.ForeignKey(Status, on_delete=models.CASCADE)
    assigned_to = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True)
    
    def __str__(self):
        return f"Ticket #{self.id} - {self.subject} ({self.status})"

    def assign_employee(self, employee):
        """Assign an employee and automatically change the status to 'open'."""
        self.assigned_to = employee
        self.status = 'open'
        self.save()

    def clean(self):
        if self.status and self.status.context.context != 'SupportTicket':
            raise ValidationError({
                'status': f"Status must belong to 'SupportTicket' context, not '{self.status.context.context}'"
            })

class NetworkUsage(models.Model):
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE)
    date = models.DateField()
    download_gb = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    upload_gb = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    def __str__(self):
        return f"Usage for {self.contract.customer.user.last_name} on {self.date}"
    
    class Meta:
        unique_together = ('contract', 'date')


@receiver(post_migrate)
def create_user_groups(sender, **kwargs):
    if sender.name == 'api':
        support_group, _ = Group.objects.get_or_create(name='Support')
        manager_group, _ = Group.objects.get_or_create(name='Manager')
        customer_group, _ = Group.objects.get_or_create(name='Customer')
        
        support_ticket_ct = ContentType.objects.get_for_model(SupportTicket)
        customer_ct = ContentType.objects.get_for_model(Customer)
        contract_ct = ContentType.objects.get_for_model(Contract)
        tariff_ct = ContentType.objects.get_for_model(Tariff)
        invoice_ct = ContentType.objects.get_for_model(Invoice)
        
        support_perms = [
            Permission.objects.get_or_create(
                codename='view_supportticket',
                name='Can view support ticket',
                content_type=support_ticket_ct
            )[0],
            Permission.objects.get_or_create(
                codename='change_supportticket',
                name='Can change support ticket',
                content_type=support_ticket_ct
            )[0],
            Permission.objects.get_or_create(
                codename='view_customer',
                name='Can view customer',
                content_type=customer_ct
            )[0],
            Permission.objects.get_or_create(
                codename='view_contract',
                name='Can view contract',
                content_type=contract_ct
            )[0],
        ]

        connection_request_ct = ContentType.objects.get_for_model(ConnectionRequest)        
        # Define permissions for Manager role
        manager_perms = support_perms + [
            Permission.objects.get_or_create(
                codename='add_contract',
                name='Can add contract',
                content_type=contract_ct
            )[0],
            Permission.objects.get_or_create(
                codename='change_contract',
                name='Can change contract',
                content_type=contract_ct
            )[0],
            Permission.objects.get_or_create(
                codename='view_tariff',
                name='Can view tariff',
                content_type=tariff_ct
            )[0],
            Permission.objects.get_or_create(
                codename='view_invoice',
                name='Can view invoice',
                content_type=invoice_ct
            )[0],
            Permission.objects.get_or_create(
                codename='add_invoice',
                name='Can add invoice',
                content_type=invoice_ct
            )[0],
            Permission.objects.get_or_create(
                codename='mark_completed_connection_request',
                name='Can mark connection request as completed',
                content_type=connection_request_ct
            )[0],
        ]
        
        # Define permissions for Customer role
        customer_perms = [
            Permission.objects.get_or_create(
                codename='view_own_contract',
                name='Can view own contract',
                content_type=contract_ct
            )[0],
            Permission.objects.get_or_create(
                codename='view_own_invoice',
                name='Can view own invoice',
                content_type=invoice_ct
            )[0],
            Permission.objects.get_or_create(
                codename='add_supportticket',
                name='Can add support ticket',
                content_type=support_ticket_ct
            )[0],
            Permission.objects.get_or_create(
                codename='change_own_customer',
                name='Can change own customer info',
                content_type=customer_ct
            )[0],
        ]
        
        # Assign permissions to groups
        support_group.permissions.set(support_perms)
        manager_group.permissions.set(manager_perms)
        customer_group.permissions.set(customer_perms)        