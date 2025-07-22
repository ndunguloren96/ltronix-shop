# payment/urls.py
from django.urls import path

from . import views

urlpatterns = [
    # Define your payment app's URLs here
    path("stk-push/", views.STKPushView.as_view(), name="stk_push"),
    path(
        "mpesa/stk_push_callback/", views.mpesa_stk_push_callback, name="mpesa_callback"
    ),
    path("status/", views.payment_status, name="payment_status"),
]
