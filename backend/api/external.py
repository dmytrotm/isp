from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from .models import Customer, User
from .serializers import CustomerSerializer, UserSerializer
import os
import jsonschema
from django.conf import settings
import json

SCHEMA_PATH = os.path.join(settings.BASE_DIR, 'api', 'schemas', 'customer_schema.json')

with open(SCHEMA_PATH, 'r') as f:
    SCHEMA = json.load(f)

# Constants for authentication
API_KEY = "your-secret-api-key"
ADMIN_API_KEY = "admin-secret-api-key"  # Separate key for admin access

class ExternalCustomerView(APIView):
    def dispatch(self, request, *args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        
        # Check if any valid API key is provided
        if api_key not in [API_KEY, ADMIN_API_KEY]:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
            
        # Add an is_admin flag to the request object
        request.is_admin = (api_key == ADMIN_API_KEY)
        
        return super().dispatch(request, *args, **kwargs)
    
    def post(self, request):
        # Only allow admins to create customers
        if not request.is_admin:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            post_schema = SCHEMA['paths']['/api/customers/']['post']['requestBody']['content']['application/json']['schema']
            jsonschema.validate(instance=request.data, schema=post_schema)
        except jsonschema.exceptions.ValidationError as e:
            return Response({'error': f'Invalid data: {e.message}'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Extract user data from request
        user_data = {}
        if 'first_name' in request.data:
            user_data['first_name'] = request.data.pop('first_name')
        if 'last_name' in request.data:
            user_data['last_name'] = request.data.pop('last_name')
        if 'email' in request.data:
            user_data['email'] = request.data.pop('email')
        if 'password' in request.data:
            user_data['password'] = request.data.pop('password')
        
        try:
            with transaction.atomic():
                # Step 1: Create the user
                user_serializer = UserSerializer(data=user_data)
                if user_serializer.is_valid():
                    user = user_serializer.save()
                else:
                    return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
                # Step 2: Create the customer
                request.data['user'] = user.id
                customer_serializer = CustomerSerializer(data=request.data)
                if customer_serializer.is_valid():
                    customer = customer_serializer.save()
                    return Response({"status": "created", "customer_id": customer.id}, status=status.HTTP_201_CREATED)
                else:
                    # Force rollback by raising exception
                    raise ValueError(customer_serializer.errors)
        
        except ValueError as e:
            return Response(e.args[0], status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get(self, request, pk=None):
        if pk is None:
            # If admin, return list of all customers
            if request.is_admin:
                customers = Customer.objects.all()
                serializer = CustomerSerializer(customers, many=True)
                return Response(serializer.data)
            else:
                return Response({'error': 'Missing customer ID'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            customer = Customer.objects.get(pk=pk)
            
            # For customer self-access, check based on user token or API key
            # Since your Customer model doesn't have a token field, we need an alternative approach
            user_id = request.headers.get('X-User-ID')
            is_own_data = request.headers.get('X-API-Key') == API_KEY and str(customer.user.id) == user_id
            
            if not request.is_admin and not is_own_data:
                return Response({'error': 'Access forbidden'}, status=status.HTTP_403_FORBIDDEN)
                
            serializer = CustomerSerializer(customer)
            return Response(serializer.data)
            
        except Customer.DoesNotExist:
            return Response({'error': 'Customer not found'}, status=status.HTTP_404_NOT_FOUND)