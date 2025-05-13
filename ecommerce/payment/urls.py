# payment/urls.py
from django.urls import path, include
from . import views
from .views import STKPushView

urlpatterns = [
    # Define your payment app's URLs here
    path('payments/', include('payments.urls')),
    path('stk-push/', STKPushView.as_view(), name='stk_push'),
]