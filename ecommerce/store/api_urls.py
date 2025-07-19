# ecommerce/store/api_urls.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .api_views import ProductViewSet # Only import ProductViewSet now

router = DefaultRouter()
router.register(r"products", ProductViewSet, basename="product")

urlpatterns = [
    path("", include(router.urls)),  # products/ is now the only direct API endpoint registered
]
