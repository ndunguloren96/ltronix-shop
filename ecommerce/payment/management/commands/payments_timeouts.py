from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone
from payment.models import Transaction

TIMEOUT_MINUTES = 1.6  # for improved security


class Command(BaseCommand):
    help = "Mark pending transactions as FAILED if they have timed out"

    def handle(self, *args, **kwargs):
        timeout_time = timezone.now() - timedelta(minutes=TIMEOUT_MINUTES)
        timed_out = Transaction.objects.filter(
            status="PENDING", created_at__lt=timeout_time
        )
        count = timed_out.count()
        for tx in timed_out:
            tx.status = "FAILED"
            tx.save()
            if tx.order:
                tx.order.complete = False
                tx.order.save()
        self.stdout.write(
            self.style.SUCCESS(f"Marked {count} transactions as FAILED due to timeout.")
        )
