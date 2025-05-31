from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Transaction
from store.models import Order
from django_daraja.mpesa.core import MpesaClient
from django.conf import settings

class MpesaStkPushAPIView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def post(self, request):
        phone = request.data.get('phone')
        order_id = request.data.get('order_id')
        if not phone or not order_id:
            return Response({'error': 'Phone and order ID are required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_400_BAD_REQUEST)
        amount = int(order.get_cart_total)
        if amount <= 0:
            return Response({'error': 'Order amount must be greater than zero'}, status=status.HTTP_400_BAD_REQUEST)
        tx = Transaction.objects.create(phone=phone, amount=amount, order=order, status='PENDING')
        client = MpesaClient()
        account_reference = 'Ltronix Shop'
        transaction_desc = 'Order payment'
        callback_url = settings.MPESA_CALLBACK_URL
        try:
            response = client.stk_push(
                phone_number=phone,
                amount=amount,
                account_reference=account_reference,
                transaction_desc=transaction_desc,
                callback_url=callback_url
            )
            response_data = vars(response) if hasattr(response, '__dict__') else response
            tx.merchant_request_id = response_data.get('MerchantRequestID')
            tx.checkout_request_id = response_data.get('CheckoutRequestID')
            tx.save()
            return Response({
                'transaction_id': tx.id,
                'status': tx.status,
                'merchant_request_id': tx.merchant_request_id,
                'checkout_request_id': tx.checkout_request_id,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            tx.status = 'FAILED'
            tx.save()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
