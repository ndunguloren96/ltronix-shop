# ecommerce/users/models.py

from django.contrib.auth.models import (AbstractBaseUser, BaseUserManager,
                                        PermissionsMixin)
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


# Custom User Manager
class UserManager(BaseUserManager):
    """
    Custom user model manager where email is the unique identifier
    for authentication instead of usernames.
    """

    def create_user(self, email, password=None, **extra_fields):
        """
        Create and save a User with the given email and password.
        """
        if not email:
            raise ValueError(_("The Email must be set"))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Create and save a SuperUser with the given email and password.
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault(
            "is_active", True
        )  # Superuser should be active by default

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser must have is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser must have is_superuser=True."))

        return self.create_user(email, password, **extra_fields)


# Custom User Model
class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model for the e-commerce project.
    Uses email as the unique identifier for authentication.
    """

    email = models.EmailField(_("email address"), unique=True)
    first_name = models.CharField(_("first name"), max_length=150, blank=True)
    last_name = models.CharField(_("last name"), max_length=150, blank=True)
    phone_number = models.CharField(_("phone number"), max_length=20, blank=True, null=True) # Corrected truncation
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]
    gender = models.CharField(_("gender"), max_length=1, choices=GENDER_CHOICES, blank=True, null=True) # Corrected truncation
    date_of_birth = models.DateField(_("date of birth"), blank=True, null=True)

    is_staff = models.BooleanField(
        _("staff status"),
        default=False,
        help_text=_("Designates whether the user can log into this admin site."),
    )
    is_active = models.BooleanField(
        _("active"),
        default=True,
        help_text=_(
            "Designates whether this user should be treated as active. "
            "Unselect this instead of deleting accounts."
        ),
    )
    date_joined = models.DateTimeField(_("date joined"), default=timezone.now)

    # Link to the custom manager
    objects = UserManager()

    USERNAME_FIELD = "email"  # Use email as the unique identifier for authentication
    REQUIRED_FIELDS = (
        []
    )  # No other fields are required beyond email and password (handled by AbstractBaseUser)

    class Meta:
        verbose_name = _("user")
        verbose_name_plural = _("users")
        indexes = [
            models.Index(fields=["first_name"]),
            models.Index(fields=["last_name"]),
        ]

    def __str__(self):
        return self.get_full_name() or self.email

    def get_full_name(self):
        """
        Return the first_name plus the middle_name and last_name, with spaces in between.
        Includes middle_name from the UserProfile if it exists.
        """
        full_name_parts = [self.first_name]

        # Safely get middle_name from profile if it exists
        if hasattr(self, 'profile'):
            if self.profile.middle_name:
                full_name_parts.append(self.profile.middle_name)

        full_name_parts.append(self.last_name)

        # Filter out empty strings and join
        full_name = " ".join(filter(None, full_name_parts))
        return full_name.strip()


    def get_short_name(self):
        """
        Return the short name for the user."""
        return self.first_name


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    middle_name = models.CharField(_("middle name"), max_length=150, blank=True)

    class Meta:
        verbose_name = _("user profile")
        verbose_name_plural = _("user profiles")

    def __str__(self):
        return f"{self.user.email}'s Profile"
