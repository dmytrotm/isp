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
    def import_customers(csv_file):
        decoded_file = csv_file.read().decode('utf-8')
        csv_data = csv.DictReader(io.StringIO(decoded_file))
        created_count = 0
        errors = []
        
        for row_num, row in enumerate(csv_data, start=2):
            try:
                with transaction.atomic():
                    user = User.objects.create_user(
                        email=row['email'],
                        first_name=row['first_name'],
                        last_name=row['last_name'],
                        password=row.get('password', 'password123')
                    )
                    # Status and profile creation logic here...
                    created_count += 1
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
        
        return created_count, errors
