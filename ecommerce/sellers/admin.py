# ecommerce/sellers/admin.py
from django.contrib import admin
from .models import Seller, SellerProfile

class SellerProfileInline(admin.StackedInline):
    model = SellerProfile
    can_delete = False
    verbose_name_plural = 'Profile'

@admin.register(Seller)
class SellerAdmin(admin.ModelAdmin):
    list_display = ('business_name', 'user', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('business_name', 'user__email')
    inlines = (SellerProfileInline,)