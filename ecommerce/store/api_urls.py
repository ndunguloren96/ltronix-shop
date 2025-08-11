# ecommerce/store/api_urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import api_views

# --- Router Configuration ---
# This section configures the router for the store API.
# It registers the ProductViewSet, OrderViewSet, and CartViewSet.
router = DefaultRouter()
router.register(r'products', api_views.ProductViewSet, basename='product')
# Re-register OrderViewSet to handle /orders/
router.register(r'orders', api_views.OrderViewSet, basename='order')
# Keep carts if other parts of frontend use it, otherwise remove.
router.register(r'carts', api_views.CartViewSet, basename='cart')

# --- URL Patterns ---
# This list contains all the URL patterns for the store API.
urlpatterns = [
    path('', include(router.urls)),
]