import csv
import io
import logging
from django.db import transaction
from django.contrib.auth import get_user_model

User = get_user_model()
logger = logging.getLogger(__name__)

class CSVService:
    @staticmethod
    def export_customers(customers):
        buffer = io.StringIO()
        buffer.write('\ufeff') # BOM for Excel
        writer = csv.writer(buffer)
        writer.writerow(['id', 'first_name', 'last_name', 'email', 'phone_number', 'status', 'balance'])
        
        for customer in customers:
            writer.writerow([
                customer.id, customer.user.first_name, customer.user.last_name,
                customer.user.email, customer.phone_number, 
                customer.status.status if customer.status else 'Unknown', 
                customer.balance
            ])
        return buffer.getvalue()

    @staticmethod
    def export_employees(employees):
        buffer = io.StringIO()
        buffer.write('\ufeff') # BOM for Excel
        writer = csv.writer(buffer)
        writer.writerow(['id', 'first_name', 'last_name', 'email', 'role', 'is_available'])
        
        for emp in employees:
            writer.writerow([
                emp.id, emp.user.first_name, emp.user.last_name,
                emp.user.email, emp.role.name, emp.is_available
            ])
        return buffer.getvalue()

    @staticmethod
    def import_customers(csv_file):
        decoded_file = csv_file.read().decode('utf-8')
        csv_data = csv.DictReader(io.StringIO(decoded_file))
        created_count = 0
        errors = []
        
        from api.models import Status, StatusContext
        customer_status = Status.objects.get(status='Active', context__context='Customer')

        for row_num, row in enumerate(csv_data, start=2):
            try:
                with transaction.atomic():
                    user = User.objects.create_user(
                        email=row['email'],
                        first_name=row['first_name'],
                        last_name=row['last_name'],
                        password=row.get('password', 'password123')
                    )
                    
                    from api.models import Customer
                    Customer.objects.create(
                        user=user,
                        status=customer_status,
                        phone_number=row['phone_number'],
                        balance=row.get('balance', 0)
                    )
                    created_count += 1
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
        
        return created_count, errors

    @staticmethod
    def import_employees(csv_file):
        decoded_file = csv_file.read().decode('utf-8')
        csv_data = csv.DictReader(io.StringIO(decoded_file))
        created_count = 0
        errors = []
        
        from api.models import Employee, EmployeeRole
        
        for row_num, row in enumerate(csv_data, start=2):
            try:
                with transaction.atomic():
                    user = User.objects.create_user(
                        email=row['email'],
                        first_name=row['first_name'],
                        last_name=row['last_name'],
                        password=row.get('password', 'password123')
                    )
                    
                    role, _ = EmployeeRole.objects.get_or_create(name=row['role'])
                    Employee.objects.create(
                        user=user,
                        role=role,
                        is_available=row.get('is_available', 'True').lower() == 'true'
                    )
                    created_count += 1
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
        
        return created_count, errors
