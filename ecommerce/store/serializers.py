# ecommerce/store/serializers.py
from rest_framework import serializers
from django.db import transaction # Import transaction for atomic operations
from .models import Product, Order, OrderItem, Customer

# --- Read-only Product Serializer (for nested use in OrderItem) ---
# This remains largely the same, but ensures it can be used nested.
class ProductSerializer(serializers.ModelSerializer):
    # This will now return the full absolute URL for the image
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'image_url', # Using the property
            'brand', 'sku', 'rating', 'reviews_count',
            'digital', 'category', 'stock',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'image_url', 'created_at', 'updated_at']

    def get_image_url(self, obj):
        # Build the absolute URL for the image_file
        if obj.image_file and hasattr(obj.image_file, 'url'):
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.image_file.url)
            return obj.image_file.url # Fallback to relative if request context isn't available
        return ''

# --- Writable OrderItem Serializer (for handling input to Order) ---
# This serializer is used for receiving cart item data from the frontend.
class WritableOrderItemSerializer(serializers.ModelSerializer):
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )
    # The 'id' field is for updates, 'product' and 'quantity' are for new items or updates.
    id = serializers.IntegerField(required=False) # Used for identifying existing items during updates

    class Meta:
        model = OrderItem
        fields = ['id', 'product_id', 'quantity'] # Fields for input

    def validate(self, data):
        # Ensure quantity is positive
        if data['quantity'] <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero.")
        # Optionally, check product stock here
        product = data['product'] # This is the Product instance due to source='product'
        if product.stock < data['quantity']:
            raise serializers.ValidationError(f"Not enough stock for {product.name}. Available: {product.stock}")
        return data


# --- Read-only OrderItem Serializer (for outputting Order details) ---
# This serializer is used for displaying order items (nested within OrderSerializer output)
class ReadOnlyOrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True) # Nested ProductSerializer for output
    # 'get_total' is a property on the OrderItem model
    get_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'get_total']


# --- Order Serializer (handles creation and update of Orders with nested OrderItems) ---
class OrderSerializer(serializers.ModelSerializer):
    # This 'items' field will be used for both input (WritableOrderItemSerializer)
    # and output (ReadOnlyOrderItemSerializer).
    # many=True indicates it's a list of items.
    # write_only=True for WritableOrderItemSerializer so it's not included in output when creating/updating.
    # read_only=True for ReadOnlyOrderItemSerializer is default for nested serializers.
    items = ReadOnlyOrderItemSerializer(many=True, read_only=True)
    
    # Field for receiving items during creation/update from frontend
    # This is a custom field that will be handled in the create/update methods
    order_items_input = WritableOrderItemSerializer(
        data=serializers.ListField(child=serializers.DictField(), write_only=True), # Accept list of dicts for items
        many=True, 
        required=False,
        source='items' # Maps to the 'items' attribute in the data, which will be processed manually
    )

    class Meta:
        model = Order
        fields = [
            'id', 'customer', 'date_ordered', 'complete', 'transaction_id',
            'get_cart_total', 'get_cart_items', 'shipping', 'items', 'order_items_input'
        ]
        read_only_fields = ['id', 'customer', 'date_ordered', 'complete', 'transaction_id',
                            'get_cart_total', 'get_cart_items', 'shipping', 'items']

    def get_items(self, obj):
        # This method is for the 'items' field when serializing for output
        # It ensures that when an Order is retrieved, its related OrderItems are also serialized.
        items = obj.orderitem_set.all().select_related('product')
        # Pass request context to nested ProductSerializer for image_url
        return ReadOnlyOrderItemSerializer(items, many=True, context=self.context).data

    def create(self, validated_data):
        # Remove the 'items' (input data) from validated_data before creating the Order instance
        order_items_data = validated_data.pop('items', []) # 'items' here refers to order_items_input data

        # Ensure the order is associated with a customer if authenticated
        customer = self.context['request'].user.customer if self.context['request'].user.is_authenticated else None
        
        # Ensure the order is created as incomplete initially (a cart)
        order = Order.objects.create(customer=customer, complete=False, **validated_data)

        # Create OrderItem instances
        for item_data in order_items_data:
            OrderItem.objects.create(order=order, product=item_data['product'], quantity=item_data['quantity'])

        return order

    def update(self, instance, validated_data):
        # Handle updating order items
        order_items_data = validated_data.pop('items', []) # 'items' here refers to order_items_input data

        with transaction.atomic():
            # Update order fields
            instance.complete = validated_data.get('complete', instance.complete)
            instance.transaction_id = validated_data.get('transaction_id', instance.transaction_id)
            # You can add more fields to update if necessary (e.g., shipping address)
            instance.save()

            # Process order items:
            # Get current order item IDs
            current_order_item_ids = set(instance.orderitem_set.values_list('id', flat=True))
            incoming_order_item_ids = set(item.get('id') for item in order_items_data if 'id' in item)

            # Items to delete (exist in current but not in incoming with an ID)
            items_to_delete = current_order_item_ids - incoming_order_item_ids
            OrderItem.objects.filter(id__in=items_to_delete, order=instance).delete()

            for item_data in order_items_data:
                item_id = item_data.get('id')
                product = item_data['product']
                quantity = item_data['quantity']

                if item_id:
                    # Update existing item
                    order_item = OrderItem.objects.get(id=item_id, order=instance)
                    order_item.product = product # Update product in case it changed (unlikely for cart)
                    order_item.quantity = quantity
                    order_item.save()
                else:
                    # Create new item
                    # Check if item already exists in the cart (for duplicate product_id without an item_id)
                    existing_item = instance.orderitem_set.filter(product=product).first()
                    if existing_item:
                        existing_item.quantity += quantity
                        existing_item.save()
                    else:
                        OrderItem.objects.create(order=instance, product=product, quantity=quantity)
            
            # Re-fetch items to ensure properties like get_cart_total, get_cart_items are accurate after updates
            instance.refresh_from_db()

        return instance

