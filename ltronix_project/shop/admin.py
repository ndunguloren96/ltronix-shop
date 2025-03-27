from django.contrib import admin
from .models import Product, Category, Order

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "price", "get_category", "created_at")
    search_fields = ("name", "description")
    list_filter = ("category__name",)

    def get_category(self, obj):
        return obj.category.name
    get_category.short_description = "Category"

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name",)

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "total_price", "created_at")
    search_fields = ("user__username",)
    list_filter = ("created_at",)
