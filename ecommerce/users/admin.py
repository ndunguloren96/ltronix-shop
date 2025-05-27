from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User  # Import your custom User model

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # This class will customize how your User model appears in the admin.
    # You might need to adjust fieldsets and add_fieldsets based on your custom User model fields.
    # For a basic setup, this is often enough if you're using AbstractBaseUser with email as USERNAME_FIELD.

    # If you only have 'email' and 'password', you might simplify these.
    # The default UserAdmin expects 'username', 'first_name', 'last_name', 'email'.
    # Since you're using email as USERNAME_FIELD, you need to adjust this.

    # Example: Minimal configuration for email-only login
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}), # Include other default fields you might want
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password', 're_password'), # re_password is for creation only
        }),
    )
    list_display = ('email', 'is_staff', 'is_active')
    search_fields = ('email',)
    ordering = ('email',)
    filter_horizontal = ('groups', 'user_permissions',) # Needed if you use these