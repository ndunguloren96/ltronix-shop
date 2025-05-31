from django.urls import path
from .api_views import MpesaStkPushAPIView

urlpatterns = [
    path('stk-push/', MpesaStkPushAPIView.as_view(), name='api_stk_push'),
]
