# ecommerce/store/migrations/000X_populate_order_sellers.py (Use your actual filename)

from django.db import migrations, models
from django.conf import settings
import django.db.models.deletion


def populate_order_sellers(apps, schema_editor):
    User = apps.get_model(settings.AUTH_USER_MODEL)
    Seller = apps.get_model('sellers', 'Seller')
    Order = apps.get_model('store', 'Order')

    superuser = User.objects.filter(is_superuser=True).order_by('pk').first()

    if not superuser:
        print("No superuser found. Cannot assign default seller to orders.")
        return

    default_seller, created = Seller.objects.get_or_create(
        user=superuser,
        defaults={'business_name': 'Ltronix Featured'}
    )
    if created:
        print(f"Created default seller: {default_seller.business_name} (ID: {default_seller.pk})")
    else:
        print(f"Found existing default seller: {default_seller.business_name} (ID: {default_seller.pk})")

    # Fetch existing valid seller IDs for efficient lookup
    existing_seller_ids = set(Seller.objects.values_list('id', flat=True))

    orders_to_update = []
    # Use .iterator() for potentially large querysets to avoid loading all into memory
    for order in Order.objects.iterator():
        # Check if the order's seller_id is invalid (e.g., points to a non-existent seller)
        # or if it's None (in case the field was temporarily nullable at some point)
        if order.seller_id is None or order.seller_id not in existing_seller_ids:
            order.seller = default_seller
            orders_to_update.append(order)

    if orders_to_update:
        # Use bulk_update for efficiency in saving changes
        Order.objects.bulk_update(orders_to_update, ['seller'])
        print(f"Assigned default seller to {len(orders_to_update)} existing orders with invalid seller IDs.")
    else:
        print("No orders found with invalid seller IDs to update.")


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0002_product_seller_and_more'), # Ensure this runs after the previous product migration
        ('sellers', '0001_initial'), # Ensure Seller model is available
    ]

    operations = [
        migrations.RunPython(populate_order_sellers, reverse_code=migrations.RunPython.noop),
    ]
