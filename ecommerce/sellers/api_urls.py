# ecommerce/sellers/api_urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import SellerProductViewSet

router = DefaultRouter()
router.register(r'products', SellerProductViewSet, basename='seller-products')

urlpatterns = [
    path('', include(router.urls)),
]
