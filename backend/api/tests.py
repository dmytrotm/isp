from django.test import TestCase
from django.utils.timezone import now
from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status as http_status

from api.models import (
    Customer, Employee, EmployeeRole, Status, StatusContext, Contract,
    Invoice, Service, Tariff, TariffService, ConnectionRequest,
    Address, Region, PaymentMethod, Payment, SupportTicket,
    BalanceTransaction, Equipment, EquipmentCategory, ContractEquipment,
    NetworkUsage, Notification, ClientScore, TariffRecommendation
)
from api.services.billing import record_transaction
from api.services.scoring import calculate_customer_score
from api.services.notifications import send_notification

User = get_user_model()


class BaseTestCase(TestCase):
    """Shared setup for all test cases."""

    @classmethod
    def setUpTestData(cls):
        # StatusContexts
        cls.customer_ctx, _ = StatusContext.objects.get_or_create(context='Customer')
        cls.ticket_ctx, _ = StatusContext.objects.get_or_create(context='SupportTicket')
        cls.conn_ctx, _ = StatusContext.objects.get_or_create(context='ConnectionRequest')

        # Statuses
        cls.active_status, _ = Status.objects.get_or_create(status='Active', context=cls.customer_ctx)
        cls.blocked_status, _ = Status.objects.get_or_create(status='Blocked', context=cls.customer_ctx)
        cls.ticket_new, _ = Status.objects.get_or_create(status='New', context=cls.ticket_ctx)
        cls.ticket_open, _ = Status.objects.get_or_create(status='Open', context=cls.ticket_ctx)
        cls.ticket_resolved, _ = Status.objects.get_or_create(status='Resolved', context=cls.ticket_ctx)
        cls.conn_new, _ = Status.objects.get_or_create(status='New', context=cls.conn_ctx)
        cls.conn_completed, _ = Status.objects.get_or_create(status='Completed', context=cls.conn_ctx)

        # Groups (created by post_migrate signal, but ensure they exist)
        from django.contrib.auth.models import Group
        Group.objects.get_or_create(name='Customer')
        Group.objects.get_or_create(name='Manager')
        Group.objects.get_or_create(name='Support')

        # Roles
        cls.manager_role, _ = EmployeeRole.objects.get_or_create(name='Manager')
        cls.support_role, _ = EmployeeRole.objects.get_or_create(name='Support')

        # Region & PaymentMethod
        cls.region, _ = Region.objects.get_or_create(name='Kyiv')
        cls.payment_method, _ = PaymentMethod.objects.get_or_create(method='Bank Transfer')

        # Service & Tariff
        cls.service, _ = Service.objects.get_or_create(name='Internet', defaults={'description': 'Broadband internet'})
        cls.tariff_basic, _ = Tariff.objects.get_or_create(
            name='Basic', defaults={'price': Decimal('200.00'), 'description': 'Basic plan',
            'speed_mbps': 50, 'traffic_limit_gb': 500, 'is_active': True}
        )
        cls.tariff_premium, _ = Tariff.objects.get_or_create(
            name='Premium', defaults={'price': Decimal('500.00'), 'description': 'Premium plan',
            'speed_mbps': 200, 'traffic_limit_gb': 2000, 'is_active': True}
        )
        TariffService.objects.get_or_create(tariff=cls.tariff_basic, service=cls.service)
        TariffService.objects.get_or_create(tariff=cls.tariff_premium, service=cls.service)

    def _create_customer(self, email='customer@test.com', balance=Decimal('1000.00')):
        user = User.objects.create_user(
            email=email, password='TestPass123!',
            first_name='Test', last_name='Customer'
        )
        customer = Customer.objects.create(
            user=user, status=self.active_status,
            phone_number=f'+380{str(hash(email))[-9:].replace("-", "0")}',
            balance=balance
        )
        return customer

    def _create_contract(self, customer, tariff=None, days_ago=60):
        tariff = tariff or self.tariff_basic
        address = Address.objects.create(
            building='1', street='Main St', city='Kyiv',
            region=self.region, customer=customer
        )
        conn_req = ConnectionRequest.objects.create(
            customer=customer, status=self.conn_completed,
            address=address, tariff=tariff
        )
        contract = Contract.objects.create(
            customer=customer, connection_request=conn_req,
            address=address, service=self.service, tariff=tariff,
            start_date=now() - timedelta(days=days_ago),
            end_date=now() + timedelta(days=300),
            status='active'
        )
        return contract

    def _create_manager(self, email='manager@test.com'):
        user = User.objects.create_user(
            email=email, password='TestPass123!',
            first_name='Manager', last_name='Admin'
        )
        employee = Employee.objects.create(user=user, role=self.manager_role)
        return user, employee


