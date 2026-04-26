from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import auth, customer, employee, billing, support, infrastructure, contract, recommendations, notifications, dashboard

# Create a router and register our viewsets
router = DefaultRouter()

# Auth & Users
router.register(r'users', auth.UserViewSet)

# Customers
router.register(r'customers', customer.CustomerViewSet)
router.register(r'addresses', customer.AddressViewSet)
router.register(r'regions', customer.RegionViewSet)

# Employees
router.register(r'employees', employee.EmployeeViewSet)
router.register(r'employee-roles', employee.EmployeeRoleViewSet)

# Billing
router.register(r'services', billing.ServiceViewSet)
router.register(r'tariffs', billing.TariffViewSet)
router.register(r'payments', billing.PaymentViewSet)
router.register(r'invoices', billing.InvoiceViewSet)
router.register(r'payment-methods', billing.PaymentMethodViewSet)

# Support
router.register(r'support-tickets', support.SupportTicketViewSet)
router.register(r'connection-requests', support.ConnectionRequestViewSet)

# Infrastructure
router.register(r'equipment', infrastructure.EquipmentViewSet)
router.register(r'equipment-categories', infrastructure.EquipmentCategoryViewSet)
router.register(r'network-usage', infrastructure.NetworkUsageViewSet)
router.register(r'statuses', infrastructure.StatusViewSet)

# Contracts
router.register(r'contracts', contract.ContractViewSet)

# Automation
router.register(r'recommendations', recommendations.TariffRecommendationViewSet)
router.register(r'notifications', notifications.NotificationViewSet)

urlpatterns = [
    # Authentication views
    path('auth/register/', auth.UserRegistrationView.as_view(), name='user-registration'),
    path('auth/user/', auth.CurrentUserView.as_view(), name='current-user'),
    path('auth/token/', auth.UserLoginView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Include the router URLs
    path('', include(router.urls)),
    
    # Dashboard
    path('dashboard/manager/', dashboard.ManagerDashboardView.as_view(), name='manager-dashboard'),
    
    # Include login URLs for the browsable API
    path('auth/', include('rest_framework.urls', namespace='rest_framework')),
]