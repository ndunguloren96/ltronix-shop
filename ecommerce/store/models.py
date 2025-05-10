from django.db import models
from django.contrib.auth.models import User

# Create your models here.
"""
Each model maps to a single database table.

"""


# Customer Model
class Customer(models.Model):
    user = models.OneToOneField(User, null=True, blank=True, on_delete=models.CASCADE)
    name = models.CharField(max_length=200, null=True)
    email = models.CharField(max_length=200)

    def __str__(self):
        return self.name


# Product Model
"""
Digital will be true or false. Ltes us know if its a digital product or a physical product that needs to be shipped.
"""


class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.FloatField()
    digital = models.BooleanField(default=False, null=True, blank=True)

    def __str__(self):
        return self.name