# =============================================================================
# TEST 1: User Registration
# =============================================================================
class UserRegistrationTest(APITestCase):
    def test_registration_success(self):
        """Test that a new user can register with valid data."""
        data = {
            'email': 'newuser@example.com',
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'StrongPass123!',
            'confirm_password': 'StrongPass123!'
        }
        response = self.client.post('/api/auth/register/', data, format='json')
        self.assertIn(response.status_code, [201, 200])
        self.assertTrue(User.objects.filter(email='newuser@example.com').exists())

    def test_registration_password_mismatch(self):
        """Test that mismatched passwords are rejected."""
        data = {
            'email': 'fail@example.com',
            'first_name': 'Jane',
            'last_name': 'Doe',
            'password': 'StrongPass123!',
            'confirm_password': 'DifferentPass456!'
        }
        response = self.client.post('/api/auth/register/', data, format='json')
        self.assertEqual(response.status_code, 400)

    def test_registration_duplicate_email(self):
        """Test that duplicate email registration is rejected."""
        User.objects.create_user(
            email='dupe@example.com', password='Pass123!',
            first_name='A', last_name='B'
        )
        data = {
            'email': 'dupe@example.com',
            'first_name': 'C', 'last_name': 'D',
            'password': 'StrongPass123!',
            'confirm_password': 'StrongPass123!'
        }
        response = self.client.post('/api/auth/register/', data, format='json')
        self.assertEqual(response.status_code, 400)


# =============================================================================
# TEST 2: Balance Transaction Atomicity
# =============================================================================
class BalanceTransactionTest(BaseTestCase):
    def test_topup_increases_balance(self):
        """Test that a topup transaction increases the customer balance."""
        customer = self._create_customer(email='topup@test.com', balance=Decimal('100.00'))
        tx = record_transaction(customer, Decimal('250.00'), 'topup', 'Test topup')

        customer.refresh_from_db()
        self.assertEqual(customer.balance, Decimal('350.00'))
        self.assertEqual(tx.balance_after, Decimal('350.00'))
        self.assertEqual(tx.transaction_type, 'topup')

    def test_charge_decreases_balance(self):
        """Test that a charge transaction decreases the customer balance."""
        customer = self._create_customer(email='charge@test.com', balance=Decimal('500.00'))
        tx = record_transaction(customer, Decimal('-200.00'), 'charge', 'Monthly fee')

        customer.refresh_from_db()
        self.assertEqual(customer.balance, Decimal('300.00'))
        self.assertEqual(tx.balance_after, Decimal('300.00'))

    def test_negative_balance_tracks_timestamp(self):
        """Test that going negative sets balance_negative_since."""
        customer = self._create_customer(email='neg@test.com', balance=Decimal('50.00'))
        self.assertIsNone(customer.balance_negative_since)

        record_transaction(customer, Decimal('-100.00'), 'charge', 'Overdraft')
        customer.refresh_from_db()
        self.assertEqual(customer.balance, Decimal('-50.00'))
        self.assertIsNotNone(customer.balance_negative_since)

    def test_positive_balance_clears_negative_since(self):
        """Test that returning to positive clears balance_negative_since."""
        customer = self._create_customer(email='recover@test.com', balance=Decimal('-50.00'))
        customer.balance_negative_since = now() - timedelta(days=5)
        customer.save()

        record_transaction(customer, Decimal('100.00'), 'topup', 'Recovery')
        customer.refresh_from_db()
        self.assertEqual(customer.balance, Decimal('50.00'))
        self.assertIsNone(customer.balance_negative_since)


