# users/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin # Import BaseUserAdmin for better customization
from .models import User, UserProfile # Import your custom User and UserProfile models


@admin.register(User)
class CustomUserAdmin(BaseUserAdmin): # Inherit from BaseUserAdmin
    """
    Admin configuration for the custom User model.
    This ensures that all fields relevant to the User model
    (including custom ones like phone, gender, dob) are manageable.
    """
    # Define custom fieldsets to include all user-specific fields
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            "Personal info",
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "phone_number", # These fields are on the User model
                    "gender",       # These fields are on the User model
                    "date_of_birth",# These fields are on the User model
                )
            },
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    # Define add_fieldsets for creating new users in the admin
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "password",
                    "re_password", # Assuming 're_password' is for password confirmation during creation
                    "first_name",
                    "last_name",
                    "phone_number",
                    "gender",
                    "date_of_birth",
                ),
            },
        ),
    )
    
    # List display fields for the user list view in admin
    list_display = ("email", "first_name", "last_name", "phone_number", "gender", "is_staff", "is_active")
    search_fields = ("email", "first_name", "last_name", "phone_number")
    ordering = ("email",)
    filter_horizontal = (
        "groups",
        "user_permissions",
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """
    Admin configuration for the UserProfile model.
    This ensures only fields directly present on UserProfile are managed here.
    """
    # Only include 'user' (the FK to User) and 'middle_name' (if it's on UserProfile)
    list_display = ('user', 'middle_name') 
    search_fields = ('user__email', 'middle_name') # Search by user's email or middle name
    # Removed 'gender' from list_filter as it's not on UserProfile

