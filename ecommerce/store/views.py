# ecommerce/store/views.py
import datetime
import json
import logging

from django.http import JsonResponse
from django.shortcuts import render

from store.models import *
from store.utils import cookieCart, cartData
from emails.services import send_order_confirmation
import logging

logger = logging.getLogger("store")


def store(request):
    """Renders the store page with all products and cart data."""
    data = cartData(request)

    cartItems = data["cartItems"]
    order = data["order"]
    items = data["items"]

    products = Product.objects.select_related("category").all()
    context = {"products": products, "cartItems": cartItems}
    return render(request, "store/store.html", context)


def cart(request):
    """Renders the cart page with cart data."""
    data = cartData(request)

    cartItems = data["cartItems"]
    order = data["order"]
    items = data["items"]

    context = {"items": items, "order": order, "cartItems": cartItems}
    return render(request, "store/cart.html", context)


def checkout(request):
    """Renders the checkout page with cart data."""
    data = cartData(request)

    cartItems = data["cartItems"]
    order = data["order"]
    items = data["items"]

    context = {"items": items, "order": order, "cartItems": cartItems}
    return render(request, "store/checkout.html", context)


def updateItem(request):
    """Updates the quantity of a cart item or removes it from the cart."""
    data = json.loads(request.body)
    productId = data["productId"]
    action = data["action"]
    print("Action:", action)
    print("Product:", productId)

    customer = request.user.customer
    product = Product.objects.get(id=productId)
    order, created = Order.objects.get_or_create(customer=customer, complete=False)

    orderItem, created = OrderItem.objects.get_or_create(order=order, product=product)

    if action == "add":
        orderItem.quantity = orderItem.quantity + 1
    elif action == "remove":
        orderItem.quantity = orderItem.quantity - 1

    orderItem.save()

    if orderItem.quantity <= 0:
        orderItem.delete()

    return JsonResponse("Item was added", safe=False)


def processOrder(request):
    """Processes the order and creates a shipping address if required."""
    transaction_id = datetime.datetime.now().timestamp()
    data = json.loads(request.body)

    if request.user.is_authenticated:
        customer = request.user.customer
        order, created = Order.objects.get_or_create(customer=customer, complete=False)
    else:
        print("User is not logged in")
        print("COOKIES:", request.COOKIES)
        name = data["form"]["name"]
        email = data["form"]["email"]

        cookieData = cookieCart(request)
        items = cookieData["items"]

        customer, created = Customer.objects.get_or_create(
            email=email,
        )
        customer.name = name
        customer.save()

        order = Order.objects.create(
            customer=customer,
            complete=False,
        )

        for item in items:
            product = Product.objects.get(id=item["id"])
            orderItem = OrderItem.objects.create(
                product=product,
                order=order,
                quantity=item["quantity"],
            )

    total = float(data["form"]["total"])
    order.transaction_id = transaction_id

    if total == order.get_cart_total:
        order.complete = True
    order.save()

    # Send order confirmation email when order is completed
    if order.complete:
        recipient_email = customer.email or (
            customer.user.email if customer.user else None
        )
        if recipient_email:
            send_order_confirmation(recipient_email, {
                'id': order.id,
                'customer_name': customer.name if customer else 'Guest',
                'get_cart_total': str(order.get_cart_total),
                'items': [{
                    'product_name': item.product.name,
                    'quantity': item.quantity,
                    'get_total': str(item.get_total)
                } for item in order.orderitem_set.all()]
            })
        logger.info(
            f"Order {order.id} completed and confirmation email sent to {recipient_email}"
        )

    if order.shipping == True:
        ShippingAddress.objects.create(
            customer=customer,
            order=order,
            address=data["shipping"]["address"],
            city=data["shipping"]["city"],
            state=data["shipping"]["state"],
            zipcode=data["shipping"]["zipcode"],
        )

    return JsonResponse("Payment submitted..", safe=False)