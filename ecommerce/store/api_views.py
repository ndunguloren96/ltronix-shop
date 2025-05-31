from rest_framework import viewsets, permissions
from .models import Product, Order
from .serializers import ProductSerializer, OrderSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # Optionally filter by user/customer
        user = self.request.user
        if user.is_authenticated:
            return Order.objects.filter(customer__user=user)
        return Order.objects.none()

    def perform_create(self, serializer):
        # Attach order to current user if authenticated
        user = self.request.user
        if user.is_authenticated:
            customer = getattr(user, 'customer', None)
            if customer:
                serializer.save(customer=customer)
            else:
                serializer.save()
        else:
            serializer.save()
