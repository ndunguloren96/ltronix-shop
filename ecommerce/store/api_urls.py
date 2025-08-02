# ecommerce/store/api_urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import api_views

router = DefaultRouter()
router.register(r'products', api_views.ProductViewSet, basename='product')
# Re-register OrderViewSet to handle /orders/
router.register(r'orders', api_views.OrderViewSet, basename='order')
# Keep carts if other parts of frontend use it, otherwise remove.
router.register(r'carts', api_views.CartViewSet, basename='cart')


urlpatterns = [
    path('', include(router.urls)),
    # This line is now redundant if OrderViewSet handles 'my_cart'
    # path('orders/my_cart/', api_views.OrderViewSet.as_view({'get': 'my_cart'}), name='my-cart'),
]
