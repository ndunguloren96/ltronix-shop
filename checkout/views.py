from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import ShippingAddress, Payment, OrderSummary
from cart.models import Cart
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404

User = get_user_model()


class CheckoutView(APIView):
    def get(self, request):
        # Return cart, shipping, and payment info for review
        user = request.user
        cart = Cart.objects.filter(user=user).last()
        address = ShippingAddress.objects.filter(user=user).last()
        payment = Payment.objects.filter(user=user).last()
        data = {
            "cart_id": cart.id if cart else None,
            "shipping_address": str(address) if address else None,
            "payment_status": payment.status if payment else None,
        }
        return Response(data)


class PlaceOrderView(APIView):
    def post(self, request):
        user = request.user
        cart_id = request.data.get("cart_id")
        address_id = request.data.get("shipping_address_id")
        payment_id = request.data.get("payment_id")
        total = request.data.get("total")
        cart = get_object_or_404(Cart, id=cart_id, user=user)
        address = get_object_or_404(ShippingAddress, id=address_id, user=user)
        payment = get_object_or_404(Payment, id=payment_id, user=user)
        order = OrderSummary.objects.create(
            user=user,
            cart=cart,
            shipping_address=address,
            payment=payment,
            total=total,
            status="processing",
        )
        return Response(
            {"order_id": order.id, "status": order.status},
            status=status.HTTP_201_CREATED,
        )


class ConfirmPaymentView(APIView):
    def post(self, request):
        payment_id = request.data.get("payment_id")
        payment = get_object_or_404(Payment, id=payment_id)
        payment.status = "completed"
        payment.save()
        return Response({"payment_id": payment.id, "status": payment.status})