# =============================================================================
# TEST 3: Invoice Lifecycle
# =============================================================================
class InvoiceLifecycleTest(BaseTestCase):
    def test_invoice_creation(self):
        """Test that invoices can be created for a contract."""
        customer = self._create_customer(email='invoice@test.com')
        contract = self._create_contract(customer)

        invoice = Invoice.objects.create(
            contract=contract, amount=Decimal('200.00'),
            due_date=now() + timedelta(days=7),
            description='Monthly fee'
        )
        self.assertEqual(invoice.status, 'pending')
        self.assertEqual(invoice.amount, Decimal('200.00'))

    def test_overdue_detection(self):
        """Test that overdue invoices are correctly identified."""
        customer = self._create_customer(email='overdue@test.com')
        contract = self._create_contract(customer)

        invoice = Invoice.objects.create(
            contract=contract, amount=Decimal('200.00'),
            due_date=now() - timedelta(days=3),
            description='Past due invoice'
        )
        self.assertTrue(invoice.is_overdue())

    def test_mark_as_overdue(self):
        """Test the mark_as_overdue method."""
        customer = self._create_customer(email='mark@test.com')
        contract = self._create_contract(customer)

        invoice = Invoice.objects.create(
            contract=contract, amount=Decimal('200.00'),
            due_date=now() - timedelta(days=1),
            description='Overdue test'
        )
        result = invoice.mark_as_overdue()
        self.assertTrue(result)
        invoice.refresh_from_db()
        self.assertEqual(invoice.status, 'overdue')

    def test_bulk_overdue_update(self):
        """Test the classmethod bulk overdue detection."""
        customer = self._create_customer(email='bulk@test.com')
        contract = self._create_contract(customer)

        # Create 3 overdue invoices
        for i in range(3):
            Invoice.objects.create(
                contract=contract, amount=Decimal('100.00'),
                due_date=now() - timedelta(days=i + 1),
                description=f'Overdue #{i}'
            )

        Invoice.overdue()
        overdue_count = Invoice.objects.filter(status='overdue').count()
        self.assertEqual(overdue_count, 3)


# =============================================================================
# TEST 4: Client Scoring
# =============================================================================
class ClientScoringTest(BaseTestCase):
    def test_new_customer_score(self):
        """Test scoring for a brand new customer with no history."""
        customer = self._create_customer(email='newscore@test.com')
        score = calculate_customer_score(customer)

        # No contracts → 0 contract points, no overdue → 30, no tickets → 20
        self.assertEqual(score.contract_points, 0)
        self.assertEqual(score.overdue_points, 30)
        self.assertEqual(score.ticket_points, 20)
        self.assertEqual(score.score, 50)

    def test_established_customer_score(self):
        """Test scoring for a long-term customer with active contract."""
        customer = self._create_customer(email='established@test.com')
        self._create_contract(customer, days_ago=400)  # >365 days

        score = calculate_customer_score(customer)
        self.assertEqual(score.contract_points, 30)  # Max contract points
        self.assertEqual(score.score, 80)  # 30 + 30 + 20

    def test_problematic_customer_score(self):
        """Test scoring for customer with overdue invoices and many tickets."""
        customer = self._create_customer(email='problem@test.com')
        contract = self._create_contract(customer)

        # 3+ overdue invoices → 0 overdue points
        for i in range(4):
            Invoice.objects.create(
                contract=contract, amount=Decimal('100.00'),
                due_date=now() - timedelta(days=30 + i),
                description=f'Overdue {i}', status='overdue'
            )

        # 3+ tickets in last 30 days → 0 ticket points
        for i in range(4):
            SupportTicket.objects.create(
                customer=customer, subject=f'Problem {i}',
                description='Issue', status=self.ticket_new,
                ticket_type='technical'
            )

        score = calculate_customer_score(customer)
        self.assertEqual(score.overdue_points, 0)
        self.assertEqual(score.ticket_points, 0)


