# ecommerce/store/api_urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import api_views

router = DefaultRouter()
router.register(r'products', api_views.ProductViewSet, basename='product')
router.register(r'carts', api_views.CartViewSet, basename='cart')

urlpatterns = [
    path('', include(router.urls)),
    # --- NEW PATH FOR /api/v1/orders/ ---
    path('orders/', api_views.OrderItemCreateAPIView.as_view(), name='api-add-to-cart'),
]
