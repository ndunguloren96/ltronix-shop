from django.shortcuts import render
from django.http import JsonResponse
import json

from .models import * # Customer, Product, Order, OrderItem, ShippingAddress


def store(request):

    if request.user.is_authenticated:
        try:
            customer = request.user.customer
            # get_or_create returns a tuple (object, created_boolean)
            order, created = Order.objects.get_or_create(customer=customer, complete=False)
            items = order.orderitem_set.all()
            cartItems = order.get_cart_items
        except Customer.DoesNotExist:
            # Handle case where a logged-in user might not have a Customer profile
            # For now, treat them as having an empty cart.
            # You might want to create a Customer profile here or redirect.
            items = []
            # Mock order object for consistency with template expectations
            order = {
                "get_cart_total": 0,
                "get_cart_items": 0,
                "shipping": False, # Explicitly set shipping for the mock order
                "id": None # Add id if your template expects order.id for form actions etc.
            }
            cartItems = order['get_cart_items']
    else:
        # Guest users
        items = []
        # Mock order object for guest users
        order = {
            "get_cart_total": 0,
            "get_cart_items": 0,
            "shipping": False, # Guest cart implies no physical items initially, so no shipping
            "id": None
        }
        cartItems = order['get_cart_items']

    products = Product.objects.all()
    context = {"products": products, "cartItems": cartItems}
    return render(request, "store/store.html", context)



def cart(request):
    cartItems = 0 #initialize to zero to prevent UnboundLocalError
    if request.user.is_authenticated:
        try:
            customer = request.user.customer
            # get_or_create returns a tuple (object, created_boolean)
            order, created = Order.objects.get_or_create(customer=customer, complete=False)
            items = order.orderitem_set.all()
            # The 'order' object itself will have .get_cart_total, .get_cart_items, and .shipping properties
        except Customer.DoesNotExist:
            # Handle case where a logged-in user might not have a Customer profile
            # For now, treat them as having an empty cart.
            # You might want to create a Customer profile here or redirect.
            items = []
            # Mock order object for consistency with template expectations
            order = {
                "get_cart_total": 0,
                "get_cart_items": 0,
                "shipping": False, # Explicitly set shipping for the mock order
                "id": None # Add id if your template expects order.id for form actions etc.
            }
            cartItems = order['get_cart_items']
    else:
        # Guest users
        items = []
        # Mock order object for guest users
        order = {
            "get_cart_total": 0,
            "get_cart_items": 0,
            "shipping": False, # Guest cart implies no physical items initially, so no shipping
            "id": None
        }
        cartItems = order['get_cart_items']

    context = {"items": items, "order": order, "cartItems": cartItems}
    return render(request, "store/cart.html", context)


def checkout(request):
    cartItems = 0 #initialize to zero to prevent UnboundLocalError in checkout page
    if request.user.is_authenticated:
        try:
            customer = request.user.customer
            order, created = Order.objects.get_or_create(customer=customer, complete=False)
            items = order.orderitem_set.all()
            # The 'order' object itself will have .get_cart_total, .get_cart_items, and .shipping properties
        except Customer.DoesNotExist:
            items = []
            order = {
                "get_cart_total": 0,
                "get_cart_items": 0,
                "shipping": False,
                "id": None
            }
            cartItems = order['get_cart_items']
    else:
        # Guest users
        items = []
        order = {
            "get_cart_total": 0,
            "get_cart_items": 0,
            "shipping": False,
            "id": None
        }
        cartItems = order['get_cart_items']

    # Corrected context: It should always include items and order
    context = {"items": items, "order": order, "cartItems": cartItems}
    return render(request, "store/checkout.html", context)

def updateItem(request):
    data = json.loads(request.body)
    productId = data['productId']
    action = data['action']

    print('Action:', action)
    print('Product ID:', productId)

    customer = request.user.customer
    product = Product.objects.get(id=productId)
    order, created = Order.objects.get_or_create(customer=customer, complete=False)
    orderItem, created = OrderItem.objects.get_or_create(order=order, product=product)

    if action == 'add':
        orderItem.quantity = (orderItem.quantity + 1)
    elif action == 'remove':
        orderItem.quantity = (orderItem.quantity - 1)

    orderItem.save()

    if orderItem.quantity <= 0:
        orderItem.delete()

    return JsonResponse('Item was added', safe=False)