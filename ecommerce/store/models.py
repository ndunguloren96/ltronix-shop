# ecommerce/store/models.py
from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from sellers.models import Seller


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = _("Category")
        verbose_name_plural = _("Categories")
        ordering = ["name"]

    def __str__(self):
        return self.name


class Customer(models.Model):
    # Link to the custom user model defined in settings.AUTH_USER_MODEL
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE
    )
    name = models.CharField(max_length=200, null=True)
    # Email field in Customer is often redundant if linked to User model,
    # as User model typically has an email. Keeping it for backward compatibility
    # but marking as blank/null if it's not strictly needed here.
    email = models.CharField(max_length=200, null=True, blank=True)

    class Meta:
        verbose_name = _("Customer")
        verbose_name_plural = _("Customers")
        ordering = ["name"]

    def __str__(self):
        if self.user and self.user.email:
            return self.user.email
        return self.name if self.name else f"Customer {self.id}"


class Product(models.Model):
    name = models.CharField(_("name"), max_length=200)
    # Changed to DecimalField for currency accuracy
    price = models.DecimalField(_("price"), max_digits=10, decimal_places=2)
    digital = models.BooleanField(_("digital"), default=False, null=True, blank=True)
    # Changed image to image_file to clearly separate from image_url property
    image_file = models.ImageField(
        _("image file"), null=True, blank=True, upload_to="product_images/"
    )
    category = models.ForeignKey(
        Category,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="products",
    )
    stock = models.PositiveIntegerField(_("stock"), default=0)
    description = models.TextField(_("description"), blank=True, null=True)

    # New fields for frontend requirements
    brand = models.CharField(_("brand"), max_length=100, blank=True, null=True)
    sku = models.CharField(
        _("SKU"),
        max_length=50,
        unique=True,
        blank=True,
        null=True,
        help_text=_("Stock Keeping Unit, unique identifier for the product variant."),
    )
    rating = models.DecimalField(
        _("rating"),
        max_digits=3,
        decimal_places=2,
        default=0.00,
        help_text=_("Average product rating out of 5.00"),
    )
    reviews_count = models.PositiveIntegerField(
        _("reviews count"),
        default=0,
        help_text=_("Total number of reviews for this product"),
    )

    seller = models.ForeignKey(
        Seller,
        on_delete=models.CASCADE, # Or models.PROTECT if products should not be deleted when a seller is
        related_name='products',
        verbose_name=_("seller")
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Product")
        verbose_name_plural = _("Products")
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["brand"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["seller"]),
        ]

    def __str__(self):
        return self.name

    @property
    def image_url(self):
        """Returns the URL of the product image."""
        if self.image_file and hasattr(self.image_file, "url"):
            return self.image_file.url
        return ""


class Order(models.Model):
    # This represents both a shopping cart (complete=False) and a placed order (complete=True)
    customer = models.ForeignKey(
        Customer, on_delete=models.SET_NULL, null=True, blank=True
    )
    date_ordered = models.DateTimeField(auto_now_add=True)
    complete = models.BooleanField(
        default=False
    )  # False means it's a cart, True means it's a completed order
    transaction_id = models.CharField(max_length=100, null=True)

    # NEW FIELD for guest carts
    session_key = models.CharField(
        max_length=255, null=True, blank=True, unique=True
    )  # Unique ID for guest carts

    class Meta:
        verbose_name = _("Order")
        verbose_name_plural = _("Orders")
        ordering = ["-date_ordered"]
        indexes = [
            models.Index(fields=["complete"]),
            models.Index(fields=["-date_ordered"]),
        ]

    def __str__(self):
        return str(self.id)

    @property
    def shipping(self):
        shipping = False
        orderitems = self.orderitem_set.select_related("product").all()
        for i in orderitems:
            if i.product.digital == False:
                shipping = True
        return shipping

    @property
    def get_cart_total(self):
        orderitems = self.orderitem_set.select_related("product").all()
        total = sum([item.get_total for item in orderitems])
        return total

    @property
    def get_cart_items(self):
        orderitems = self.orderitem_set.all()
        total = sum([item.quantity for item in orderitems])
        return total


class OrderItem(models.Model):
    # Represents an item within an Order (cart item or line item in a completed order)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True)
    quantity = models.IntegerField(default=0, null=True, blank=True)
    date_added = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Order Item")
        verbose_name_plural = _("Order Items")
        ordering = ["-date_added"]
        indexes = [
            models.Index(fields=["-date_added"]),
        ]

    @property
    def get_total(self):
        total = self.product.price * self.quantity
        return total


class ShippingAddress(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True)
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True)
    address = models.CharField(max_length=200, null=False)
    city = models.CharField(max_length=200, null=False)
    state = models.CharField(max_length=200, null=False)
    zipcode = models.CharField(max_length=200, null=False)
    date_added = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Shipping Address")
        verbose_name_plural = _("Shipping Addresses")
        ordering = ["-date_added"]

    def __str__(self):
        return self.address
