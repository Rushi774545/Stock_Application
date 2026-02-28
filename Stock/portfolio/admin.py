from django.contrib import admin
from .models import Portfolio, Stock


@admin.register(Portfolio)
class PortfolioAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "number")


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ("id", "ticker", "date", "open", "high", "low", "close", "volume")
