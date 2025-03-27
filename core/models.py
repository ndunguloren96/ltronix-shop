from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    address = models.TextField(blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)

    groups = models.ManyToManyField(
        "auth.Group",
        related_name="customuser_set",  # Avoid conflict with default User model
        blank=True,
    )
    user_permissions = models.ManyToManyField(
        "auth.Permission",
        related_name="customuser_set",  # Avoid conflict with default User model
        blank=True,
    )
