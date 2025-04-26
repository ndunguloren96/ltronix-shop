from rest_framework import generics, permissions
from .models import Order
from .serializers import OrderSerializer, CreateOrderSerializer


class OrderListCreateView(generics.ListCreateAPIView):
    queryset = Order.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateOrderSerializer
        return OrderSerializer

    def get_queryset(self):
        # Only show orders for the current user
        return Order.objects.filter(user=self.request.user)


class OrderDetailView(generics.RetrieveAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only allow users to access their own orders
        return Order.objects.filter(user=self.request.user)


# Admin view to update order status
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView


class OrderStatusUpdateView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        order = Order.objects.get(pk=pk)
        status_val = request.data.get("status")
        if status_val in dict(Order.STATUS_CHOICES):
            order.status = status_val
            order.save()
            return Response({"status": order.status})
        return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
