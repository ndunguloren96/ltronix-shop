# ecommerce/sellers/api_urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import SellerProductViewSet

# --- Router Configuration ---
# This section configures the router for the sellers API.
# It registers the SellerProductViewSet.
router = DefaultRouter()
router.register(r'products', SellerProductViewSet, basename='seller-products')

# --- URL Patterns ---
# This list contains all the URL patterns for the sellers API.
urlpatterns = [
    path('', include(router.urls)),
]