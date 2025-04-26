from django.core.management.base import BaseCommand
from django.utils.timezone import now
from api.models import Contract, NetworkUsage
import random
from decimal import Decimal


class Command(BaseCommand):
    help = 'Generate random network usage data for all active contracts'

    def add_arguments(self, parser):
        # Optional date argument (defaults to today)
        parser.add_argument(
            '--date',
            type=str,
            help='Date for which to generate usage data (YYYY-MM-DD). Defaults to today.'
        )
        
        # Optional range arguments
        parser.add_argument(
            '--min-gb',
            type=float,
            default=0.0,
            help='Minimum GB of usage to generate (default: 0.0)'
        )
        
        parser.add_argument(
            '--max-gb',
            type=float,
            default=10.0,
            help='Maximum GB of usage to generate (default: 10.0)'
        )

    def handle(self, *args, **options):
        # Get the date for network usage (today by default)
        usage_date = now().date()
        if options['date']:
            try:
                from datetime import datetime
                usage_date = datetime.strptime(options['date'], '%Y-%m-%d').date()
            except ValueError:
                self.stderr.write(self.style.ERROR('Invalid date format. Use YYYY-MM-DD'))
                return

        # Get min and max values for usage generation
        min_gb = options['min_gb']
        max_gb = options['max_gb']
        
        # Get all active contracts
        active_contracts = Contract.objects.filter(
            end_date__gt=now()
        ).select_related('customer', 'customer__user')
        
        if not active_contracts:
            self.stdout.write(self.style.WARNING('No active contracts found.'))
            return
        
        # Counter for statistics
        created_count = 0
        updated_count = 0
        
        # Generate or update network usage for each active contract
        for contract in active_contracts:
            # Generate random values for download and upload (with 2 decimal places)
            download_gb = Decimal(str(round(random.uniform(min_gb, max_gb), 2)))
            upload_gb = Decimal(str(round(random.uniform(min_gb, max_gb), 2)))
            
            # Create or update the NetworkUsage record
            usage, created = NetworkUsage.objects.update_or_create(
                contract=contract,
                date=usage_date,
                defaults={
                    'download_gb': download_gb,
                    'upload_gb': upload_gb
                }
            )
            
            if created:
                created_count += 1
            else:
                updated_count += 1
        
        # Output results
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully generated network usage for {created_count + updated_count} contracts '
                f'({created_count} new, {updated_count} updated) for {usage_date}'
            )
        )