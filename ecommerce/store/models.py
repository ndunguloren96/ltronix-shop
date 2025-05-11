from django.db import models
from django.contrib.auth.models import User

# Create your models here.
"""
Each model maps to a single database table.

"""


# Customer Model
class Customer(models.Model):
    user = models.OneToOneField(User, null=True, blank=True, on_delete=models.CASCADE)
    name = models.CharField(max_length=200, null=True)
    email = models.CharField(max_length=200)

    def __str__(self):
        return self.name


# Product Model
"""
Digital will be true or false. Ltes us know if its a digital product or a physical product that needs to be shipped.
"""


class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.FloatField()
    digital = models.BooleanField(default=False, null=True, blank=True)
    image = models.ImageField(
        null=True, blank=True
    )  # Images will be uploaded to MEDIA_ROOT

    def __str__(self):
        return self.name

    @property  # This decorator allows you to call imageURL as an attribute (e.g., product.imageURL)
    def imageURL(self):
        try:
            url = self.image.url
        except:  # Catches errors if image is None or has no file
            url = ""
        return url


# Order Model
class Order(models.Model):
    customer = models.ForeignKey(
        Customer, on_delete=models.SET_NULL, null=True, blank=True
    )
    date_ordered = models.DateTimeField(auto_now_add=True)
    complete = models.BooleanField(default=False)
    transaction_id = models.CharField(max_length=100, null=True)

    def __str__(self):
        return str(self.id)

    # Calculating totals
    @property
    def get_cart_total(self):
        orderitems = self.orderitem_set.all()
        # Relies on OrderItem.get_total being robust
        total = sum([item.get_total for item in orderitems])
        return total

    @property
    def get_cart_items(self):
        orderitems = self.orderitem_set.all()
        # Sum quantities, treating None as 0 or filtering them out
        total = sum([item.quantity for item in orderitems if item.quantity is not None])
        return total

    @property
    def shipping(self):
        """
        Determines if shipping is required for the order.
        Shipping is required if any item in the order is not digital.
        """
        shipping_required = False
        orderitems = self.orderitem_set.all()
        for item in orderitems:
            # Ensure product exists and then check its digital status
            if item.product and not item.product.digital:
                shipping_required = True
                break  # No need to check further if one physical item is found
        return shipping_required


# OrderItem Model
class OrderItem(models.Model):
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True)
    quantity = models.IntegerField(default=0, null=True, blank=True)
    date_added = models.DateTimeField(auto_now_add=True)

    @property
    def get_total(self):
        # Ensure product, price, and quantity are valid before calculating
        if (
            self.product
            and self.product.price is not None
            and self.quantity is not None
        ):
            return self.product.price * self.quantity
        return 0  # Return 0 if data is incomplete or product is missing


# Shipping Address Model
"""
Shipping Model is a child to order and will only be created if at least one orderitem within an order is a physical product
(If Product.digital == False).
"""


class ShippingAddress(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True)
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True)
    address = models.CharField(max_length=200, null=False)
    city = models.CharField(max_length=200, null=False)
    state = models.CharField(max_length=200, null=False)
    zipcode = models.CharField(max_length=200, null=False)
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.address
