from django.contrib import admin
from .models import ShippingAddress, Payment, OrderSummary

@admin.register(ShippingAddress)
class ShippingAddressAdmin(admin.ModelAdmin):
    list_display = ("user", "address", "city", "postal_code", "country")
    search_fields = ("user__username", "address", "city", "country")

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("user", "amount", "timestamp", "status", "payment_method")
    search_fields = ("user__username", "payment_method")
    list_filter = ("status", "payment_method")

@admin.register(OrderSummary)
class OrderSummaryAdmin(admin.ModelAdmin):
    list_display = ("user", "cart", "total", "status", "created_at")
    search_fields = ("user__username",)
    list_filter = ("status",)
