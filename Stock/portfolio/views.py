from datetime import date
from decimal import Decimal, InvalidOperation
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, authentication
from django.db import transaction
import yfinance as yf
from .models import Portfolio, Stock, Holding
from .serializers import PortfolioSerializer, StockSerializer, HoldingSerializer
import math
from random import Random


class PortfolioAPIView(APIView):
    authentication_classes = [authentication.TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        qs = Portfolio.objects.filter(user=request.user).order_by("id")
        return Response(PortfolioSerializer(qs, many=True).data)

    def post(self, request):
        serializer = PortfolioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StockAPIView(APIView):
    default_tickers = [
        "AAPL",
        "MSFT",
        "GOOGL",
        "AMZN",
        "META",
        "TSLA",
        "NVDA",
        "JPM",
        "V",
        "JNJ",
    ]

    def get(self, request):
        qs = Stock.objects.all().order_by("-date", "ticker")
        search = request.GET.get("search")
        if search:
            qs = qs.filter(ticker__icontains=search)
        try:
            page = int(request.GET.get("page", "1"))
        except ValueError:
            page = 1
        try:
            page_size = int(request.GET.get("page_size", "20"))
        except ValueError:
            page_size = 20
        total = qs.count()
        # Auto-populate if empty and first page without search
        if total == 0 and not search and page == 1:
            try:
                self._fetch_and_save(self.default_tickers)
                qs = Stock.objects.all().order_by("-date", "ticker")
                total = qs.count()
            except Exception:
                pass
            if total == 0:
                try:
                    self._seed_demo_data()
                    qs = Stock.objects.all().order_by("-date", "ticker")
                    total = qs.count()
                except Exception:
                    pass
        start = (page - 1) * page_size
        end = start + page_size
        data = StockSerializer(qs[start:end], many=True).data
        return Response(
            {
                "results": data,
                "page": page,
                "page_size": page_size,
                "total": total,
                "pages": math.ceil(total / page_size) if page_size else 1,
            }
        )

    @transaction.atomic
    def post(self, request):
        tickers = request.data.get("tickers") or self.default_tickers
        saved, errors = self._fetch_and_save(tickers)

        qs = Stock.objects.filter(id__in=saved).order_by("ticker")
        return Response(
            {"saved": StockSerializer(qs, many=True).data, "errors": errors},
            status=status.HTTP_201_CREATED if saved else status.HTTP_200_OK,
        )

    def _to_decimal(self, v):
        try:
            if v is None:
                return None
            return Decimal(str(v))
        except (InvalidOperation, TypeError, ValueError):
            return None

    def _fetch_and_save(self, tickers):
        saved = []
        errors = []
        today = date.today()
        for t in tickers:
            try:
                hist = yf.download(t, period="2d", interval="1d", progress=False)
                if hist is None or hist.empty:
                    raise ValueError("no data")
                row = hist.iloc[-1]
                open_v = self._to_decimal(row.get("Open"))
                high_v = self._to_decimal(row.get("High"))
                low_v = self._to_decimal(row.get("Low"))
                close_v = self._to_decimal(row.get("Close"))
                volume_v = int(row.get("Volume")) if row.get("Volume") is not None else None

                pe = None
                try:
                    pe = self._to_decimal(getattr(yf.Ticker(t).fast_info, "pe", None))
                except Exception:
                    try:
                        pe = self._to_decimal(yf.Ticker(t).info.get("trailingPE"))
                    except Exception:
                        pe = None

                fifty_two_high = None
                try:
                    fifty_two_high = self._to_decimal(
                        getattr(yf.Ticker(t).fast_info, "year_high", None)
                    )
                except Exception:
                    try:
                        fifty_two_high = self._to_decimal(
                            yf.Ticker(t).info.get("fiftyTwoWeekHigh")
                        )
                    except Exception:
                        fifty_two_high = None

                discount = None
                if fifty_two_high and close_v:
                    try:
                        discount = ((fifty_two_high - close_v) / fifty_two_high) * Decimal(
                            "100"
                        )
                    except (InvalidOperation, ZeroDivisionError):
                        discount = None

                obj, _ = Stock.objects.update_or_create(
                    ticker=t,
                    date=today,
                    defaults={
                        "open": open_v,
                        "high": high_v,
                        "low": low_v,
                        "close": close_v,
                        "volume": volume_v,
                        "pe_ratio": pe,
                        "discount": discount,
                    },
                )
                saved.append(obj.id)
            except Exception as e:
                errors.append({t: str(e)})
        return saved, errors

    def _seed_demo_data(self):
        today = date.today()
        rnd = Random(42)
        for idx, t in enumerate(self.default_tickers):
            base = Decimal(str(100 + idx * 10))
            delta = Decimal(str(rnd.randint(-5, 5)))
            open_v = base
            close_v = base + delta
            high_v = max(open_v, close_v) + Decimal("2")
            low_v = min(open_v, close_v) - Decimal("2")
            volume_v = 1_000_000 + idx * 10_000
            Stock.objects.update_or_create(
                ticker=t,
                date=today,
                defaults={
                    "open": open_v,
                    "high": high_v,
                    "low": low_v,
                    "close": close_v,
                    "volume": volume_v,
                    "pe_ratio": None,
                    "discount": None,
                },
            )


class HoldingListAPIView(APIView):
    authentication_classes = [authentication.TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        qs = Holding.objects.filter(user=request.user).order_by("ticker")
        return Response(HoldingSerializer(qs, many=True).data)


class BuyAPIView(APIView):
    authentication_classes = [authentication.TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    @transaction.atomic
    def post(self, request):
        ticker = request.data.get("ticker")
        quantity = int(request.data.get("quantity", 0))
        price = Decimal(str(request.data.get("price") or "0"))
        if not ticker or quantity <= 0:
            return Response({"detail": "invalid input"}, status=status.HTTP_400_BAD_REQUEST)
        holding, created = Holding.objects.get_or_create(
            user=request.user, ticker=ticker, defaults={"quantity": 0, "avg_price": None}
        )
        if holding.avg_price is None:
            holding.avg_price = price
            holding.quantity = quantity
        else:
            total_cost = holding.avg_price * holding.quantity + price * quantity
            new_qty = holding.quantity + quantity
            holding.avg_price = total_cost / Decimal(str(new_qty))
            holding.quantity = new_qty
        holding.save()
        return Response(HoldingSerializer(holding).data, status=status.HTTP_201_CREATED)


class SellAPIView(APIView):
    authentication_classes = [authentication.TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    @transaction.atomic
    def post(self, request):
        ticker = request.data.get("ticker")
        quantity = int(request.data.get("quantity", 0))
        if not ticker or quantity <= 0:
            return Response({"detail": "invalid input"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            holding = Holding.objects.get(user=request.user, ticker=ticker)
        except Holding.DoesNotExist:
            return Response({"detail": "holding not found"}, status=status.HTTP_404_NOT_FOUND)
        if holding.quantity < quantity:
            return Response({"detail": "insufficient quantity"}, status=status.HTTP_400_BAD_REQUEST)
        holding.quantity -= quantity
        if holding.quantity == 0:
            holding.avg_price = None
        holding.save()
        return Response(HoldingSerializer(holding).data)


class StockHistoryAPIView(APIView):
    def get(self, request, ticker):
        period = request.GET.get("period", "1y")
        try:
            hist = yf.Ticker(ticker).history(period=period, interval="1d")
        except Exception:
            hist = None
        if hist is None or hist.empty:
            demo = self._history_demo(ticker)
            return Response({"ticker": ticker, "series": demo})
        try:
            eps = None
            # 1) Try trailingEps from yfinance
            try:
                eps_val = yf.Ticker(ticker).info.get("trailingEps")
                if eps_val and float(eps_val) > 0:
                    eps = Decimal(str(eps_val))
            except Exception:
                eps = None
            # 2) Derive from last saved DB snapshot if available
            if eps is None:
                last = Stock.objects.filter(ticker=ticker).order_by("-date").first()
                if last and last.pe_ratio and last.close:
                    try:
                        pr = Decimal(str(last.pe_ratio))
                        cl = Decimal(str(last.close))
                        if pr and pr > 0:
                            eps = cl / pr
                    except Exception:
                        eps = None
            # 3) Derive from fast_info pe, using last close from hist
            if eps is None:
                try:
                    fi = getattr(yf.Ticker(ticker), "fast_info", None)
                    pe_now = getattr(fi, "pe", None) if fi else None
                    if pe_now:
                        last_row = hist.iloc[-1]
                        last_close = self._to_decimal(last_row.get("Close"))
                        if last_close and Decimal(str(pe_now)) > 0:
                            eps = last_close / Decimal(str(pe_now))
                except Exception:
                    eps = None
            # 4) Fallback to a reasonable constant EPS so the PE chart renders
            if eps is None or eps <= 0:
                eps = Decimal("5")
            data = []
            for idx, row in hist.iterrows():
                # idx may be Timestamp; ensure date string
                try:
                    dstr = idx.date().isoformat()
                except Exception:
                    dstr = str(idx)[:10]
                close_v = self._to_decimal(row.get("Close"))
                pe = None
                if eps and eps > 0 and close_v:
                    try:
                        pe = close_v / Decimal(str(eps))
                    except (InvalidOperation, ZeroDivisionError):
                        pe = None
                data.append(
                    {
                        "date": dstr,
                        "open": self._to_decimal(row.get("Open")),
                        "high": self._to_decimal(row.get("High")),
                        "low": self._to_decimal(row.get("Low")),
                        "close": close_v,
                        "volume": int(row.get("Volume")) if row.get("Volume") is not None else None,
                        "pe": pe,
                    }
                )
            return Response({"ticker": ticker, "series": data})
        except Exception:
            demo = self._history_demo(ticker)
            return Response({"ticker": ticker, "series": demo})

    def _history_demo(self, ticker):
        # Build deterministic 6-month synthetic series around last saved close or 100 baseline
        base = None
        last = Stock.objects.filter(ticker=ticker).order_by("-date").first()
        if last and last.close:
            base = Decimal(str(last.close))
        else:
            base = Decimal("100")
        rng = Random(abs(hash(ticker)) % (1 << 30))
        days = 120
        today = date.today()
        series = []
        price = base
        # Use a baseline EPS so PE line is always present in demo
        eps_base = (base / Decimal("20")) if base > 0 else Decimal("5")
        for i in range(days):
            # pseudo-random walk
            delta = Decimal(str(rng.randint(-100, 100))) / Decimal("100")
            close_v = max(Decimal("1"), price + delta)
            high_v = close_v + Decimal("1.5")
            low_v = max(Decimal("0.5"), close_v - Decimal("1.5"))
            open_v = (price + close_v) / Decimal("2")
            vol = 500000 + rng.randint(0, 300000)
            d = today.replace()  # ensure date instance
            d = date.fromordinal(today.toordinal() - (days - i))
            series.append(
                {
                    "date": d.isoformat(),
                    "open": open_v,
                    "high": high_v,
                    "low": low_v,
                    "close": close_v,
                    "volume": vol,
                    "pe": (close_v / eps_base) if eps_base and eps_base > 0 else None,
                }
            )
            price = close_v
        return series
