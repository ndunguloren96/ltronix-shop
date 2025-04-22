from django.urls import path
from . import views

urlpatterns = [
    path('', views.CheckoutView.as_view(), name='checkout'),
    path('place-order/', views.PlaceOrderView.as_view(), name='place_order'),
    path('confirm-payment/', views.ConfirmPaymentView.as_view(), name='confirm_payment'),
]
