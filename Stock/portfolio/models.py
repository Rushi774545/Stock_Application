from django.db import models
from django.contrib.auth.models import User


class Portfolio(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="portfolios", null=True, blank=True)
    name = models.CharField(max_length=255)
    number = models.IntegerField()


class Holding(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="holdings")
    ticker = models.CharField(max_length=16)
    quantity = models.IntegerField()
    avg_price = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)

    class Meta:
        unique_together = ("user", "ticker")


class Stock(models.Model):
    ticker = models.CharField(max_length=16)
    date = models.DateField()
    open = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    high = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    low = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    close = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    volume = models.BigIntegerField(null=True, blank=True)
    pe_ratio = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    discount = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)

    class Meta:
        unique_together = ("ticker", "date")
        indexes = [
            models.Index(fields=["ticker", "date"]),
        ]
