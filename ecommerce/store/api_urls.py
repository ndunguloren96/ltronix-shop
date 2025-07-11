# ecommerce/store/api_urls.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .api_views import MyCartView, OrderViewSet, ProductViewSet

router = DefaultRouter()
router.register(r"products", ProductViewSet, basename="product")
router.register(r"orders", OrderViewSet, basename="order")

urlpatterns = [
    path("", include(router.urls)),  # products/ and orders/ now available directly at /api/v1/
    path("orders/my_cart/", MyCartView.as_view(), name="my-cart"),  # Custom view remains
]
