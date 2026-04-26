from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import Notification
from ..serializers import NotificationSerializer
from ..utils.pagination import StandardResultsSetPagination
from ..utils.mixins import StandardResponseMixin

class NotificationViewSet(StandardResponseMixin, 
                          mixins.ListModelMixin,
                          mixins.RetrieveModelMixin,
                          viewsets.GenericViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        # Users can only see their own notifications
        return self.queryset.filter(customer__user=self.request.user)

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({"status": "notification marked as read"})
