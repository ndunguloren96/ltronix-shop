# ecommerce/store/admin.py
from django.contrib import admin
from django.utils.html import \
    format_html  # Import format_html for safer HTML rendering

from .models import (Category, Customer, Order, OrderItem, Product,
                     ShippingAddress)


class ProductAdmin(admin.ModelAdmin):
    # Display these columns in the list view of products in admin
    list_display = (
        "name",
        "seller",
        "price",
        "category",
        "stock",
        "brand",
        "sku",
        "rating",
        "reviews_count",
        "image_preview",
    )

    # Fields to show in the add/change form
    # Note: 'image_preview' is a read-only field, 'image_file' is the actual editable field.
    # We include all new fields here for easy management.
    fields = (
        "name",
        "description",
        "price",
        "digital",
        "category",
        "stock",
        "brand",
        "sku",
        "rating",
        "reviews_count",
        "image_url",
        "image_preview",  # 'image_url' is for upload, 'image_preview' is for display
    )

    # Make 'image_preview' read-only as it's derived from 'image_url'
    readonly_fields = ("image_preview",)

    # Custom method to display image thumbnail in admin list and detail view
    def image_preview(self, obj):
        if obj.image_url:  # Check if image_url exists
            return format_html(
                '<img src="{}" style="max-height: 100px; border-radius: 4px;" />',
                obj.image_url.url,
            )
        return format_html(
            '<span style="color: #888;">No Image</span>'
        )  # Fallback text

    image_preview.short_description = "Image Preview"  # Column header in admin

    # Optional: Add filters for better navigation in admin
    list_filter = ("category", "brand", "digital", "seller")

    # Optional: Add search fields
    search_fields = ("name", "description", "brand", "sku")

    # Optional: Date hierarchy for created_at/updated_at
    date_hierarchy = "created_at"


admin.site.register(Product, ProductAdmin)
admin.site.register(Customer)
admin.site.register(Category)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(ShippingAddress)
