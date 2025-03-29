from django.urls import path
from .views import ProductListView, product_list, product_detail

app_name = 'shop'  # Define the namespace for the shop app

urlpatterns = [
    path("", ProductListView.as_view(), name="product_list"),
    path("products/", product_list, name="product_list"),
    path("<int:pk>/", product_detail, name="product_detail"),
    path("shop/", ProductListView.as_view(), name="shop"),
]
