from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from debug_toolbar.toolbar import debug_toolbar_urls

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'customers', views.CustomerViewSet)
router.register(r'addresses', views.AddressViewSet)
router.register(r'regions', views.RegionViewSet)
router.register(r'services', views.ServiceViewSet)
router.register(r'tariffs', views.TariffViewSet)
router.register(r'connection-requests', views.ConnectionRequestViewSet)
router.register(r'contracts', views.ContractViewSet)
router.register(r'payments', views.PaymentViewSet)
router.register(r'invoices', views.InvoiceViewSet)
router.register(r'support-tickets', views.SupportTicketViewSet)

# Register the new viewsets
router.register(r'employees', views.EmployeeViewSet)
router.register(r'employee-roles', views.EmployeeRoleViewSet)
router.register(r'statuses', views.StatusViewSet)
router.register(r'payment-methods', views.PaymentMethodViewSet)
router.register(r'equipment', views.EquipmentViewSet)
router.register(r'equipment-categories', views.EquipmentCategoryViewSet)
router.register(r'network-usage', views.NetworkUsageViewSet)
router.register(r'users', views.UserViewSet)

router.register(r'admin-dashboard', views.AdminViewSet, basename='admin-dashboard')

urlpatterns = [
    # Authentication views
    path('auth/register/', views.UserRegistrationView.as_view(), name='user-registration'),
    path('auth/user/', views.CurrentUserView.as_view(), name='current-user'),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    
    # Include the router URLs
    path('', include(router.urls)),
    
    # Include login URLs for the browsable API
    path('auth/', include('rest_framework.urls', namespace='rest_framework')),
]  + debug_toolbar_urls()