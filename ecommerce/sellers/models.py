# ecommerce/sellers/models.py
from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

class Seller(models.Model):
    """
    Represents the core seller entity, linked to a user account.
    This is the central model for a vendor in the marketplace.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='seller_profile',
        verbose_name=_("user account")
    )
    business_name = models.CharField(
        _("business name"),
        max_length=255,
        unique=True,
        help_text=_("The official name of the seller's store.")
    )
    is_active = models.BooleanField(
        _("active status"),
        default=False,
        help_text=_("Designates whether the seller's products are visible on the site.")
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Seller")
        verbose_name_plural = _("Sellers")
        ordering = ['business_name']

    def __str__(self):
        return self.business_name

class SellerProfile(models.Model):
    """
    Holds additional, non-essential details about a seller.
    """
    seller = models.OneToOneField(
        Seller,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    contact_phone = models.CharField(_("contact phone"), max_length=25, blank=True)
    support_email = models.EmailField(_("support email"), blank=True)
    business_address = models.TextField(_("business address"), blank=True)
    # This field is critical for marketplace payments with systems like Stripe Connect
    payout_details_id = models.CharField(
        max_length=255,
        blank=True,
        help_text=_("Stores the seller's payment account ID from the payment provider (e.g., Stripe Account ID).")
    )

    class Meta:
        verbose_name = _("Seller Profile")
        verbose_name_plural = _("Seller Profiles")

    def __str__(self):
        return f"{self.seller.business_name} Profile"