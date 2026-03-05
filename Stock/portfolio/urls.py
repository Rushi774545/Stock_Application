from django.urls import path
from .views import (
    PortfolioAPIView,
    StockAPIView,
    HoldingListAPIView,
    BuyAPIView,
    SellAPIView,
    StockHistoryAPIView,
    PortfolioAnalyticsAPIView,
    StocksIndexAPIView,
    StockAnalysisAPIView,
)

urlpatterns = [
    path("portfolios/", PortfolioAPIView.as_view()),
    path("portfolios/<int:portfolio_id>/analytics/", PortfolioAnalyticsAPIView.as_view()),
    path("stocks/", StockAPIView.as_view()),
    path("stocks/index/", StocksIndexAPIView.as_view()),
    path("holdings/", HoldingListAPIView.as_view()),
    path("holdings/buy/", BuyAPIView.as_view()),
    path("holdings/sell/", SellAPIView.as_view()),
    path("stocks/<str:ticker>/history/", StockHistoryAPIView.as_view()),
    path("analysis/forecast/", StockAnalysisAPIView.as_view()),
]
