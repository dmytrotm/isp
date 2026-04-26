from rest_framework.response import Response

class StandardResponseMixin:
    """
    Mixin for ViewSets to wrap responses in standard format:
    { "data": <payload>, "error": null }
    """
    def finalize_response(self, request, response, *args, **kwargs):
        if hasattr(response, 'data') and not self._is_already_wrapped(response.data):
            if response.status_code < 400:
                response.data = {
                    'data': response.data,
                    'error': None
                }
        return super().finalize_response(request, response, *args, **kwargs)
    
    def _is_already_wrapped(self, data):
        return (
            isinstance(data, dict) and 
            'data' in data and 
            'error' in data
        )
