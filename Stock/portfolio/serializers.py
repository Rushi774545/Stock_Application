from rest_framework import serializers
from .models import Portfolio, Stock, Holding


class PortfolioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Portfolio
        fields = ["id", "user", "name", "number"]
        read_only_fields = ["user"]


class StockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = [
            "id",
            "ticker",
            "date",
            "open",
            "high",
            "low",
            "close",
            "volume",
            "pe_ratio",
            "discount",
        ]


class HoldingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Holding
        fields = ["id", "portfolio", "ticker", "quantity", "avg_price"]
