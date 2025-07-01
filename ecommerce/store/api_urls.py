# ecommerce/store/api_urls.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .api_views import (MyCartView, OrderViewSet,  # Import views directly
                        ProductViewSet)

router = DefaultRouter()
router.register(r"products", ProductViewSet, basename="product")
router.register(r"orders", OrderViewSet, basename="order")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "orders/my_cart/", MyCartView.as_view(), name="my-cart"
    ),  # Use MyCartView directly (not api_views.MyCartView)
]
