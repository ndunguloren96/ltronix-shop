# /var/www/Django-Ecommerce-Website/ecommerce/store/views.py
from django.shortcuts import render
from django.http import HttpResponse # For simple text responses

def store(request):
    # You'll eventually render a template here, e.g.,
    # return render(request, 'store/store.html')
    return HttpResponse("<h1>Welcome to the Store Page!</h1>")

def cart(request):
    # return render(request, 'store/cart.html')
    return HttpResponse("<h1>Your Shopping Cart</h1>")

def checkout(request):
    # return render(request, 'store/checkout.html')
    return HttpResponse("<h1>Checkout Page</h1>")

# Add any other views your store app might need