# /var/www/Django-Ecommerce-Website/ecommerce/store/urls.py
from django.urls import path

from . import views  # This imports functions from store/views.py

urlpatterns = [
    # Leave as empty string for base url of the store
    path("", views.store, name="store"),
    path("cart/", views.cart, name="cart"),
    path("checkout/", views.checkout, name="checkout"),
    path("update_item/", views.updateItem, name="update_item"),
]