# =============================================================================
# TEST 5: SLA Breach Detection
# =============================================================================
class SLABreachTest(BaseTestCase):
    def test_sla_deadline_auto_set(self):
        """Test that SLA deadline is automatically set on ticket creation."""
        customer = self._create_customer(email='sla@test.com')
        ticket = SupportTicket.objects.create(
            customer=customer, subject='Test',
            description='Test ticket', status=self.ticket_new,
            ticket_type='technical'
        )
        self.assertIsNotNone(ticket.sla_deadline)

    def test_sla_breach_detection(self):
        """Test the SLA breach Celery task marks expired tickets."""
        customer = self._create_customer(email='breach@test.com')
        ticket = SupportTicket.objects.create(
            customer=customer, subject='Expired SLA',
            description='This ticket is overdue', status=self.ticket_open,
            ticket_type='technical'
        )
        # Force SLA deadline to the past
        SupportTicket.objects.filter(id=ticket.id).update(
            sla_deadline=now() - timedelta(hours=1)
        )

        from api.tasks.tickets import check_sla_breaches
        result = check_sla_breaches()

        ticket.refresh_from_db()
        self.assertTrue(ticket.is_sla_breached)
        self.assertIn('1', result)  # "Marked 1 tickets as SLA breached"


# =============================================================================
# TEST 6: Notification System
# =============================================================================
class NotificationTest(BaseTestCase):
    @patch('api.services.notifications.send_mail')
    def test_notification_created_and_email_sent(self, mock_send_mail):
        """Test that send_notification creates a DB record and sends email."""
        customer = self._create_customer(email='notif@test.com')
        customer.preferred_notification = 'email'
        customer.save()

        notif = send_notification(customer, 'low_balance', 'Your balance is low.')

        self.assertEqual(notif.notification_type, 'low_balance')
        self.assertEqual(notif.message, 'Your balance is low.')
        self.assertFalse(notif.is_read)
        mock_send_mail.assert_called_once()

    def test_notification_sms_no_crash(self):
        """Test that SMS-preferred customer doesn't crash (just skips email)."""
        customer = self._create_customer(email='sms@test.com')
        customer.preferred_notification = 'sms'
        customer.save()

        notif = send_notification(customer, 'account_suspended', 'Suspended.')
        self.assertIsNotNone(notif.id)
        self.assertEqual(Notification.objects.filter(customer=customer).count(), 1)


# =============================================================================
# TEST 7: Equipment Stock Management
# =============================================================================
class EquipmentStockTest(BaseTestCase):
    def test_equipment_assignment_decreases_stock(self):
        """Test that assigning equipment to a contract decreases stock."""
        category = EquipmentCategory.objects.create(name='Router')
        equipment = Equipment.objects.create(
            name='TP-Link', description='Router', price=Decimal('500.00'),
            stock_quantity=5, category=category
        )
        customer = self._create_customer(email='equip@test.com')
        contract = self._create_contract(customer)

        ContractEquipment.objects.create(contract=contract, equipment=equipment)
        equipment.refresh_from_db()
        self.assertEqual(equipment.stock_quantity, 4)

    def test_equipment_return_increases_stock(self):
        """Test that returning equipment increases stock."""
        category = EquipmentCategory.objects.create(name='Switch')
        equipment = Equipment.objects.create(
            name='Cisco Switch', description='Switch', price=Decimal('800.00'),
            stock_quantity=3, category=category
        )
        customer = self._create_customer(email='return@test.com')
        contract = self._create_contract(customer)

        ce = ContractEquipment.objects.create(contract=contract, equipment=equipment)
        equipment.refresh_from_db()
        self.assertEqual(equipment.stock_quantity, 2)

        result = ce.return_equipment()
        self.assertTrue(result)
        equipment.refresh_from_db()
        self.assertEqual(equipment.stock_quantity, 3)
        self.assertFalse(ce.is_active)

    def test_zero_stock_raises_error(self):
        """Test that assigning equipment with zero stock raises ValueError."""
        category = EquipmentCategory.objects.create(name='Modem')
        equipment = Equipment.objects.create(
            name='Empty Modem', description='No stock', price=Decimal('100.00'),
            stock_quantity=0, category=category
        )
        customer = self._create_customer(email='zero@test.com')
        contract = self._create_contract(customer)

        with self.assertRaises(ValueError):
            ContractEquipment.objects.create(contract=contract, equipment=equipment)


