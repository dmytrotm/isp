from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """
    Standardizes API error responses.
    """


    response = exception_handler(exc, context)
    
    if response is not None:
        return Response({
            'error': {
                'status_code': response.status_code,
                'message': _extract_message(response.data),
                'type': exc.__class__.__name__
            },
            'data': None
        }, status=response.status_code)
    
    # Unhandled exception — log it, return 500
    logger.exception(f"Unhandled exception in {context.get('view')}: {exc}")
    return Response({
        'error': {
            'status_code': 500,
            'message': 'Internal server error',
            'type': 'InternalServerError'
        },
        'data': None
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def _extract_message(data):
    if isinstance(data, list) and len(data) > 0:
        return str(data[0])
    if isinstance(data, dict):
        for key in ['detail', 'message', 'non_field_errors']:
            if key in data:
                return str(data[key])
        try:
            first_key = next(iter(data))
            val = data[first_key]
            return f"{first_key}: {val[0] if isinstance(val, list) else val}"
        except StopIteration:
            return str(data)
    return str(data)
