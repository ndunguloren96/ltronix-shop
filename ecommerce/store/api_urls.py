# ecommerce/store/api_urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import ProductViewSet, OrderViewSet # Ensure OrderViewSet is imported

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
# CRITICAL: Ensure OrderViewSet is registered. This sets up /orders/ and /order-items/
router.register(r'orders', OrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),
]
