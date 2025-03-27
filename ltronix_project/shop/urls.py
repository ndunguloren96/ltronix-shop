from django.urls import path
from .views import ProductListView, product_list
from django.http import HttpResponse


def product_detail(request, pk):
    return HttpResponse(f"Product Detail for ID {pk}")


urlpatterns = [
    path("", ProductListView.as_view(), name="product_list"),
    path("products/", product_list, name="product_list"),
    path("<int:pk>/", product_detail, name="product_detail"),
    path("shop/", ProductListView.as_view(), name="shop"),
]
