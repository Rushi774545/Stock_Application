# StockMap

Modern stocks dashboard with a Django REST API backend and a Vite + React frontend. It supports token‑based authentication, portfolio holdings, stocks snapshotting, historical charts (price + PE), and a polished dark UI with 3D/animated effects.


## Tech Stack

- Backend
  - Django 5 + Django REST Framework
  - Token Authentication (rest_framework.authtoken)
  - CORS (django-cors-headers)
  - yfinance (with pandas/numpy) for market data
- Frontend
  - Vite + React
  - Material UI (MUI) for styling and theming
  - Chart.js + react-chartjs-2 for charts
  - React Router for routing
  - Axios for HTTP
  - framer-motion for transitions


## Project Structure

```
StockMap/
├─ Stock/
│  ├─ Stock/                     # Django project settings/urls
│  ├─ accounts/                  # Token auth + unique ID profile
│  ├─ portfolio/                 # Stocks, holdings, APIs
│  └─ frontend/                  # Vite + React app
└─ README.md
```

- Key backend files
  - Settings: [Stock/settings.py](file:///r:/Intern%20Biz/StockMap/Stock/Stock/settings.py)
  - Root URLs: [Stock/urls.py](file:///r:/Intern%20Biz/StockMap/Stock/Stock/urls.py)
  - Accounts (auth): [accounts/serializers.py](file:///r:/Intern%20Biz/StockMap/Stock/accounts/serializers.py), [accounts/views.py](file:///r:/Intern%20Biz/StockMap/Stock/accounts/views.py), [accounts/urls.py](file:///r:/Intern%20Biz/StockMap/Stock/accounts/urls.py)
  - Portfolio APIs: [portfolio/views.py](file:///r:/Intern%20Biz/StockMap/Stock/portfolio/views.py), [portfolio/serializers.py](file:///r:/Intern%20Biz/StockMap/Stock/portfolio/serializers.py), [portfolio/models.py](file:///r:/Intern%20Biz/StockMap/Stock/portfolio/models.py), [portfolio/urls.py](file:///r:/Intern%20Biz/StockMap/Stock/portfolio/urls.py)
- Key frontend files
  - App/UI: [frontend/src/App.jsx](file:///r:/Intern%20Biz/StockMap/Stock/frontend/src/App.jsx)
  - Entry: [frontend/src/main.jsx](file:///r:/Intern%20Biz/StockMap/Stock/frontend/src/main.jsx)
  - Theme: [frontend/src/theme.js](file:///r:/Intern%20Biz/StockMap/Stock/frontend/src/theme.js)
  - Styles: [frontend/src/index.css](file:///r:/Intern%20Biz/StockMap/Stock/frontend/src/index.css)

### New: Stock Analysis Page

- Route: `/stock-analysis`
- Dark, interactive chart that shows historical series and a forecast continuation in a distinct color and dashed style
- Controls:
  - Predictive Asset: NIFTY 50 (`^NSEI`), SENSEX (`^BSESN`), GOLD (`GC=F`), SILVER (`SI=F`), `BTC-USD`
  - Index + Stock (from Index): pick a ticker from NIFTY50 or SENSEX30 lists
  - Intelligence Model: ARIMA, Linear Regression, RNN‑like, CNN‑like
  - Range Type: Hourly / Monthly / Yearly
  - Time Range:
    - Hourly: 24h, 48h, 7d
    - Monthly: 6mo, 1y, 3y, 5y
    - Yearly: 1y, 2y, 3y, 5y, 10y
  - Prediction Horizon per range type (e.g., next 12h, next 6 months, next 5 years)
- Forecasts are “wavy” by design: a light cyclic component is added to trend projections to follow recent rhythms.


## Installation

### Prerequisites

- Python 3.10+ with pip
- Node.js 18+ (tested with Node 22) and npm

### Backend (Django API)

From repository root:

```
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers yfinance pandas numpy
```

The project uses Django’s built-in token auth (rest_framework.authtoken). Migrations will create the required tables.

Run migrations:

```
python Stock/manage.py migrate
```

Start server (this project uses port 8001 for the API):

```
python Stock/manage.py runserver 0.0.0.0:8001
```

Notes
- CORS is allowed for development via django-cors-headers.
- Frontend targets `http://localhost:8001/api` by default. To override, set `VITE_API_URL` before starting the dev server.

### Frontend (Vite + React)

From repository root:

```
cd Stock/frontend
npm install
```

Dependencies include Material UI, react-router-dom, axios, chart.js, react-chartjs-2, and framer-motion.

Run dev server:

```
npm run dev
```

Open the app at the printed local URL (commonly http://localhost:5173 or the next free port).

### Config

- To point the frontend at a different API:

```
# PowerShell
$env:VITE_API_URL="http://localhost:8001/api"
npm run dev
```


## Running the App

1) Start the API on port 8001:

```
python Stock/manage.py runserver 0.0.0.0:8001
```

2) Start the frontend:

```
cd Stock/frontend
npm run dev
```

3) Visit the frontend URL. Register a new user, log in, open Stocks, click a ticker to view charts, and try Buy/Sell. Portfolio shows your holdings.


## API Overview

Base URL: `http://localhost:8001/api/`

Auth
- POST `/auth/register/` → create user, returns { id, username, unique_id, token }
- POST `/auth/login/` → returns { id, username, unique_id, token }

Stocks
- GET `/stocks/?page=1&page_size=20&search=AAPL` → paginated stocks
- POST `/stocks/` → refresh default tickers; returns { saved, errors }
- GET `/stocks/<ticker>/history/?period=6mo` → OHLC, volume, PE series (fallback demo data if live data unavailable)
- GET `/stocks/index/?name=nifty50|sensex|gold|silver|commodities` → index constituents or commodity set

Holdings (auth required: `Authorization: Token <token>`)
- GET `/holdings/` → list user holdings
- POST `/holdings/buy/` with JSON `{ ticker, quantity, price }`
- POST `/holdings/sell/` with JSON `{ ticker, quantity }`

Stock Analysis
- GET `/analysis/forecast/` → returns historical series + forecast
  - Query params:
    - `ticker` (e.g., `RELIANCE.NS`, `^NSEI`, `GC=F`, `BTC-USD`)
    - `scale` = `hourly|monthly|yearly`
    - `history` by scale:
      - hourly: `24h|48h|7d`
      - monthly: `6mo|1y|3y|5y`
      - yearly: `1y|2y|3y|5y|10y`
    - `model` = `arima|linear|rnn|cnn`
    - `horizon` = integer steps ahead (hours, months, or years)


## Frontend Features

- Auth flow with persistent token in localStorage
- Protected routes (Portfolio requires login)
- Stocks table with server‑side pagination and search
- “Refresh 10 Stocks” triggers backend snapshot
- Stock detail with two charts: Close and PE
- Dark theme with glass cards, glow, tilt‑on‑hover, and animated route transitions
- Portfolio analytics with weighted value time series (1y/1mo/1h), per‑stock chart with forecast, and a portfolio‑level recommendation
- Stock Analysis page with model selection, index‑based stock picker, and wavy price forecast


## Data & Fallbacks

- Live data: yfinance powers snapshots and history when network allows
- Seeding:
  - If the Stock table is empty, the GET `/stocks/` auto‑populates
  - If live history fails, the history endpoint returns a deterministic synthetic series so charts always render


## Troubleshooting

- Blank screen with “useLocation may be used only in the context of a Router”
  - Ensure the Router wraps App at entry (see frontend/src/main.jsx). This repo already does so.
- 404 on `/api/auth/register/`
  - Make sure the API server you’re hitting is this project’s Django instance on the correct port (default: 8001). Adjust `axios.defaults.baseURL` if needed.
- No stocks in table
  - First GET seeds the table if empty; if network is blocked, demo data is generated so the grid is never empty.
- History chart 500
  - The endpoint now returns safe demo data if live history is unavailable; refresh and try again.
- Forecast looks flat
  - Switch models or ensure sufficient recent history; forecasts include a cyclic overlay to produce a trajectory similar to recent movements.


## Notes

- Security: never commit secrets. Token auth is used for simple session handling.
- Performance: (ticker, date) index is added on Stock for fast filtering/sorting. Server‑side pagination keeps payloads small.
- Styling: global dark theme, MUI components, Chart.js dark options, and framer‑motion transitions for a modern look.


## Next Ideas

- Sorting and advanced filters server‑side (e.g., PE ranges, volume thresholds)
- Theme toggle and reduced‑motion preference
- Watchlists and alerts
