from rest_framework import status, viewsets, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework_simplejwt.views import TokenObtainPairView
from django_ratelimit.decorators import ratelimit
from ..serializers import UserRegisterSerializer, UserSerializer
from ..models import User
from ..utils.permissions import IsManager
from ..utils.mixins import StandardResponseMixin

class UserRegistrationView(StandardResponseMixin, APIView):
    permission_classes = [AllowAny]
    
    @ratelimit(key='ip', rate='3/10m', method='POST', block=True)
    def post(self, request):
        user_serializer = UserRegisterSerializer(data=request.data)
        if user_serializer.is_valid():
            user = user_serializer.save()
            return Response({
                'status': 'success',
                'message': 'User registered successfully',
                'user_id': user.id
            }, status=status.HTTP_201_CREATED)
        return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from rest_framework.throttling import AnonRateThrottle

class LoginRateThrottle(AnonRateThrottle):
    scope = 'anon_login'

class UserLoginView(StandardResponseMixin, TokenObtainPairView):
    throttle_classes = [LoginRateThrottle]
    
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

class CurrentUserView(StandardResponseMixin, APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        data = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_employee': hasattr(user, 'employee_profile'),
            'is_customer': hasattr(user, 'customer_profile'),
        }
        
        if hasattr(user, 'employee_profile'):
            data['employee'] = {
                'id': user.employee_profile.id,
                'role': user.employee_profile.role.name
            }
        
        if hasattr(user, 'customer_profile'):
            data['customer'] = {
                'id': user.customer_profile.id,
                'status': user.customer_profile.status.status,
                'balance': float(user.customer_profile.balance)
            }
        
        return Response(data)

class UserViewSet(StandardResponseMixin, viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['first_name', 'last_name', 'email']
    
    def get_permissions(self):
        if self.action in ['retrieve']:
            return [IsAuthenticated()]
        return [IsManager()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if hasattr(user, 'employee_profile'):
            if user.employee_profile.role.name.lower() == 'manager':
                return queryset
        
        return queryset.filter(id=user.id)
    
    @action(detail=True, methods=['post'], permission_classes=[IsManager])
    def assign_role(self, request, pk=None):
        user = self.get_object()
        role_id = request.data.get('role_id')
        
        if not role_id:
            return Response({'error': 'Role ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            from ..models import EmployeeRole, Employee
            role = EmployeeRole.objects.get(id=role_id)
            
            if hasattr(user, 'employee_profile'):
                user.employee_profile.role = role
                user.employee_profile.save()
            else:
                Employee.objects.create(user=user, role=role)
                
            return Response({'status': 'Role assigned successfully'})
        except EmployeeRole.DoesNotExist:
            return Response({'error': 'Role not found'}, status=status.HTTP_404_NOT_FOUND)
