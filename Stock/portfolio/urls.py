from django.urls import path
from .views import (
    PortfolioAPIView,
    StockAPIView,
    HoldingListAPIView,
    BuyAPIView,
    SellAPIView,
    StockHistoryAPIView,
)

urlpatterns = [
    path("portfolios/", PortfolioAPIView.as_view()),
    path("stocks/", StockAPIView.as_view()),
    path("holdings/", HoldingListAPIView.as_view()),
    path("holdings/buy/", BuyAPIView.as_view()),
    path("holdings/sell/", SellAPIView.as_view()),
    path("stocks/<str:ticker>/history/", StockHistoryAPIView.as_view()),
]
