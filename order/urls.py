from django.urls import path
from . import views

urlpatterns = [
    path("orders/", views.OrderListCreateView.as_view(), name="order-list-create"),
    path("orders/<int:pk>/", views.OrderDetailView.as_view(), name="order-detail"),
    path("orders/<int:pk>/status/", views.OrderStatusUpdateView.as_view(), name="order-status-update"),
]
