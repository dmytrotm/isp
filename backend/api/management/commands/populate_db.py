import random
from decimal import Decimal
from datetime import timedelta, date
from django.core.management.base import BaseCommand
from django.utils.timezone import now
from django.core.exceptions import ValidationError
from faker import Faker
from django.db import connection
from unidecode import unidecode
import re

from django.contrib.auth.models import Group
from api.models import (
    User, EmployeeRole, StatusContext, Status, PaymentMethod, Region,
    EquipmentCategory, Equipment, Customer, Address, Employee,
    Service, Tariff, TariffService, ConnectionRequest, ConnectionRequestAssignment,
    Contract, ContractEquipment, Payment, Invoice, SupportTicket, NetworkUsage
)

# Initialize Faker
fake = Faker('uk_UA')  # Ukrainian locale, adjust as needed

def clean_name(name):
    return re.sub(r'[^a-z0-9]', '', unidecode(name).lower())

class Command(BaseCommand):
    help = 'Populates the database with sample data for testing'
    
    def add_arguments(self, parser):
        parser.add_argument('--customers', type=int, default=100, help='Number of customers to create')
        parser.add_argument('--staff', type=int, default=50, help='Number of staff members to create')
        parser.add_argument('--equipment', type=int, default=20, help='Number of equipment items to create')
        parser.add_argument('--services', type=int, default=5, help='Number of services to create')
        parser.add_argument('--tariffs', type=int, default=10, help='Number of tariffs to create')
        parser.add_argument('--tickets', type=int, default=40, help='Number of support tickets to create')
        parser.add_argument('--requests', type=int, default=400, help='Number of connection requests to create')
        parser.add_argument('--contract-percent', type=int, default=100, 
                           help='Percentage of completed requests to convert to contracts')
        parser.add_argument('--clear', action='store_true', help='Clear existing data before populating')
        parser.add_argument('--fixed-amount', type=Decimal, default=Decimal('500.00'), 
                           help='Fixed amount for invoices and payments')
    
    def handle(self, *args, **options):       
        if options['clear']:
            self.clear_data()
        
        self.fixed_amount = options['fixed_amount']
        
        self.create_initial_data()
        self.create_equipment(options['equipment'])
        self.create_services_and_tariffs(options['services'], options['tariffs'])
        self.create_users_and_staff(options['staff'])
        self.create_customers(options['customers'])
        self.create_connection_requests(options['requests'])
        self.create_contracts_for_every_day(options['contract_percent'])
        self.create_support_tickets(options['tickets'])
        self.create_payments_and_invoices()
        self.create_network_usage()
        
        self.stdout.write(self.style.SUCCESS('Successfully populated the database with sample data!'))
    
    def clear_data(self):
        """Clear all data by truncating tables with proper constraints handling"""
        self.stdout.write(self.style.WARNING('Clearing existing data...'))
        
        # Get the database cursor
        cursor = connection.cursor()
        
        # For SQL Server specifically, disable constraint checking temporarily
        try:
            cursor.execute("EXEC sp_MSforeachtable @command1='DISABLE TRIGGER ALL ON ?'")
            cursor.execute("EXEC sp_MSforeachtable @command1='ALTER TABLE ? NOCHECK CONSTRAINT ALL'")
            
            # Truncate all tables in reverse dependency order
            tables = [
                'api_networkusage',
                'api_payment',
                'api_invoice',
                'api_supportticket',
                'api_contractequipment',
                'api_contract',
                'api_connectionrequestassignment',
                'api_connectionrequest',
                'api_address',
                'api_customer',
                'api_employee',
                'api_tariffservice',
                'api_tariff',
                'api_service',
                'api_equipment',
                # Skip Django system tables like auth_user, etc.
            ]
            
            for table in tables:
                try:
                    cursor.execute(f"IF OBJECT_ID('{table}', 'U') IS NOT NULL TRUNCATE TABLE {table}")
                    self.stdout.write(self.style.SUCCESS(f"Cleared {table}"))
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"Error clearing {table}: {e}"))
            
            # Re-enable constraints
            cursor.execute("EXEC sp_MSforeachtable @command1='ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL'")
            cursor.execute("EXEC sp_MSforeachtable @command1='ENABLE TRIGGER ALL ON ?'")
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error during database clearing: {e}"))
        
        self.stdout.write(self.style.SUCCESS('Data cleared successfully.'))

    def create_initial_data(self):
        """Create basic data required for relationships"""
        self.stdout.write(self.style.NOTICE('Creating initial data...'))
        
        # Create employee roles
        roles = ['admin', 'manager', 'support', 'technician']
        for role_name in roles:
            EmployeeRole.objects.get_or_create(name=role_name)
        
        # Create Django user groups for permissions
        groups = ['admin', 'manager', 'support', 'technician', 'customer']
        for group_name in groups:
            Group.objects.get_or_create(name=group_name)
        
        # Create status contexts
        contexts = ['ConnectionRequest', 'SupportTicket', 'Customer']
        for context_name in contexts:
            StatusContext.objects.get_or_create(context=context_name)
        
        # Create statuses for each context
        connection_context = StatusContext.objects.get(context='ConnectionRequest')
        connection_statuses = ['New', 'Approved', 'Denied', 'Completed']  
        for status in connection_statuses:
            Status.objects.get_or_create(status=status, context=connection_context)
        
        support_context = StatusContext.objects.get(context='SupportTicket')
        support_statuses = ['New', 'Open', 'In Progress', 'Resolved']
        for status in support_statuses:
            Status.objects.get_or_create(status=status, context=support_context)
        
        customer_context = StatusContext.objects.get(context='Customer')
        customer_statuses = ['Active', 'Inactive', 'Blocked', 'New']
        for status in customer_statuses:
            Status.objects.get_or_create(status=status, context=customer_context)
        
        # Create payment methods
        payment_methods = ['Credit Card', 'Bank Transfer', 'Cash', 'Mobile Payment']
        for method in payment_methods:
            PaymentMethod.objects.get_or_create(method=method)
        
        # Create regions
        regions = ['Kyiv', 'Lviv', 'Odesa', 'Kharkiv', 'Dnipro']
        for region_name in regions:
            Region.objects.get_or_create(name=region_name)
        
        # Create equipment categories
        categories = ['Router', 'Modem', 'Switch', 'Optical Network Terminal', 'Cable']
        for category_name in categories:
            EquipmentCategory.objects.get_or_create(name=category_name)
        
        self.stdout.write(self.style.SUCCESS('Initial data created successfully.'))

    def create_equipment(self, num_items):
        """Create equipment items with larger stock quantities"""
        self.stdout.write(self.style.NOTICE(f'Creating {num_items} equipment items...'))
        
        fake = Faker('uk_UA')
        categories = list(EquipmentCategory.objects.all())
        
        for _ in range(num_items):
            name = fake.word() + " " + fake.word()
            description = fake.paragraph()
            price = Decimal(str(random.randint(500, 5000)))
            stock_quantity = random.randint(200, 500)  # Increased stock quantity
            category = random.choice(categories)
            state = random.choice(['new', 'used'])
            
            Equipment.objects.create(
                name=name,
                description=description,
                price=price,
                stock_quantity=stock_quantity,
                category=category,
                state=state
            )
        
        self.stdout.write(self.style.SUCCESS(f'Created {num_items} equipment items.'))


    def create_services_and_tariffs(self, num_services, num_tariffs):
        """Create services and tariffs"""
        self.stdout.write(self.style.NOTICE(f'Creating {num_services} services and {num_tariffs} tariffs...'))
        
        fake = Faker('uk_UA')
        
        # Create services
        services = []
        service_names = [
            'Internet Access', 'IPTV', 'VoIP Telephony', 
            'Cloud Storage', 'Technical Support'
        ]
        
        for name in service_names[:num_services]:
            service, created = Service.objects.get_or_create(
                name=name,
                defaults={
                    'description': fake.paragraph(),
                    'is_active': True
                }
            )
            services.append(service)
        
        # Create tariffs
        tariff_names = [
            'Basic', 'Standard', 'Premium', 'Ultra', 'Business', 
            'Student', 'Family', 'Gaming', 'Streaming', 'Professional'
        ]
        
        for name in tariff_names[:num_tariffs]:
            tariff, created = Tariff.objects.get_or_create(
                name=name,
                defaults={
                    'price': Decimal(str(random.randint(200, 1000))),
                    'description': fake.paragraph(),
                    'is_active': True
                }
            )
            
            # Add random services to this tariff
            num_services_to_add = random.randint(1, min(3, len(services)))
            for service in random.sample(services, num_services_to_add):
                TariffService.objects.get_or_create(tariff=tariff, service=service)
        
        self.stdout.write(self.style.SUCCESS(f'Created {num_services} services and {num_tariffs} tariffs.'))

    def create_users_and_staff(self, num_staff):
        """Create admin user and staff members"""
        self.stdout.write(self.style.NOTICE(f'Creating admin and {num_staff} staff members...'))
        
        fake = Faker('uk_UA')
        
        # Get Django groups
        admin_group = Group.objects.get(name='admin')
        manager_group = Group.objects.get(name='manager')
        support_group = Group.objects.get(name='support')
        technician_group = Group.objects.get(name='technician')
        
        # Create admin user if it doesn't exist
        admin_email = 'admin@example.com'
        admin_user, created = User.objects.get_or_create(
            email=admin_email,
            defaults={
                'first_name': 'Admin',
                'last_name': 'User',
                'is_active': True,
                'is_staff': True,
                'is_superuser': True
            }
        )
        
        if created:
            admin_user.set_password('adminpassword')
            admin_user.groups.add(admin_group)
            admin_user.save()
            admin_role = EmployeeRole.objects.get(name='admin')
            Employee.objects.create(user=admin_user, role=admin_role)
            self.stdout.write(self.style.SUCCESS('Created admin user with email: admin@example.com and password: adminpassword'))
        
        # Create a specific manager user
        manager_email = 'manager@example.com'
        manager_user, created = User.objects.get_or_create(
            email=manager_email,
            defaults={
                'first_name': 'manager',
                'last_name': 'User',
                'is_active': True,
                'is_staff': True
            }
        )
        
        if created:
            manager_user.set_password('password123')
            manager_user.groups.add(manager_group)
            manager_user.save()
            manager_role = EmployeeRole.objects.get(name='manager')
            Employee.objects.create(user=manager_user, role=manager_role)
            self.stdout.write(self.style.SUCCESS('Created manager user with email: manager@example.com and password: password123'))
        
        # Create a specific support user
        support_email = 'support@example.com'
        support_user, created = User.objects.get_or_create(
            email=support_email,
            defaults={
                'first_name': 'support',
                'last_name': 'User',
                'is_active': True,
                'is_staff': True
            }
        )
        
        if created:
            support_user.set_password('password123')
            support_user.groups.add(support_group)
            support_user.save()
            support_role = EmployeeRole.objects.get(name='support')
            Employee.objects.create(user=support_user, role=support_role)
            self.stdout.write(self.style.SUCCESS('Created support user with email: support@example.com and password: password123'))

        # Create a specific technician user
        technician_email = 'technician@example.com'
        technician_user, created = User.objects.get_or_create(
            email=technician_email,
            defaults={
                'first_name': 'Technician',
                'last_name': 'User',
                'is_active': True,
                'is_staff': True
            }
        )

        if created:
            technician_user.set_password('password123')
            technician_user.groups.add(technician_group)
            technician_user.save()
            technician_role = EmployeeRole.objects.get(name='technician')
            Employee.objects.create(user=technician_user, role=technician_role)
            self.stdout.write(self.style.SUCCESS('Created technician user with email: technician@example.com and password: password123'))
        
        # Create additional staff members
        roles = list(EmployeeRole.objects.all())
        groups_map = {
            'admin': admin_group,
            'manager': manager_group,
            'support': support_group,
            'technician': technician_group
        }
        
        for i in range(num_staff):
            first_name = fake.first_name()
            last_name = fake.last_name()
            email = f"{clean_name(first_name).lower()}.{clean_name(last_name).lower()}{i}@example.com"
            
            try:
                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        'first_name': first_name,
                        'last_name': last_name,
                        'is_active': True,
                        'is_staff': True
                    }
                )
                
                if created:
                    user.set_password('password123')
                    role = random.choice(roles)
                    
                    # Add user to the appropriate group based on role
                    if role.name in groups_map:
                        user.groups.add(groups_map[role.name])
                    
                    user.save()
                    Employee.objects.create(user=user, role=role)
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error creating staff {email}: {str(e)}"))
        
        self.stdout.write(self.style.SUCCESS(f'Created admin and {num_staff} staff members.'))

    def create_customers(self, num_customers):
        """Create customer accounts with addresses"""
        self.stdout.write(self.style.NOTICE(f'Creating {num_customers} customers...'))
        
        fake = Faker('uk_UA')
        customer_status = Status.objects.get(status='Active', context__context='Customer')
        regions = list(Region.objects.all())
        customer_group = Group.objects.get(name='Customer')
        
        # Create one specific customer with a known email
        first_name = 'Customer'
        last_name = 'User'
        email = 'customer@example.com'
        
        try:
            # Create specific customer user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': first_name,
                    'last_name': last_name,
                    'is_active': True,
                    'is_staff': False
                }
            )
            
            if created:
                user.set_password('password123')
                user.groups.add(customer_group)
                user.save()
                
                # Generate valid Ukrainian phone number in the required format
                phone_number = "+380" + ''.join([str(random.randint(0, 9)) for _ in range(9)])
                
                # Create customer profile
                customer = Customer.objects.create(
                    user=user,
                    status=customer_status,
                    phone_number=phone_number,
                    balance=Decimal(str(random.randint(0, 2000))),
                    preferred_notification=random.choice(['email', 'sms'])
                )
                
                # Create 1-2 addresses for this customer
                for _ in range(random.randint(1, 2)):
                    Address.objects.create(
                        apartment=str(random.randint(1, 200)),
                        building=str(random.randint(1, 100)),
                        street=fake.street_name(),
                        city=fake.city(),
                        region=random.choice(regions),
                        customer=customer
                    )
                
                self.stdout.write(self.style.SUCCESS('Created customer user with email: customer@example.com and password: password123'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error creating specific customer: {str(e)}"))
        
        # Now create random customers
        for i in range(num_customers):
            first_name = fake.first_name()
            last_name = fake.last_name()
            email = f"{clean_name(first_name).lower()}.{clean_name(last_name).lower()}{i}@example.com"
            
            # Generate valid Ukrainian phone number in the required format
            phone_number = "+380" + ''.join([str(random.randint(0, 9)) for _ in range(9)])
            
            try:
                # Create user
                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        'first_name': first_name,
                        'last_name': last_name,
                        'is_active': True,
                        'is_staff': False
                    }
                )
                
                if created:
                    user.set_password('password123')
                    user.groups.add(customer_group)  # Add to Customer group
                    user.save()
                
                # Create customer profile
                customer, customer_created = Customer.objects.get_or_create(
                    user=user,
                    defaults={
                        'status': customer_status,
                        'phone_number': phone_number,
                        'balance': Decimal(str(random.randint(0, 2000))),
                        'preferred_notification': random.choice(['email', 'sms'])
                    }
                )
                
                # Create 1-2 addresses for this customer
                if customer_created:
                    for _ in range(random.randint(1, 2)):
                        Address.objects.create(
                            apartment=str(random.randint(1, 200)),
                            building=str(random.randint(1, 100)),
                            street=fake.street_name(),
                            city=fake.city(),
                            region=random.choice(regions),
                            customer=customer
                        )
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error creating customer {email}: {str(e)}"))
        
        self.stdout.write(self.style.SUCCESS(f'Created {num_customers} customers.'))

    def create_connection_requests(self, num_requests):
        """Create connection requests"""
        self.stdout.write(self.style.NOTICE(f'Creating {num_requests} connection requests...'))
        
        customers = list(Customer.objects.all())
        completed_status = Status.objects.get(status='Completed', context__context='ConnectionRequest')
        tariffs = list(Tariff.objects.filter(is_active=True))
        technicians = list(Employee.objects.filter(role__name='technician'))
        
        # Ensure we have at least 3 requests per day for the last 90 days
        minimum_requests = 3 * 90  # 3 requests per day for 90 days
        num_requests = max(num_requests, minimum_requests)
        
        count = 0
        for _ in range(num_requests):
            try:
                if not customers:
                    self.stdout.write(self.style.WARNING('No customers available to create connection requests'))
                    break
                    
                # Instead of random.choice, distribute customers more evenly
                # Select customers in a cycle to ensure good distribution
                customer = customers[count % len(customers)]
                status = completed_status
                
                # Get a random address from this customer
                addresses = list(Address.objects.filter(customer=customer))
                if not addresses:
                    continue
                
                address = random.choice(addresses)
                tariff = random.choice(tariffs)
                
                # Create the connection request
                request = ConnectionRequest.objects.create(
                    customer=customer,
                    status=status,
                    address=address,
                    tariff=tariff,
                    notes=fake.paragraph() if random.random() > 0.5 else None
                )
                
                # Assign a technician
                if technicians:  # Always assign a technician for completed requests
                    technician = random.choice(technicians)
                    ConnectionRequestAssignment.objects.create(
                        connection_request=request,
                        employee=technician,
                        role='technician'
                    )
                count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error creating connection request: {str(e)}"))
        
        self.stdout.write(self.style.SUCCESS(f'Created {count} connection requests.'))

    def create_contracts_for_every_day(self, percentage_of_requests):
        """Create contracts for every single day in a period, using completed connection requests"""
        self.stdout.write(self.style.NOTICE('Creating contracts for every day in the next 90 days...'))
        
        # Get completed connection requests
        completed_status = Status.objects.get(status='Completed', context__context='ConnectionRequest')
        available_requests = list(ConnectionRequest.objects.filter(status=completed_status))
        
        if not available_requests:
            self.stdout.write(self.style.WARNING('No available connection requests to create contracts'))
            return
        
        equipment_items = list(Equipment.objects.filter(stock_quantity__gt=0))
        
        # Define date range - create contracts for the last 90 days
        end_date = now().date() + timedelta(days=90)
        start_date =  now().date() - timedelta(days=1)
        
        count = 0
        current_date = start_date
        
        # Create contracts for each day in the range
        while current_date <= end_date:
            # Ensure at least 3 contracts per day
            num_contracts_for_day = random.randint(3, 5)
            
            contracts_created_today = 0
            max_attempts = 10  # Limit attempts to prevent infinite loop
            attempts = 0
            
            while contracts_created_today < num_contracts_for_day and attempts < max_attempts:
                attempts += 1
                
                if not available_requests:
                    # Create more requests if we run out
                    self.create_more_requests(10)
                    available_requests = list(ConnectionRequest.objects.filter(status=completed_status))
                    if not available_requests:
                        self.stdout.write(self.style.WARNING('Cannot create more requests - breaking contract creation'))
                        break
                
                # Select a random request for this contract
                request = random.choice(available_requests)
                available_requests.remove(request)  # Don't reuse the same request
                
                try:
                    # Get a service from the tariff
                    tariff_services = list(request.tariff.services.all())
                    if not tariff_services:
                        continue
                    
                    service = random.choice(tariff_services)
                    
                    # Check if a contract already exists for this request
                    if Contract.objects.filter(connection_request_id=request.id).exists():
                        continue
                    
                    # Use transaction to ensure consistency
                    from django.db import transaction
                    
                    with transaction.atomic():
                        # Create contract with the current date
                        contract = Contract.objects.create(
                            customer=request.customer,
                            connection_request=request,
                            address=request.address,
                            service=service,
                            tariff=request.tariff,
                            start_date=current_date,  # Set start date to the current day in our loop
                            end_date=current_date + timedelta(days=365)  # Contract lasts for 1 year
                        )
                        
                        # Add equipment to contract
                        if equipment_items and random.random() > 0.3:
                            num_equipment = random.randint(1, min(2, len(equipment_items)))
                            selected_equipment = random.sample(equipment_items, num_equipment)
                            
                            for equip in selected_equipment:
                                if equip.stock_quantity > 0:
                                    ContractEquipment.objects.create(
                                        contract=contract,
                                        equipment=equip,
                                        is_active=True
                                    )
                                    # Reduce stock quantity
                                    equip.stock_quantity -= 1
                                    equip.save()
                        
                        contracts_created_today += 1
                        count += 1
                        
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error creating contract for date {current_date}: {str(e)}"))
            
            # Move to the next day
            current_date += timedelta(days=1)
        
        self.stdout.write(self.style.SUCCESS(f'Created {count} contracts spread across every day in the last 90 days.'))
        
    def create_more_requests(self, num_requests):
        """Create additional connection requests when we run out"""
        self.stdout.write(self.style.NOTICE(f'Creating {num_requests} additional connection requests...'))
        
        customers = list(Customer.objects.all())
        completed_status = Status.objects.get(status='Completed', context__context='ConnectionRequest')
        tariffs = list(Tariff.objects.filter(is_active=True))
        technicians = list(Employee.objects.filter(role__name='technician'))
        
        count = 0
        for _ in range(num_requests):
            try:
                if not customers:
                    self.stdout.write(self.style.WARNING('No customers available to create connection requests'))
                    break
                    
                customer = random.choice(customers)
                status = completed_status
                
                # Get a random address from this customer
                addresses = list(Address.objects.filter(customer=customer))
                if not addresses:
                    continue
                
                address = random.choice(addresses)
                tariff = random.choice(tariffs)
                
                # Create the connection request
                request = ConnectionRequest.objects.create(
                    customer=customer,
                    status=status,
                    address=address,
                    tariff=tariff,
                    notes=fake.paragraph() if random.random() > 0.5 else None
                )
                
                # Always assign a technician for completed requests
                if technicians:
                    technician = random.choice(technicians)
                    ConnectionRequestAssignment.objects.create(
                        connection_request=request,
                        employee=technician,
                        role='technician'
                    )
                count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error creating additional connection request: {str(e)}"))
        
        self.stdout.write(self.style.SUCCESS(f'Created {count} additional connection requests.'))
       
    def create_support_tickets(self, num_tickets):
        """Create support tickets"""
        self.stdout.write(self.style.NOTICE(f'Creating {num_tickets} support tickets...'))
        
        fake = Faker('uk_UA')
        customers = list(Customer.objects.filter(user__is_active=True))
        statuses = list(Status.objects.filter(context__context='SupportTicket'))
        support_staff = list(Employee.objects.filter(role__name='Support'))
        
        subjects = [
            "Internet connection issue", "Billing question", "Service upgrade request",
            "Technical problem", "Equipment malfunction", "Speed issues",
            "Installation question", "Account access problem", "Package change request"
        ]
        
        count = 0
        for _ in range(num_tickets):
            try:
                customer = random.choice(customers)
                status = random.choice(statuses)
                subject = random.choice(subjects)
                
                ticket = SupportTicket.objects.create(
                    customer=customer,
                    subject=subject,
                    description=fake.paragraph(nb_sentences=3),
                    status=status
                )
                
                # Assign support staff for tickets that aren't new
                if status.status != 'New' and support_staff and random.random() > 0.2:
                    ticket.assigned_to = random.choice(support_staff)
                    ticket.save()
                count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error creating support ticket: {str(e)}"))
        
        self.stdout.write(self.style.SUCCESS(f'Created {count} support tickets.'))

    def create_payments_and_invoices(self):
        """Create payments and invoices for all contracts with a fixed amount"""
        self.stdout.write(self.style.NOTICE('Creating payments and invoices with fixed amount...'))
        
        contracts = Contract.objects.filter(end_date__gt=now())
        payment_methods = list(PaymentMethod.objects.all())
        
        invoice_count = 0
        payment_count = 0
        
        for contract in contracts:
            # Create 1-3 past invoices per contract
            for i in range(random.randint(1, 3)):
                issue_date = contract.start_date + timedelta(days=30 * i)
                due_date = issue_date + timedelta(days=14)
                
                status = 'paid'
                if random.random() < 0.1:  # 10% chance to be overdue
                    status = 'overdue'
                elif random.random() < 0.2:  # 20% chance to be pending
                    status = 'pending'
                
                # Use the fixed amount instead of tariff price
                amount = self.fixed_amount
                
                try:
                    invoice = Invoice.objects.create(
                        contract=contract,
                        amount=amount,
                        due_date=due_date,
                        description=f"Monthly fee for {contract.tariff.name}",
                        status=status
                    )
                    invoice_count += 1
                    
                    # Create payment for paid invoices
                    if status == 'paid':
                        payment_date = issue_date + timedelta(days=random.randint(1, 10))
                        
                        Payment.objects.create(
                            customer=contract.customer,
                            amount=amount,  # Use the same fixed amount
                            payment_date=payment_date,
                            method=random.choice(payment_methods)
                        )
                        payment_count += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error creating invoice for contract {contract.id}: {str(e)}"))
        
        self.stdout.write(self.style.SUCCESS(f'Created {invoice_count} invoices and {payment_count} payments with fixed amount of {self.fixed_amount}.'))

    def create_network_usage(self):
        """Create network usage data for all contracts"""
        self.stdout.write(self.style.NOTICE('Creating network usage data...'))
        
        contracts = Contract.objects.filter(end_date__gt=now())
        usage_records = 0
        
        for contract in contracts:
            start_date = max(contract.start_date.date(), (now() - timedelta(days=30)).date())
            end_date = now().date()
            
            current_date = start_date
            while current_date <= end_date:
                # Generate random usage data
                download = Decimal(str(random.uniform(0.5, 10.0))).quantize(Decimal('0.01'))
                upload = Decimal(str(random.uniform(0.2, 3.0))).quantize(Decimal('0.01'))
                
                try:
                    _, created = NetworkUsage.objects.get_or_create(
                        contract=contract,
                        date=current_date,
                        defaults={
                            'download_gb': download,
                            'upload_gb': upload
                        }
                    )
                    if created:
                        usage_records += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error creating network usage for contract {contract.id}: {str(e)}"))
                
                current_date += timedelta(days=1)
        
        self.stdout.write(self.style.SUCCESS(f'Created {usage_records} network usage records.'))