from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models

class CustomUser(AbstractUser):
    # Add related_name to avoid conflicts
    groups = models.ManyToManyField(
        Group,
        related_name="ltronix_customuser_set",  # Avoid conflict with auth.User.groups
        blank=True,
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name="ltronix_customuser_set",  # Avoid conflict with auth.User.user_permissions
        blank=True,
    )

    # Add any additional fields here
    address = models.TextField(blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)