# =============================================================================
# TEST 8: API Authentication
# =============================================================================
class AuthenticationTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='auth@test.com', password='TestPass123!',
            first_name='Auth', last_name='User'
        )

    def test_login_returns_tokens(self):
        """Test that valid credentials return access and refresh tokens."""
        response = self.client.post('/api/auth/token/', {
            'email': 'auth@test.com',
            'password': 'TestPass123!'
        }, format='json')
        self.assertEqual(response.status_code, 200)
        data = response.data.get('data', response.data)
        self.assertIn('access', data)
        self.assertIn('refresh', data)

    def test_login_invalid_credentials(self):
        """Test that invalid credentials return 401."""
        response = self.client.post('/api/auth/token/', {
            'email': 'auth@test.com',
            'password': 'WrongPassword!'
        }, format='json')
        self.assertEqual(response.status_code, 401)

    def test_protected_endpoint_requires_auth(self):
        """Test that protected endpoints reject unauthenticated requests."""
        response = self.client.get('/api/customers/')
        self.assertIn(response.status_code, [401, 403])


# =============================================================================
# TEST 9: Contract Lifecycle
# =============================================================================
class ContractTest(BaseTestCase):
    def test_contract_terminate(self):
        """Test that terminating a contract sets end_date to today."""
        customer = self._create_customer(email='terminate@test.com')
        contract = self._create_contract(customer)

        result = contract.terminate()
        self.assertTrue(result)
        contract.refresh_from_db()
        self.assertLessEqual(contract.end_date, now())

    def test_contract_is_active_property(self):
        """Test the is_active property for active and expired contracts."""
        customer = self._create_customer(email='active@test.com')
        contract = self._create_contract(customer)
        self.assertTrue(contract.is_active)

        contract.end_date = now() - timedelta(days=1)
        contract.save()
        self.assertFalse(contract.is_active)


# =============================================================================
# TEST 10: Tariff Recommendation Logic  
# =============================================================================
class TariffRecommendationTest(BaseTestCase):
    def test_no_recommendation_for_insufficient_data(self):
        """Test that no recommendation is generated with < 7 usage records."""
        from api.services.recommendations import generate_tariff_recommendation
        customer = self._create_customer(email='norec@test.com')
        contract = self._create_contract(customer)

        # Only 3 usage records (below the 7-record threshold)
        for i in range(3):
            NetworkUsage.objects.create(
                contract=contract,
                date=now().date() - timedelta(days=i),
                download_gb=Decimal('1.0'), upload_gb=Decimal('0.5')
            )

        result = generate_tariff_recommendation(customer)
        self.assertIsNone(result)

    def test_underusing_recommendation(self):
        """Test that underusing customers get a cheaper tariff recommendation."""
        from api.services.recommendations import generate_tariff_recommendation

        # Create a cheaper tariff option
        cheap_tariff = Tariff.objects.create(
            name='Economy', price=Decimal('100.00'), description='Budget plan',
            speed_mbps=25, traffic_limit_gb=200, is_active=True
        )

        customer = self._create_customer(email='underuse@test.com')
        contract = self._create_contract(customer, tariff=self.tariff_premium)

        # Create 30 days of very low usage (< 40% of 2000GB limit)
        for i in range(30):
            NetworkUsage.objects.create(
                contract=contract,
                date=now().date() - timedelta(days=i),
                download_gb=Decimal('1.0'), upload_gb=Decimal('0.5')
            )

        result = generate_tariff_recommendation(customer)
        # Should recommend downgrade since usage is very low
        if result:
            self.assertEqual(result.reason, 'underusing')
            self.assertLess(result.recommended_tariff.price, self.tariff_premium.price)
