from django.contrib import admin
from .models import Customer, Product, Order, OrderItem, ShippingAddress, Category

class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'category', 'stock', 'image_tag')
    readonly_fields = ('image_tag',)
    fields = ('name', 'price', 'digital', 'image', 'category', 'stock', 'description', 'image_tag')

    def image_tag(self, obj):
        if obj.image:
            return f'<img src="{obj.image.url}" style="max-height: 100px;" />'
        return "-"
    image_tag.allow_tags = True
    image_tag.short_description = 'Image'

admin.site.register(Product, ProductAdmin)
admin.site.register(Customer)
admin.site.register(Category)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(ShippingAddress)
