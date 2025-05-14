# payment/urls.py
from django.urls import path, include
from . import views
from .views import STKPushView

urlpatterns = [
    # Define your payment app's URLs here

    path('stk-push/', STKPushView.as_view(), name='stk_push'),
    path('mpesa/stk_push_callback/', views.mpesa_stk_push_callback, name='mpesa_callback'),
]