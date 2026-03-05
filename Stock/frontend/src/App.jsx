import './App.css'
import { Routes, Route, Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Line, Scatter, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip,
  Filler
} from 'chart.js'
import { AppBar, Toolbar, Button, Container, TextField, Box, Typography, Paper, ThemeProvider, CssBaseline } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import theme from './theme'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { useRef } from 'react'
import { Component } from 'react'

import { BarElement } from 'chart.js'
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip, BarElement, Filler)

axios.defaults.baseURL = (import.meta.env?.VITE_API_URL) || 'http://localhost:8001/api'

function useAuth() {
  const [user, setUser] = useState(null)
  useEffect(() => {
    const u = localStorage.getItem('user')
    if (u) setUser(JSON.parse(u))
  }, [])
  const login = (payload) => {
    localStorage.setItem('user', JSON.stringify(payload))
    axios.defaults.headers.common['Authorization'] = `Token ${payload.token}`
    setUser(payload)
  }
  const logout = () => {
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }
  useEffect(() => {
    const u = localStorage.getItem('user')
    if (u) {
      const parsed = JSON.parse(u)
      axios.defaults.headers.common['Authorization'] = `Token ${parsed.token}`
    }
  }, [])
  return { user, login, logout }
}

async function postWithFallback(paths, payload) {
  let lastErr
  for (const p of paths) {
    try {
      const res = await axios.post(p, payload)
      return res
    } catch (e) {
      if (e?.response?.status !== 404) throw e
      lastErr = e
    }
  }
  throw lastErr
}

function Nav({ user, onLogout }) {
  return (
    <AppBar position="sticky" color="primary">
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6">StockMap</Typography>
        <Box>
          <Button component={Link} to="/" color="inherit">Home</Button>
          <Button component={Link} to="/stocks" color="inherit">Stocks</Button>
          <Button component={Link} to="/portfolio" color="inherit">Portfolio</Button>
          <Button component={Link} to="/stock-analysis" color="inherit">Stock Analysis</Button>
        </Box>
        <Box>
          {!user ? (
            <>
              <Button component={Link} to="/login" color="inherit">Login</Button>
              <Button component={Link} to="/register" variant="outlined" color="inherit" sx={{ ml: 1 }}>Register</Button>
            </>
          ) : (
            <Button onClick={onLogout} variant="contained" color="secondary">Logout</Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <TiltPaper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Failed to render</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>A component crashed while rendering.</Typography>
          <Button variant="contained" onClick={()=>this.setState({ hasError: false, error: null })}>Retry</Button>
        </TiltPaper>
      )
    }
    return this.props.children
  }
}

function MotionPage({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

function TiltPaper({ children, className, sx }) {
  const ref = useRef(null)
  const handleMove = (e) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    const rotY = (x - 0.5) * 10
    const rotX = (0.5 - y) * 10
    el.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg)`
  }
  const handleLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)'
  }
  return (
    <Paper
      ref={ref}
      className={className ? `${className} elevate-3d glow` : 'elevate-3d glow'}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      sx={{ transformStyle: 'preserve-3d', transition: 'transform 150ms ease', ...sx }}
    >
      {children}
    </Paper>
  )
}

function Home({ user }) {
  return (
    <MotionPage>
      <Container sx={{ mt: 6, mb: 6 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" sx={{ fontWeight: 700, letterSpacing: 0.5, mb: 1 }}>StockMap</Typography>
          <Typography variant="h5" sx={{ color: 'text.secondary', mb: 3 }}>Analyze markets, build portfolios, and uncover opportunities</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button component={Link} to="/stocks" variant="contained" color="primary">Explore Stocks</Button>
            <Button component={Link} to="/portfolio" variant="outlined">View Portfolio</Button>
            {!user && <Button component={Link} to="/login" variant="text">Get Started</Button>}
          </Box>
        </Box>

        {user && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 6 }}>
            <TiltPaper sx={{ p: 2, maxWidth: 480, width: '100%', textAlign: 'left' }}>
              <Typography variant="subtitle1" sx={{ mb: 0.5 }}>Welcome back</Typography>
              <Typography variant="h6">{user.username}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>ID: {user.unique_id}</Typography>
            </TiltPaper>
          </Box>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 3 }}>
          <TiltPaper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Live Indian Indices</Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>Browse NIFTY50 and SENSEX constituents with price, change %, PE, market cap, and more.</Typography>
            <Button component={Link} to="/stocks" variant="contained" size="small">View Live Table</Button>
          </TiltPaper>
          <TiltPaper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Smart Analytics</Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>Compare close, PE, and volume. See MA20, volatility, opportunity score, and discount charts.</Typography>
            <Button component={Link} to="/portfolio" variant="contained" size="small">Open Portfolio Analytics</Button>
          </TiltPaper>
          <TiltPaper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Quick Portfolio Actions</Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>Double‑click stocks to add quickly, auto‑priced from latest data. Manage holdings with ease.</Typography>
            <Button component={Link} to="/portfolio" variant="contained" size="small">Manage Holdings</Button>
          </TiltPaper>
        </Box>

        <Box sx={{ mt: 6 }}>
          <TiltPaper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Get Started in 3 Steps</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2">1. Explore</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Search live stocks and filter by index.</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">2. Add</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Create a portfolio and add holdings with one click.</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">3. Analyze</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Use charts, regression, and clusters to find patterns.</Typography>
              </Box>
            </Box>
          </TiltPaper>
        </Box>
      </Container>
    </MotionPage>
  )
}

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await postWithFallback(
        [`/auth/login/`, `/login/`],
        { username, password }
      )
      onLogin(res.data)
    } catch (err) {
      setError('Invalid credentials')
    }
  }
  return (
    <MotionPage>
      <Container sx={{ mt: 3 }}>
      <Typography variant="h4" gutterBottom>Login</Typography>
      <Box component="form" onSubmit={submit} sx={{ display: 'flex', gap: 2, maxWidth: 500 }}>
        <TextField fullWidth label="Username" value={username} onChange={(e)=>setUsername(e.target.value)} />
        <TextField fullWidth type="password" label="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <Button type="submit" variant="contained">Login</Button>
      </Box>
      {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
      </Container>
    </MotionPage>
  )
}

function Register({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await postWithFallback(
        [`/auth/register/`, `/register/`],
        { username, password }
      )
      onLogin(res.data)
    } catch (err) {
      setError('Registration failed')
    }
  }
  return (
    <MotionPage>
      <Container sx={{ mt: 3 }}>
      <Typography variant="h4" gutterBottom>Register</Typography>
      <Box component="form" onSubmit={submit} sx={{ display: 'flex', gap: 2, maxWidth: 500 }}>
        <TextField fullWidth label="Username" value={username} onChange={(e)=>setUsername(e.target.value)} />
        <TextField fullWidth type="password" label="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <Button type="submit" variant="contained">Register</Button>
      </Box>
      {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
      </Container>
    </MotionPage>
  )
}

function Stocks() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [rowCount, setRowCount] = useState(0)
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState('')
  const [indexName, setIndexName] = useState('db')
  const [portfolios, setPortfolios] = useState([])
  const [selectedPortfolio, setSelectedPortfolio] = useState('')
  const [selectionModel, setSelectionModel] = useState([])
  const [addQty, setAddQty] = useState(1)
  const [stocksError, setStocksError] = useState('')
  const navigate = useNavigate()
  useEffect(() => {
    const u = localStorage.getItem('user')
    if (u) {
      axios.get('/portfolios/').then(res => {
        setPortfolios(res.data)
        if (res.data.length > 0) setSelectedPortfolio(res.data[0].id)
      }).catch(()=>{})
    }
  }, [])
  const fetchList = async (p = page, ps = pageSize, s = search) => {
    setStocksError('')
    try {
      if (indexName === 'db') {
        const res = await axios.get(`/stocks/`, { params: { page: p + 1, page_size: ps, search: s || undefined } })
        setRows(res.data.results || [])
        setRowCount(res.data.total || 0)
      } else {
        const res = await axios.get(`/stocks/index/`, { params: { name: indexName } })
        const filtered = s ? (res.data.results || []).filter(r => r.ticker.toLowerCase().includes(s.toLowerCase()) || (r.name||'').toLowerCase().includes(s.toLowerCase())) : (res.data.results || [])
        setRows(filtered)
        setRowCount(filtered.length)
      }
    } catch (e) {
      setRows([])
      setRowCount(0)
      setStocksError('Failed to load stocks')
    }
  }
  const fetchAndSave = async () => {
    setLoading(true)
    try {
      const r = await axios.post(`/stocks/`, {})
      if ((r.data?.errors || []).length) {
        setNotice('Some tickers failed to refresh; showing what is available.')
      } else {
        setNotice('')
      }
      await fetchList(0, pageSize, search)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { fetchList() }, [])
  useEffect(() => { fetchList() }, [page, pageSize, indexName])
  const addToPortfolio = async (row) => {
    if (!selectedPortfolio) return
    try {
      await axios.post(`/holdings/buy/`, { ticker: row.ticker, quantity: 1, portfolio_id: selectedPortfolio })
    } catch {}
  }
  const addSelectedToPortfolio = async () => {
    if (!selectedPortfolio || selectionModel.length === 0) return
    const idFor = (r) => (r.id ? `${r.ticker}-${r.id}` : r.ticker)
    const selectedRows = rows.filter(r => selectionModel.includes(idFor(r)))
    if (selectedRows.length === 0) return
    setLoading(true)
    try {
      await Promise.all(selectedRows.map(r => axios.post(`/holdings/buy/`, { ticker: r.ticker, quantity: addQty || 1, portfolio_id: selectedPortfolio })))
      setNotice(`Added ${selectedRows.length} ${selectedRows.length === 1 ? 'stock' : 'stocks'} to portfolio`)
    } catch {
      setNotice('Failed to add some selected stocks')
    } finally {
      setLoading(false)
    }
  }
  return (
    <MotionPage>
      <Container sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h4" sx={{ flex: 1 }}>Stocks</Typography>
        <TextField select size="small" label="Index" value={indexName} onChange={(e)=>{ setIndexName(e.target.value); setPage(0) }} SelectProps={{ native: true }}>
          <option value="db">All (DB)</option>
          <option value="nifty50">NIFTY50 (Live)</option>
          <option value="sensex">SENSEX (Live)</option>
          <option value="gold">Gold Futures (Live)</option>
          <option value="silver">Silver Futures (Live)</option>
          <option value="commodities">Gold & Silver (Live)</option>
        </TextField>
        <TextField size="small" label="Search ticker" value={search} onChange={(e)=>setSearch(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter'){ setPage(0); fetchList(0, pageSize, e.target.value) }}} />
        <Button onClick={()=>{ setPage(0); fetchList(0, pageSize, search) }} variant="outlined">Search</Button>
        <Button onClick={fetchAndSave} disabled={loading} variant="contained">{loading ? 'Loading...' : 'Refresh 10 Stocks'}</Button>
      </Box>
      {notice && <Typography sx={{ mb: 1 }}>{notice}</Typography>}
      {stocksError && <Typography color="error" sx={{ mb: 1 }}>{stocksError}</Typography>}
      <ErrorBoundary>
        <TiltPaper sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={rows}
          columns={indexName === 'db' ? [
            { field: 'ticker', headerName: 'Ticker', flex: 1 },
            { field: 'open', headerName: 'Open', flex: 1, type: 'number' },
            { field: 'high', headerName: 'High', flex: 1, type: 'number' },
            { field: 'low', headerName: 'Low', flex: 1, type: 'number' },
            {
              field: 'close',
              headerName: 'Close',
              flex: 1,
              type: 'number',
              renderCell: (p) => {
                const open = Number(p.row.open)
                const close = Number(p.row.close)
                const up = isFinite(open) && isFinite(close) ? close >= open : false
                const color = up ? '#22c55e' : '#ef4444'
                const glow = up ? '0 0 10px rgba(34,197,94,0.35)' : '0 0 10px rgba(239,68,68,0.35)'
                return <span style={{ color, fontWeight: 600, textShadow: glow }}>{p.value}</span>
              },
            },
            { field: 'volume', headerName: 'Vol', flex: 1, type: 'number' },
            { field: 'pe_ratio', headerName: 'PE', flex: 1, type: 'number' },
            { field: 'discount', headerName: 'Disc %', flex: 1, type: 'number' },
          ] : [
            { field: 'ticker', headerName: 'Ticker', flex: 0.8 },
            { field: 'name', headerName: 'Name', flex: 1.2 },
            { field: 'last', headerName: 'Price', flex: 0.8, type: 'number' },
            { field: 'change_percent', headerName: 'Chg %', flex: 0.6, type: 'number',
              renderCell: (p) => {
                const v = Number(p.row.change_percent)
                const up = isFinite(v) ? v >= 0 : false
                const color = up ? '#22c55e' : '#ef4444'
                return <span style={{ color, fontWeight: 600 }}>{isFinite(v) ? v.toFixed(2) : '-'}</span>
              }
            },
            { field: 'open', headerName: 'Open', flex: 0.7, type: 'number' },
            { field: 'high', headerName: 'High', flex: 0.7, type: 'number' },
            { field: 'low', headerName: 'Low', flex: 0.7, type: 'number' },
            { field: 'volume', headerName: 'Vol', flex: 0.9, type: 'number' },
            { field: 'pe', headerName: 'PE', flex: 0.7, type: 'number' },
            { field: 'year_high', headerName: '52W High', flex: 0.8, type: 'number' },
            { field: 'year_low', headerName: '52W Low', flex: 0.8, type: 'number' },
            { field: 'market_cap', headerName: 'Mkt Cap', flex: 1, type: 'number' },
            { field: 'discount', headerName: 'Disc %', flex: 0.7, type: 'number' },
          ]}
          sx={{
            color: 'text.primary',
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(6px)',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'rgba(124,58,237,0.12)',
            },
          }}
          paginationMode={indexName === 'db' ? 'server' : 'client'}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(m)=>{ setPage(m.page); setPageSize(m.pageSize) }}
          rowCount={rowCount}
          pageSizeOptions={[10,20,50,100]}
          onRowClick={(p)=>navigate(`/stock/${p.row.ticker}`)}
          onRowDoubleClick={(p)=>addToPortfolio(p.row)}
          disableRowSelectionOnClick={false}
          getRowId={(r)=> r.id ? `${r.ticker}-${r.id}` : r.ticker}
          checkboxSelection
          onRowSelectionModelChange={(m)=>setSelectionModel(m)}
          hideFooter
          hideFooterSelectedRowCount
          slots={portfolios.length ? {
            toolbar: () => (
              <Box sx={{ display: 'flex', gap: 2, p: 1 }}>
                <TextField select size="small" label="Portfolio" value={selectedPortfolio} onChange={(e)=>setSelectedPortfolio(e.target.value)} SelectProps={{ native: true }}>
                  {portfolios.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </TextField>
                <TextField
                  size="small"
                  type="number"
                  label="Quantity"
                  value={addQty}
                  onChange={(e)=>setAddQty(parseInt(e.target.value || '1'))}
                  sx={{ width: 120 }}
                />
                <Button variant="contained" size="small" disabled={!selectionModel.length || !selectedPortfolio || loading} onClick={addSelectedToPortfolio}>
                  {loading ? 'Adding...' : `Add Selected (${selectionModel.length})`}
                </Button>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Tip: Double‑click row to add 1 quickly</Typography>
              </Box>
            )
          } : undefined}
          columnVisibilityModel={indexName === 'db' ? undefined : undefined}
            initialState={indexName === 'db' ? undefined : { pagination: { paginationModel: { pageSize } } }}
            getRowHeight={()=>48}
          />
        </TiltPaper>
      </ErrorBoundary>
      {portfolios.length > 0 && indexName !== 'db' && (
        <Typography sx={{ mt: 1 }}>Tip: Double‑click a row to quickly add 1 share to the selected portfolio.</Typography>
      )}
      </Container>
    </MotionPage>
  )
}

function StockDetail({ ticker, user }) {
  const [series, setSeries] = useState([])
  const [qty, setQty] = useState(1)
  const [msg, setMsg] = useState('')
  const [portfolios, setPortfolios] = useState([])
  const [selectedPortfolio, setSelectedPortfolio] = useState('')

  useEffect(()=>{
    const load = async () => {
      const res = await axios.get(`/stocks/${ticker}/history/`, { params: { period: '6mo' } })
      setSeries(res.data.series)
    }
    load()
  },[ticker])

  useEffect(() => {
    if (user) {
      axios.get('/portfolios/').then(res => {
        setPortfolios(res.data)
        if (res.data.length > 0) setSelectedPortfolio(res.data[0].id)
      })
    }
  }, [user])

  const lineData = (label, data) => ({
    labels: data.map(d=>d.date),
    datasets: [{
      label,
      data: data.map(d=>d.close != null ? Number(d.close) : null),
      borderColor: '#7c3aed',
      backgroundColor: 'rgba(124,58,237,0.2)',
      fill: true,
      tension: 0.3,
      pointRadius: 0,
    }]
  })
  const peData = (data) => ({
    labels: data.map(d=>d.date),
    datasets: [{
      label: 'PE',
      data: data.map(d=>d.pe != null ? Number(d.pe) : null),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16,185,129,0.2)',
      fill: true,
      tension: 0.3,
      pointRadius: 0,
    }]
  })
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#e5e7eb' } } },
    scales: {
      x: { ticks: { color: '#a5b4fc' }, grid: { color: 'rgba(255,255,255,0.08)' } },
      y: { ticks: { color: '#a5b4fc' }, grid: { color: 'rgba(255,255,255,0.08)' } },
    },
  }
  const buy = async () => {
    setMsg('')
    if (!selectedPortfolio) return setMsg('Please select a portfolio')
    try {
      await axios.post(`/holdings/buy/`, { ticker, quantity: qty, portfolio_id: selectedPortfolio })
      setMsg('Bought')
    } catch {
      setMsg('Buy failed')
    }
  }
  const sell = async () => {
    setMsg('')
    if (!selectedPortfolio) return setMsg('Please select a portfolio')
    try {
      await axios.post(`/holdings/sell/`, { ticker, quantity: qty, portfolio_id: selectedPortfolio })
      setMsg('Sold')
    } catch {
      setMsg('Sell failed')
    }
  }
  return (
    <MotionPage>
      <Container sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>{ticker}</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <TiltPaper sx={{ p: 2 }}>
          <Box sx={{ height: 420 }}>
            <Line data={lineData('Close', series)} options={chartOptions} />
          </Box>
        </TiltPaper>
        <TiltPaper sx={{ p: 2 }}>
          <Box sx={{ height: 420 }}>
            <Line data={peData(series)} options={chartOptions} />
          </Box>
        </TiltPaper>
      </Box>
      {user ? (
        <Box sx={{ display: 'flex', gap: 2, mt: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField select SelectProps={{ native: true }} label="Portfolio" value={selectedPortfolio} onChange={(e)=>setSelectedPortfolio(e.target.value)}>
            {portfolios.length === 0 && <option value="">No portfolio</option>}
            {portfolios.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </TextField>
          <TextField type="number" label="Quantity" value={qty} onChange={(e)=>setQty(parseInt(e.target.value||'1'))} />
          <Button variant="contained" onClick={buy}>Buy</Button>
          <Button variant="outlined" onClick={sell}>Sell</Button>
        </Box>
      ) : (
        <Typography sx={{ mt: 2 }}>Login to trade</Typography>
      )}
      {msg && <Typography sx={{ mt: 1 }}>{msg}</Typography>}
      </Container>
    </MotionPage>
  )
}

function Portfolio() {
  const [portfolios, setPortfolios] = useState([])
  const [selectedPortfolio, setSelectedPortfolio] = useState(null)
  const [rows, setRows] = useState([])
  const [newPortName, setNewPortName] = useState('')
  const [portfoliosError, setPortfoliosError] = useState('')
  const [analytics, setAnalytics] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState('')
  const [period, setPeriod] = useState('6mo')
  const [interval, setInterval] = useState('1d')
  const [analysisMode, setAnalysisMode] = useState('regression')
  const [pair, setPair] = useState('pe_vs_discount')
  const [multiAnalytics, setMultiAnalytics] = useState({ y1: null, m1: null, h1: null })
  const [multiLoading, setMultiLoading] = useState(false)
  const [multiError, setMultiError] = useState('')
  const [selectedTickerTS, setSelectedTickerTS] = useState(null)
  const [chartToggles, setChartToggles] = useState({
    close: true,
    peBar: true,
    volume: true,
    opportunity: true,
    priceBar: true,
    discount: true,
    ma: true,
    vol: true,
    regression: true,
    weighted: true,
    goldSilver: true,
    pca: true,
    series1y: true,
    series1mo: true,
    series1h: true,
  })
  const toggleChart = (k) => setChartToggles((prev) => ({ ...prev, [k]: !prev[k] }))

  const loadPortfolios = async (selectId = null) => {
    try {
      setPortfoliosError('')
      const res = await axios.get(`/portfolios/`)
      setPortfolios(res.data)
      if (res.data.length > 0) {
        if (selectId) setSelectedPortfolio(selectId)
        else if (!selectedPortfolio) setSelectedPortfolio(res.data[0].id)
      }
    } catch (e) {
      setPortfoliosError('Cannot reach API. Ensure backend is running on configured URL.')
      setPortfolios([])
      setSelectedPortfolio(null)
    }
  }

  useEffect(() => {
    loadPortfolios()
  }, [])

  useEffect(()=>{
    const loadHoldings = async () => {
      if (!selectedPortfolio) {
        setRows([])
        setAnalytics(null)
        setMultiAnalytics({ y1: null, m1: null, h1: null })
        return
      }
      const res = await axios.get(`/holdings/`, { params: { portfolio_id: selectedPortfolio } })
      setRows(res.data)
      try {
        setAnalyticsLoading(true)
        setAnalyticsError('')
        const a = await axios.get(`/portfolios/${selectedPortfolio}/analytics/`, { params: { period, interval } })
        setAnalytics(a.data)
        if (!selectedTickerTS && a?.data?.tickers && a.data.tickers.length > 0) {
          setSelectedTickerTS(a.data.tickers[0])
        }
      } catch (e) {
        setAnalytics(null)
        setAnalyticsError('Analytics failed to load')
      } finally {
        setAnalyticsLoading(false)
      }
      try {
        setMultiLoading(true)
        setMultiError('')
        const [ay, am, ah] = await Promise.all([
          axios.get(`/portfolios/${selectedPortfolio}/analytics/`, { params: { period: '1y', interval: '1d' } }),
          axios.get(`/portfolios/${selectedPortfolio}/analytics/`, { params: { period: '1mo', interval: '1d' } }),
          axios.get(`/portfolios/${selectedPortfolio}/analytics/`, { params: { period: '1d', interval: '1m' } }),
        ])
        setMultiAnalytics({ y1: ay.data, m1: am.data, h1: ah.data })
      } catch (e) {
        setMultiAnalytics({ y1: null, m1: null, h1: null })
        setMultiError('Time series failed to load')
      } finally {
        setMultiLoading(false)
      }
    }
    loadHoldings()
  },[selectedPortfolio, period, interval])

  const createPortfolio = async () => {
    if (!newPortName) return
    const res = await axios.post('/portfolios/', { name: newPortName, number: portfolios.length + 1 })
    setNewPortName('')
    loadPortfolios(res.data.id)
  }

  const makeUnionLabels = (seriesList) => {
    const s = new Set()
    for (const item of seriesList) {
      const arr = item?.series || []
      for (const d of arr) {
        if (d?.date) s.add(d.date)
      }
    }
    return Array.from(s).sort()
  }
  const buildDatasets = (labelKey, seriesList) => {
    if (!seriesList || seriesList.length === 0) return { labels: [], datasets: [] }
    const labels = makeUnionLabels(seriesList)
    const colors = ['#7c3aed','#10b981','#f59e0b','#ef4444','#3b82f6','#14b8a6','#e11d48','#8b5cf6','#22c55e','#f43f5e']
    const datasets = seriesList.map((item, idx) => {
      const map = {}
      for (const d of (item.series || [])) {
        const val = d[labelKey]
        map[d.date] = val != null ? Number(val) : null
      }
      return {
        label: item.ticker,
        data: labels.map(l => map[l] ?? null),
        borderColor: colors[idx % colors.length],
        backgroundColor: `${colors[idx % colors.length]}33`,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
      }
    })
    return { labels, datasets }
  }
  const rollingMeanDatasets = (seriesList, window = 20) => {
    if (!seriesList || seriesList.length === 0) return { labels: [], datasets: [] }
    const labels = makeUnionLabels(seriesList)
    const colors = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#10b981','#8b5cf6','#e11d48','#14b8a6','#7c3aed','#f43f5e']
    const datasets = seriesList.map((item, idx) => {
      const arr = (item.series || []).slice().sort((a,b)=>(a.date>b.date?1:-1))
      const vals = []
      const dates = []
      for (const d of arr) {
        const v = d.close != null ? Number(d.close) : null
        vals.push(v)
        dates.push(d.date)
      }
      const map = {}
      const buf = []
      for (let i=0;i<vals.length;i++){
        const v = vals[i]
        if (v != null) buf.push(v)
        if (buf.length > window) buf.shift()
        const mean = buf.length === window ? buf.reduce((a,b)=>a+b,0)/window : null
        map[dates[i]] = isFinite(mean) ? mean : null
      }
      return {
        label: `${item.ticker} MA${window}`,
        data: labels.map(l => map[l] ?? null),
        borderColor: colors[idx % colors.length],
        backgroundColor: `${colors[idx % colors.length]}33`,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
      }
    })
    return { labels, datasets }
  }
  const rollingStdDatasets = (seriesList, window = 20) => {
    if (!seriesList || seriesList.length === 0) return { labels: [], datasets: [] }
    const labels = makeUnionLabels(seriesList)
    const colors = ['#e11d48','#f59e0b','#3b82f6','#22c55e','#7c3aed','#10b981','#8b5cf6','#14b8a6','#ef4444','#f43f5e']
    const datasets = seriesList.map((item, idx) => {
      const arr = (item.series || []).slice().sort((a,b)=>(a.date>b.date?1:-1))
      const vals = []
      const dates = []
      for (const d of arr) {
        const v = d.close != null ? Number(d.close) : null
        vals.push(v)
        dates.push(d.date)
      }
      const map = {}
      const buf = []
      for (let i=0;i<vals.length;i++){
        const v = vals[i]
        if (v != null) buf.push(v)
        if (buf.length > window) buf.shift()
        if (buf.length === window) {
          const mean = buf.reduce((a,b)=>a+b,0)/window
          const varp = buf.reduce((a,b)=>a + Math.pow(b-mean,2), 0) / window
          const std = Math.sqrt(varp)
          map[dates[i]] = isFinite(std) ? std : null
        } else {
          map[dates[i]] = null
        }
      }
      return {
        label: `${item.ticker} Vol${window}`,
        data: labels.map(l => map[l] ?? null),
        borderColor: colors[idx % colors.length],
        backgroundColor: `${colors[idx % colors.length]}33`,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
      }
    })
    return { labels, datasets }
  }
  const buildPortfolioValueDataset = (seriesList, holdingsRows) => {
    if (!seriesList || seriesList.length === 0 || !holdingsRows || holdingsRows.length === 0) return { labels: [], datasets: [] }
    const qtyMap = {}
    for (const r of holdingsRows) qtyMap[r.ticker] = r.quantity || 0
    const actualLabels = makeUnionLabels(seriesList)
    const forecastLabelsSet = new Set()
    // Build maps for actual and forecast
    const actualMapByTicker = {}
    const forecastMapByTicker = {}
    for (const item of seriesList) {
      const am = {}
      for (const d of (item.series || [])) am[d.date] = d.close != null ? Number(d.close) : null
      actualMapByTicker[item.ticker] = am
      const fm = {}
      for (const d of (item.forecast || [])) {
        fm[d.date] = d.close != null ? Number(d.close) : null
        forecastLabelsSet.add(d.date)
      }
      forecastMapByTicker[item.ticker] = fm
    }
    const forecastLabels = Array.from(forecastLabelsSet).sort()
    const labels = [...actualLabels, ...forecastLabels]
    // Aggregate actual values for actual labels
    const actualValues = labels.map(date => {
      if (forecastLabelsSet.has(date)) return null
      let sum = 0
      let any = false
      for (const t of Object.keys(actualMapByTicker)) {
        const q = qtyMap[t] || 0
        const c = actualMapByTicker[t][date]
        if (q > 0 && c != null) {
          sum += q * c
          any = true
        }
      }
      return any ? sum : null
    })
    // Aggregate forecast values for forecast labels
    const forecastValues = labels.map(date => {
      if (!forecastLabelsSet.has(date)) return null
      let sum = 0
      let any = false
      for (const t of Object.keys(forecastMapByTicker)) {
        const q = qtyMap[t] || 0
        const c = forecastMapByTicker[t][date]
        if (q > 0 && c != null) {
          sum += q * c
          any = true
        }
      }
      return any ? sum : null
    })
    return {
      labels,
      datasets: [
        {
          label: 'Portfolio Value',
          data: actualValues,
          borderColor: '#7c3aed',
          backgroundColor: 'rgba(124,58,237,0.2)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
        },
        {
          label: 'Forecast',
          data: forecastValues,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.15)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderDash: [6, 6],
        }
      ]
    }
  }
  const sliceRecent = (seriesList, minutes) => {
    if (!seriesList || seriesList.length === 0) return []
    let maxTs = 0
    for (const item of seriesList) {
      for (const d of (item.series || [])) {
        const ts = Date.parse(d.date)
        if (isFinite(ts) && ts > maxTs) maxTs = ts
      }
    }
    if (!maxTs) return seriesList
    const cutoff = maxTs - minutes * 60 * 1000
    return seriesList.map(item => ({
      ticker: item.ticker,
      series: (item.series || []).filter(d => {
        const ts = Date.parse(d.date)
        return isFinite(ts) && ts >= cutoff
      })
    }))
  }
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#e5e7eb' } } },
    scales: {
      x: { ticks: { color: '#a5b4fc' }, grid: { color: 'rgba(255,255,255,0.08)' } },
      y: { ticks: { color: '#a5b4fc' }, grid: { color: 'rgba(255,255,255,0.08)' } },
    },
  }
  const fmt = (v) => {
    const n = Number(v)
    return isFinite(n) ? n.toFixed(2) : '-'
  }
  const buildBarFromOpportunity = (analyticsObj, key, label) => {
    if (!analyticsObj || !analyticsObj.opportunity) return { labels: [], datasets: [] }
    const labels = analyticsObj.tickers
    const values = labels.map(t => {
      const v = analyticsObj.opportunity[t]?.[key]
      return v != null ? Number(v) : null
    })
    const colors = ['#7c3aed','#10b981','#f59e0b','#ef4444','#3b82f6','#14b8a6','#e11d48','#8b5cf6','#22c55e','#f43f5e']
    return {
      labels,
      datasets: [{
        label,
        data: values,
        backgroundColor: labels.map((_, idx) => `${colors[idx % colors.length]}99`),
        borderColor: labels.map((_, idx) => colors[idx % colors.length]),
      }]
    }
  }
  const buildBarPE = (seriesList) => {
    if (!seriesList || seriesList.length === 0) return { labels: [], datasets: [] }
    const labels = seriesList.map(item => item.ticker)
    const values = seriesList.map(item => {
      const arr = item.series || []
      let val = null
      for (let i = arr.length - 1; i >= 0; i--) {
        const v = arr[i].pe
        if (v != null) { val = Number(v); break }
      }
      return val
    })
    const colors = ['#7c3aed','#10b981','#f59e0b','#ef4444','#3b82f6','#14b8a6','#e11d48','#8b5cf6','#22c55e','#f43f5e']
    return {
      labels,
      datasets: [{
        label: 'PE',
        data: values,
        backgroundColor: labels.map((_, idx) => `${colors[idx % colors.length]}99`),
        borderColor: labels.map((_, idx) => colors[idx % colors.length]),
      }]
    }
  }
  const buildSingleTickerDataset = (seriesList, ticker) => {
    if (!seriesList || seriesList.length === 0 || !ticker) return { labels: [], datasets: [] }
    const item = seriesList.find(it => it.ticker === ticker)
    if (!item) return { labels: [], datasets: [] }
    const actual = item.series || []
    const forecast = item.forecast || []
    const labelSet = new Set()
    for (const d of actual) if (d?.date) labelSet.add(d.date)
    for (const d of forecast) if (d?.date) labelSet.add(d.date)
    const labels = Array.from(labelSet).sort()
    const actualMap = {}
    for (const d of actual) actualMap[d.date] = d.close != null ? Number(d.close) : null
    const forecastMap = {}
    for (const d of forecast) forecastMap[d.date] = d.close != null ? Number(d.close) : null
    const actualVals = labels.map(l => (forecastMap[l] != null ? null : (actualMap[l] ?? null)))
    const forecastVals = labels.map(l => (forecastMap[l] != null ? forecastMap[l] : null))
    return {
      labels,
      datasets: [
        {
          label: `${ticker} Close`,
          data: actualVals,
          borderColor: '#7c3aed',
          backgroundColor: 'rgba(124,58,237,0.2)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
        },
        {
          label: 'Forecast',
          data: forecastVals,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.15)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderDash: [6, 6],
        }
      ]
    }
  }
  const latestFromSeries = (arr, key) => {
    if (!arr || !arr.length) return null
    for (let i = arr.length - 1; i >= 0; i--) {
      const v = arr[i][key]
      if (v != null) return Number(v)
    }
    return null
  }
  const buildPairPoints = (analyticsObj, pairKey) => {
    if (!analyticsObj || !analyticsObj.data) return []
    const mapItem = {}
    for (const item of analyticsObj.data) mapItem[item.ticker] = item
    const tickers = analyticsObj.tickers || []
    const getVal = (t, k) => {
      if (k === 'pe') return latestFromSeries(mapItem[t]?.series || [], 'pe')
      if (k === 'close') return latestFromSeries(mapItem[t]?.series || [], 'close')
      if (k === 'discount') return analyticsObj.opportunity?.[t]?.discount_pct != null ? Number(analyticsObj.opportunity[t].discount_pct) : null
      if (k === 'score') return analyticsObj.opportunity?.[t]?.score != null ? Number(analyticsObj.opportunity[t].score) : null
      if (k === 'price') return analyticsObj.opportunity?.[t]?.current_price != null ? Number(analyticsObj.opportunity[t].current_price) : null
      return null
    }
    const pairs = {
      'pe_vs_discount': ['pe','discount'],
      'pe_vs_score': ['pe','score'],
      'close_vs_pe': ['close','pe'],
      'close_vs_discount': ['close','discount'],
      'close_vs_score': ['close','score'],
    }
    const [xk, yk] = pairs[pairKey] || pairs['pe_vs_discount']
    const pts = []
    for (const t of tickers) {
      const x = getVal(t, xk)
      const y = getVal(t, yk)
      if (x != null && y != null) pts.push({ x, y, t })
    }
    return pts
  }
  const regressionMetrics = (points) => {
    if (!points.length) return { m: 0, b: 0, r2: 0 }
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0
    for (const p of points) {
      sumX += p.x
      sumY += p.y
      sumXY += p.x * p.y
      sumXX += p.x * p.x
    }
    const n = points.length
    const denom = (n * sumXX - sumX * sumX) || 1
    const m = (n * sumXY - sumX * sumY) / denom
    const b = (sumY - m * sumX) / n
    let ssr = 0, sst = 0
    const meanY = sumY / n
    for (const p of points) {
      const fy = m * p.x + b
      ssr += Math.pow(p.y - fy, 2)
      sst += Math.pow(p.y - meanY, 2)
    }
    const r2 = sst ? Math.max(0, 1 - ssr / sst) : 0
    return { m, b, r2 }
  }
  const bestRegression = (analyticsObj) => {
    const opts = [
      { v: 'pe_vs_discount', label: 'PE vs Discount %' },
      { v: 'pe_vs_score', label: 'PE vs Opportunity Score' },
      { v: 'close_vs_pe', label: 'Close vs PE' },
      { v: 'close_vs_discount', label: 'Close vs Discount %' },
      { v: 'close_vs_score', label: 'Close vs Opportunity Score' },
    ]
    let best = { label: '', r2: 0 }
    for (const o of opts) {
      const pts = buildPairPoints(analyticsObj, o.v)
      if (pts.length >= 2) {
        const { r2 } = regressionMetrics(pts)
        if (r2 > best.r2) best = { label: o.label, r2 }
      }
    }
    return best
  }
  const bestClusterInfo = (clusters, analyticsObj) => {
    if (!clusters || clusters.length === 0) return { idx: 0, avg: 0 }
    let bestIdx = 0
    let bestAvg = -Infinity
    for (let i = 0; i < clusters.length; i++) {
      const cl = clusters[i]
      let sum = 0, n = 0
      for (const p of cl) {
        const s = analyticsObj.opportunity?.[p.t]?.score
        if (s != null) { sum += Number(s); n += 1 }
      }
      const avg = n ? sum / n : 0
      if (avg > bestAvg) { bestAvg = avg; bestIdx = i }
    }
    return { idx: bestIdx, avg: bestAvg }
  }
  const goldSilverPoints = (analyticsObj) => {
    if (!analyticsObj || !analyticsObj.data) return []
    const map = {}
    for (const item of analyticsObj.data) map[item.ticker] = item.series || []
    const g = map['GC=F'] || null
    const s = map['SI=F'] || null
    if (!g || !s) return []
    const gm = {}, sm = {}
    for (const d of g) { if (d.date && d.close != null) gm[d.date] = Number(d.close) }
    for (const d of s) { if (d.date && d.close != null) sm[d.date] = Number(d.close) }
    const dates = Object.keys(gm).filter(d => sm[d] != null).sort()
    const pts = []
    for (const d of dates) pts.push({ x: gm[d], y: sm[d], t: d })
    return pts
  }
  const pearsonR = (points) => {
    if (!points || points.length < 2) return 0
    const xs = points.map(p => p.x)
    const ys = points.map(p => p.y)
    const n = points.length
    const mean = (arr) => arr.reduce((a,b)=>a+b,0)/n
    const mx = mean(xs), my = mean(ys)
    let num = 0, denx = 0, deny = 0
    for (let i=0;i<n;i++){
      const dx = xs[i]-mx, dy = ys[i]-my
      num += dx*dy; denx += dx*dx; deny += dy*dy
    }
    const denom = Math.sqrt(denx*deny) || 1
    return Math.max(-1, Math.min(1, num/denom))
  }
  const pcaFeatures = (analyticsObj) => {
    if (!analyticsObj || !analyticsObj.data) return []
    const out = []
    for (const item of analyticsObj.data) {
      const t = item.ticker
      const arr = (item.series || []).slice().sort((a,b)=>(a.date>b.date?1:-1))
      const closes = arr.map(d => d.close != null ? Number(d.close) : null).filter(v=>v!=null)
      const peLast = latestFromSeries(arr, 'pe')
      const disc = analyticsObj.opportunity?.[t]?.discount_pct != null ? Number(analyticsObj.opportunity[t].discount_pct) : null
      const mean = closes.length ? closes.reduce((a,b)=>a+b,0)/closes.length : null
      let std = null
      if (closes.length) {
        const m = mean
        const varp = closes.reduce((a,b)=>a + Math.pow(b - m, 2), 0) / closes.length
        std = Math.sqrt(varp)
      }
      if (mean != null || std != null || peLast != null || disc != null) {
        out.push({ t, vec: [
          mean != null ? mean : 0,
          std != null ? std : 0,
          peLast != null ? peLast : 0,
          disc != null ? disc : 0,
        ]})
      }
    }
    return out
  }
  const standardize = (rows) => {
    if (!rows.length) return { X: [], mu: [], sigma: [] }
    const F = rows[0].vec.length
    const N = rows.length
    const mu = Array(F).fill(0)
    const sigma = Array(F).fill(0)
    for (let j=0;j<F;j++){
      mu[j] = rows.reduce((acc,r)=>acc + r.vec[j], 0) / N
    }
    for (let j=0;j<F;j++){
      const v = rows.reduce((acc,r)=>acc + Math.pow(r.vec[j] - mu[j], 2), 0) / N
      sigma[j] = Math.sqrt(v) || 1
    }
    const X = rows.map(r => r.vec.map((v,j)=> (v - mu[j]) / sigma[j]))
    return { X, mu, sigma }
  }
  const covariance = (X) => {
    const N = X.length
    if (!N) return []
    const F = X[0].length
    const C = Array(F).fill(0).map(()=>Array(F).fill(0))
    for (let i=0;i<F;i++){
      for (let j=0;j<F;j++){
        let sum = 0
        for (let n=0;n<N;n++) sum += X[n][i] * X[n][j]
        C[i][j] = sum / (N - 1 || 1)
      }
    }
    return C
  }
  const powerIteration = (C, iters = 100) => {
    const F = C.length
    let v = Array(F).fill(0).map((_,i)=> (i===0?1:0))
    const norm = (vec) => Math.sqrt(vec.reduce((a,b)=>a+b*b,0)) || 1
    for (let k=0;k<iters;k++){
      const y = Array(F).fill(0)
      for (let i=0;i<F;i++){
        let sum = 0
        for (let j=0;j<F;j++) sum += C[i][j] * v[j]
        y[i] = sum
      }
      const n = norm(y)
      v = y.map(e => e / n)
    }
    // Rayleigh quotient for eigenvalue
    let num = 0, den = 0
    const Cv = Array(F).fill(0)
    for (let i=0;i<F;i++){
      let sum = 0
      for (let j=0;j<F;j++) sum += C[i][j] * v[j]
      Cv[i] = sum
    }
    for (let i=0;i<F;i++){ num += v[i]*Cv[i]; den += v[i]*v[i] }
    const lambda = den ? num/den : 0
    return { v, lambda }
  }
  const pca2 = (X) => {
    if (!X.length) return { comps: [], scores: [], varExp: [] }
    const C = covariance(X)
    const { v: v1, lambda: l1 } = powerIteration(C, 150)
    // Deflate
    const F = C.length
    const C2 = Array(F).fill(0).map(()=>Array(F).fill(0))
    for (let i=0;i<F;i++){
      for (let j=0;j<F;j++){
        C2[i][j] = C[i][j] - l1 * v1[i] * v1[j]
      }
    }
    const { v: v2, lambda: l2 } = powerIteration(C2, 150)
    const totalVar = C.reduce((acc,row,idx)=> acc + row[idx], 0) || 1
    const varExp = [l1/totalVar, l2/totalVar]
    // Project
    const scores = X.map(row => ({
      pc1: row.reduce((acc,val,i)=>acc + val * v1[i], 0),
      pc2: row.reduce((acc,val,i)=>acc + val * v2[i], 0),
    }))
    return { comps: [v1, v2], scores, varExp }
  }
  const extractPoints = (seriesList, xKey, yKey) => {
    const pts = []
    for (const item of seriesList) {
      for (const d of (item.series || [])) {
        const x = d[xKey]
        const y = d[yKey]
        if (x != null && y != null) {
          pts.push({ x: Number(x), y: Number(y), t: item.ticker })
        }
      }
    }
    return pts
  }
  const linearRegression = (points) => {
    if (!points.length) return { m: 0, b: 0 }
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0
    for (const p of points) {
      sumX += p.x
      sumY += p.y
      sumXY += p.x * p.y
      sumXX += p.x * p.x
    }
    const n = points.length
    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1)
    const b = (sumY - m * sumX) / n
    return { m, b }
  }
  const kMeans = (points, k = 3, iters = 30) => {
    if (!points.length) return { clusters: [], centroids: [] }
    const xs = points.map(p => p.x)
    const ys = points.map(p => p.y)
    const minX = Math.min(...xs), maxX = Math.max(...xs)
    const minY = Math.min(...ys), maxY = Math.max(...ys)
    const norm = (v, min, max) => max === min ? 0 : (v - min) / (max - min)
    const pts = points.map(p => ({ x: norm(p.x, minX, maxX), y: norm(p.y, minY, maxY), raw: p }))
    const centroids = []
    for (let i = 0; i < k; i++) {
      const idx = Math.floor((i + 1) * pts.length / (k + 1))
      centroids.push({ x: pts[idx].x, y: pts[idx].y })
    }
    let assignments = new Array(pts.length).fill(0)
    for (let it = 0; it < iters; it++) {
      for (let i = 0; i < pts.length; i++) {
        let best = 0, bestD = Infinity
        for (let c = 0; c < k; c++) {
          const dx = pts[i].x - centroids[c].x
          const dy = pts[i].y - centroids[c].y
          const d = dx*dx + dy*dy
          if (d < bestD) { bestD = d; best = c }
        }
        assignments[i] = best
      }
      const sums = Array(k).fill(0).map(()=>({ x:0, y:0, n:0 }))
      for (let i = 0; i < pts.length; i++) {
        const a = assignments[i]
        sums[a].x += pts[i].x
        sums[a].y += pts[i].y
        sums[a].n += 1
      }
      for (let c = 0; c < k; c++) {
        if (sums[c].n > 0) {
          centroids[c].x = sums[c].x / sums[c].n
          centroids[c].y = sums[c].y / sums[c].n
        }
      }
    }
    const clusters = Array(k).fill(0).map(()=>[])
    for (let i = 0; i < pts.length; i++) {
      clusters[assignments[i]].push(pts[i].raw)
    }
    return { clusters, centroids }
  }

  return (
    <MotionPage>
      <Container sx={{ mt: 3 }}>
      <Typography variant="h4" gutterBottom>Portfolios</Typography>
      {portfoliosError && <Typography color="error" sx={{ mb: 2 }}>{portfoliosError}</Typography>}

      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <TextField label="New Portfolio Name" size="small" value={newPortName} onChange={(e) => setNewPortName(e.target.value)} />
        <Button variant="contained" onClick={createPortfolio}>Create Portfolio</Button>
      </Box>

      {portfolios.length > 0 ? (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            {portfolios.map(p => (
              <Button 
                key={p.id} 
                variant={selectedPortfolio === p.id ? 'contained' : 'outlined'}
                onClick={() => setSelectedPortfolio(p.id)}
              >
                {p.name}
              </Button>
            ))}
            <TextField
              select
              size="small"
              label="Period"
              value={period}
              onChange={(e)=>setPeriod(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="3mo">3mo</option>
              <option value="6mo">6mo</option>
              <option value="1y">1y</option>
            </TextField>
            <TextField
              select
              size="small"
              label="Interval"
              value={interval}
              onChange={(e)=>setInterval(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="1d">1 Day</option>
              <option value="60m">1 Hour</option>
              <option value="1m">1 Minute</option>
            </TextField>
          </Box>
          {analyticsLoading && <Typography sx={{ mb: 1 }}>Loading analytics…</Typography>}
          {analyticsError && <Typography sx={{ mb: 1 }}>{analyticsError}</Typography>}
          {analytics && analytics.data && analytics.data.length > 0 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              {analytics.recommendation && (
                <TiltPaper sx={{ p: 2, gridColumn: '1 / -1' }}>
                  <Typography variant="h6" gutterBottom>Recommendation</Typography>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>{analytics.recommendation.ticker}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>{analytics.recommendation.summary}</Typography>
                </TiltPaper>
              )}
              {chartToggles.close && (
                <TiltPaper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Close Comparison</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                    Compares closing prices for all tickers in your portfolio over time.
                  </Typography>
                  <Box sx={{ height: 420 }}>
                    <Line data={buildDatasets('close', analytics.data)} options={chartOptions} />
                  </Box>
                </TiltPaper>
              )}
              {chartToggles.goldSilver && analytics.tickers.includes('GC=F') && analytics.tickers.includes('SI=F') && (
                <TiltPaper sx={{ p: 2, gridColumn: '1 / -1' }}>
                  <Typography variant="h6" gutterBottom>Gold vs Silver Correlation</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                    Scatter of Gold vs Silver closes with a best‑fit regression line showing correlation.
                  </Typography>
                  {(() => {
                    const points = goldSilverPoints(analytics)
                    if (!points.length) return <Typography>No data</Typography>
                    const { m, b } = linearRegression(points)
                    const xs = points.map(p => p.x)
                    const minX = Math.min(...xs), maxX = Math.max(...xs)
                    const regLine = [{ x: minX, y: m*minX + b }, { x: maxX, y: m*maxX + b }]
                    const r = pearsonR(points)
                    const datasets = [
                      {
                        label: 'Points',
                        data: points.map(p => ({ x: p.x, y: p.y })),
                        backgroundColor: '#22c55e',
                        borderColor: '#22c55e',
                        showLine: false,
                        pointRadius: 3,
                      },
                      {
                        type: 'line',
                        label: `Regression`,
                        data: regLine,
                        borderColor: '#ef4444',
                        backgroundColor: '#ef444433',
                        tension: 0,
                        pointRadius: 0,
                      }
                    ]
                    const options = {
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { labels: { color: '#e5e7eb' } } },
                      scales: {
                        x: { type: 'linear', ticks: { color: '#a5b4fc' }, grid: { color: 'rgba(255,255,255,0.08)' } },
                        y: { type: 'linear', ticks: { color: '#a5b4fc' }, grid: { color: 'rgba(255,255,255,0.08)' } },
                      },
                    }
                    return (
                      <>
                        <Box sx={{ height: 420 }}>
                          <Scatter data={{ datasets }} options={options} />
                        </Box>
                        <Typography sx={{ mt: 1 }} variant="body2">Pearson r {r.toFixed(2)}</Typography>
                      </>
                    )
                  })()}
                </TiltPaper>
              )}
              {chartToggles.pca && analytics && analytics.data && analytics.data.length > 1 && (
                <TiltPaper sx={{ p: 2, gridColumn: '1 / -1' }}>
                  <Typography variant="h6" gutterBottom>PCA Projection (PC1 vs PC2)</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                    Compresses multiple factors (mean, volatility, PE, discount) to visualize similarity clusters.
                  </Typography>
                  {(() => {
                    const rows = pcaFeatures(analytics)
                    if (!rows.length) return <Typography>No data</Typography>
                    const { X } = standardize(rows)
                    const { scores, varExp } = pca2(X)
                    const datasets = [{
                      label: `PC1 vs PC2 (${(varExp[0]*100).toFixed(1)}% / ${(varExp[1]*100).toFixed(1)}%)`,
                      data: scores.map((s, idx) => ({ x: s.pc1, y: s.pc2 })),
                      backgroundColor: '#8b5cf6',
                      borderColor: '#8b5cf6',
                      showLine: false,
                      pointRadius: 3,
                    }]
                    const options = {
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { labels: { color: '#e5e7eb' } },
                        tooltip: {
                          callbacks: {
                            title: (items) => {
                              const idx = items[0]?.dataIndex ?? 0
                              return rows[idx]?.t ?? ''
                            }
                          }
                        }
                      },
                      scales: {
                        x: { type: 'linear', ticks: { color: '#a5b4fc' }, grid: { color: 'rgba(255,255,255,0.08)' } },
                        y: { type: 'linear', ticks: { color: '#a5b4fc' }, grid: { color: 'rgba(255,255,255,0.08)' } },
                      },
                    }
                    return <Box sx={{ height: 420 }}><Scatter data={{ datasets }} options={options} /></Box>
                  })()}
                </TiltPaper>
              )}
              {chartToggles.peBar && (
              <TiltPaper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>PE Comparison (Bar)</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Bar chart of latest PE for each ticker to compare relative valuation.
                </Typography>
                <Box sx={{ height: 420 }}>
                  <Bar data={buildBarPE(analytics.data)} options={chartOptions} />
                </Box>
              </TiltPaper>
              )}
              {chartToggles.volume && (
              <TiltPaper sx={{ p: 2, gridColumn: '1 / -1' }}>
                <Typography variant="h6" gutterBottom>Volume Comparison</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Shows trading activity trends across holdings via volume over time.
                </Typography>
                <Box sx={{ height: 420 }}>
                  <Line data={buildDatasets('volume', analytics.data)} options={chartOptions} />
                </Box>
              </TiltPaper>
              )}
              {chartToggles.opportunity && (
              <TiltPaper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Opportunity Score</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Combines discount from highs, PE attractiveness, and momentum into a single score.
                </Typography>
                <Box sx={{ height: 420 }}>
                  <Bar data={buildBarFromOpportunity(analytics, 'score', 'Score')} options={chartOptions} />
                </Box>
              </TiltPaper>
              )}
              {chartToggles.priceBar && (
              <TiltPaper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Current Price</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Latest available price for each ticker in your portfolio.
                </Typography>
                <Box sx={{ height: 420 }}>
                  <Bar data={buildBarFromOpportunity(analytics, 'current_price', 'Price')} options={chartOptions} />
                </Box>
              </TiltPaper>
              )}
              {chartToggles.discount && (
              <TiltPaper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Discount %</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Percentage below the 52‑week high (higher indicates more discount from peak).
                </Typography>
                <Box sx={{ height: 420 }}>
                  <Bar data={buildBarFromOpportunity(analytics, 'discount_pct', 'Discount %')} options={chartOptions} />
                </Box>
              </TiltPaper>
              )}
              {chartToggles.ma && (
              <TiltPaper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>MA 20 Comparison</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  20‑day moving average to identify short‑term trend direction across tickers.
                </Typography>
                <Box sx={{ height: 420 }}>
                  <Line data={rollingMeanDatasets(analytics.data, 20)} options={chartOptions} />
                </Box>
              </TiltPaper>
              )}
              {chartToggles.vol && (
              <TiltPaper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Volatility (Std Dev 20)</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  20‑day standard deviation of prices to compare relative volatility.
                </Typography>
                <Box sx={{ height: 420 }}>
                  <Line data={rollingStdDatasets(analytics.data, 20)} options={chartOptions} />
                </Box>
              </TiltPaper>
              )}
              {chartToggles.regression && (
              <Box sx={{ gridColumn: '1 / -1', display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button variant={analysisMode==='regression'?'contained':'outlined'} onClick={()=>setAnalysisMode('regression')}>Regression</Button>
                <Button variant={analysisMode==='clusters'?'contained':'outlined'} onClick={()=>setAnalysisMode('clusters')}>Clusters</Button>
                <TextField select size="small" label="Pair" value={pair} onChange={(e)=>setPair(e.target.value)} SelectProps={{ native: true }}>
                  <option value="pe_vs_discount">PE vs Discount %</option>
                  <option value="pe_vs_score">PE vs Opportunity Score</option>
                  <option value="close_vs_pe">Close vs PE</option>
                  <option value="close_vs_discount">Close vs Discount %</option>
                  <option value="close_vs_score">Close vs Opportunity Score</option>
                </TextField>
                {(() => {
                  const reg = bestRegression(analytics)
                  return <Typography variant="body2">Best regression: {reg.label || '-'} (R² {reg.r2.toFixed(2)})</Typography>
                })()}
              </Box>
              )}
              {chartToggles.regression && (
              <TiltPaper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>{analysisMode==='regression' ? 'Regression' : 'Clusters'}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Visualizes relationships between two metrics; shows best‑fit line or clusters of similar stocks.
                </Typography>
                {(() => {
                  const points = buildPairPoints(analytics, pair)
                  if (!points.length) return <Typography>No data</Typography>
                  if (analysisMode === 'regression') {
                    const { m, b, r2 } = regressionMetrics(points)
                    const xs = points.map(p => p.x)
                    const minX = Math.min(...xs), maxX = Math.max(...xs)
                    const regLine = [{ x: minX, y: m*minX + b }, { x: maxX, y: m*maxX + b }]
                    const datasets = [
                      {
                        label: 'Points',
                        data: points.map(p => ({ x: p.x, y: p.y })),
                        backgroundColor: '#3b82f6',
                        borderColor: '#3b82f6',
                        showLine: false,
                        pointRadius: 3,
                      },
                      {
                        type: 'line',
                        label: `Regression (R² ${r2.toFixed(2)})`,
                        data: regLine,
                        borderColor: '#ef4444',
                        backgroundColor: '#ef444433',
                        tension: 0,
                        pointRadius: 0,
                      }
                    ]
                    const options = {
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { labels: { color: '#e5e7eb' } } },
                      scales: {
                        x: { type: 'linear', ticks: { color: '#a5b4fc' }, grid: { color: 'rgba(255,255,255,0.08)' } },
                        y: { type: 'linear', ticks: { color: '#a5b4fc' }, grid: { color: 'rgba(255,255,255,0.08)' } },
                      },
                    }
                    return <Box sx={{ height: 420 }}><Scatter data={{ datasets }} options={options} /></Box>
                  } else {
                    const { clusters } = kMeans(points, 3, 25)
                    const info = bestClusterInfo(clusters, analytics)
                    const colors = ['#7c3aed','#10b981','#f59e0b']
                    const datasets = clusters.map((cl, idx) => ({
                      label: `Cluster ${idx+1}${idx===info.idx?' (Best)':''}`,
                      data: cl.map(p => ({ x: p.x, y: p.y })),
                      backgroundColor: colors[idx % colors.length],
                      borderColor: colors[idx % colors.length],
                      showLine: false,
                      pointRadius: 3,
                    }))
                    const options = {
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { labels: { color: '#e5e7eb' } } },
                      scales: {
                        x: { type: 'linear', ticks: { color: '#a5b4fc' }, grid: { color: 'rgba(255,255,255,0.08)' } },
                        y: { type: 'linear', ticks: { color: '#a5b4fc' }, grid: { color: 'rgba(255,255,255,0.08)' } },
                      },
                    }
                    return (
                      <>
                        <Box sx={{ height: 420 }}>
                          <Scatter data={{ datasets }} options={options} />
                        </Box>
                        <Typography sx={{ mt: 1 }} variant="body2">Best cluster: {info.idx+1} (Avg Score {info.avg.toFixed(2)})</Typography>
                      </>
                    )
                  }
                })()}
              </TiltPaper>
              )}
              {rows && rows.length > 0 && (
                <TiltPaper sx={{ p: 2, gridColumn: '1 / -1' }}>
                  <Typography variant="h6" gutterBottom>Weighted Portfolio Aggregate</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                    Aggregated portfolio value over time using your current holding quantities.
                  </Typography>
                  <Box sx={{ height: 420 }}>
                    <Line data={buildPortfolioValueDataset(analytics.data, rows)} options={chartOptions} />
                  </Box>
                </TiltPaper>
              )}
              {analytics && analytics.data && analytics.data.length > 0 && (
                <TiltPaper sx={{ p: 2, gridColumn: '1 / -1' }}>
                  <Typography variant="h6" gutterBottom>Per-Stock Time Series</Typography>
                  <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1, mb: 1 }}>
                    {analytics.data.map(item => (
                      <Button
                        key={`sel-${item.ticker}`}
                        size="small"
                        variant={selectedTickerTS === item.ticker ? 'contained' : 'outlined'}
                        onClick={()=>setSelectedTickerTS(item.ticker)}
                      >
                        {item.ticker}
                      </Button>
                    ))}
                  </Box>
                  <Box sx={{ height: 420 }}>
                    <Line data={buildSingleTickerDataset(analytics.data, selectedTickerTS)} options={chartOptions} />
                  </Box>
                </TiltPaper>
              )}
              {(chartToggles.series1y || chartToggles.series1mo || chartToggles.series1h) && (
              <Box sx={{ gridColumn: '1 / -1' }}>
                {(multiLoading || multiError) && (
                  <Typography sx={{ mb: 1 }}>{multiLoading ? 'Loading time series…' : multiError}</Typography>
                )}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}>
                  {chartToggles.series1y && (
                  <TiltPaper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>Portfolio Value (1 Year)</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      1‑year portfolio value with forecast continuation distinguished in orange.
                    </Typography>
                    {multiAnalytics.y1 && rows && rows.length > 0 ? (
                      <Box sx={{ height: 420 }}>
                        <Line data={buildPortfolioValueDataset(multiAnalytics.y1.data, rows)} options={chartOptions} />
                      </Box>
                    ) : (
                      <Typography>No data</Typography>
                    )}
                  </TiltPaper>
                  )}
                  {chartToggles.series1mo && (
                  <TiltPaper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>Portfolio Value (1 Month)</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      1‑month portfolio value with short‑term forecast.
                    </Typography>
                    {multiAnalytics.m1 && rows && rows.length > 0 ? (
                      <Box sx={{ height: 420 }}>
                        <Line data={buildPortfolioValueDataset(multiAnalytics.m1.data, rows)} options={chartOptions} />
                      </Box>
                    ) : (
                      <Typography>No data</Typography>
                    )}
                  </TiltPaper>
                  )}
                  {chartToggles.series1h && (
                  <TiltPaper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>Portfolio Value (1 Hour Interval)</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      Recent minute‑level portfolio value with a 60‑minute forward projection.
                    </Typography>
                    {multiAnalytics.h1 && rows && rows.length > 0 ? (
                      <Box sx={{ height: 420 }}>
                        <Line data={buildPortfolioValueDataset(sliceRecent(multiAnalytics.h1.data, 60), rows)} options={chartOptions} />
                      </Box>
                    ) : (
                      <Typography>No data</Typography>
                    )}
                  </TiltPaper>
                  )}
                </Box>
              </Box>
              )}
              <TiltPaper sx={{ p: 2, gridColumn: '1 / -1' }}>
                <Typography variant="h6" gutterBottom>Min/Max KPIs</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Displays each ticker’s minimum and maximum close within the selected period.
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 2 }}>
                  {analytics.tickers.map(t => {
                    const mm = analytics.minmax[t] || {}
                    return (
                      <TiltPaper key={`kpi-${t}`} sx={{ p: 2 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>{t}</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                          <Box>
                            <Typography variant="caption">Min Close</Typography>
                            <Typography variant="h6">{fmt(mm.min_close)}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption">Max Close</Typography>
                            <Typography variant="h6">{fmt(mm.max_close)}</Typography>
                          </Box>
                        </Box>
                      </TiltPaper>
                    )
                  })}
                </Box>
              </TiltPaper>
            </Box>
          )}
          <TiltPaper sx={{ height: 500, width: '100%' }}>
            <DataGrid
              rows={rows}
              columns={[
                { field: 'ticker', headerName: 'Ticker', flex: 1 },
                { field: 'quantity', headerName: 'Quantity', flex: 1, type: 'number' },
                { field: 'avg_price', headerName: 'Avg Price', flex: 1, type: 'number' },
              ]}
              getRowId={(r)=>r.id}
              disableRowSelectionOnClick
            />
          </TiltPaper>
        </>
      ) : (
        <Typography>No portfolios found. Create one above to get started.</Typography>
      )}
      </Container>
    </MotionPage>
  )
}

function StockWrapper({ user }) {
  const { ticker } = useParams()
  if (!ticker) return null
  return <StockDetail ticker={ticker} user={user} />
}

function StockAnalysis() {
  const [ticker, setTicker] = useState('^NSEI')
  const [scale, setScale] = useState('monthly')
  const [history, setHistory] = useState('6mo')
  const [model, setModel] = useState('arima')
  const [horizon, setHorizon] = useState(6)
  const [data, setData] = useState({ series: [], forecast: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [indexName, setIndexName] = useState('')
  const [indexTickers, setIndexTickers] = useState([])
  const [selectedIndexTicker, setSelectedIndexTicker] = useState('')

  const historyOptions = {
    hourly: ['24h','48h','7d'],
    monthly: ['6mo','1y','3y','5y'],
    yearly: ['1y','2y','3y','5y','10y'],
  }
  const horizonOptions = {
    hourly: [{v:12,l:'next 12 hours'},{v:24,l:'next 24 hours'},{v:48,l:'next 48 hours'}],
    monthly: [{v:6,l:'next 6 months'},{v:12,l:'next 12 months'},{v:24,l:'next 24 months'}],
    yearly: [{v:3,l:'next 3 years'},{v:5,l:'next 5 years'},{v:10,l:'next 10 years'}],
  }
  const assets = [
    { v: '^NSEI', l: 'NIFTY 50 (^NSEI)' },
    { v: '^BSESN', l: 'SENSEX (^BSESN)' },
    { v: 'GC=F', l: 'GOLD (GC=F)' },
    { v: 'SI=F', l: 'SILVER (SI=F)' },
    { v: 'BTC-USD', l: 'BTC-USD (BTC-USD)' },
  ]
  const models = [
    { v: 'arima', l: 'ARIMA (Time Series)' },
    { v: 'linear', l: 'Linear Regression' },
    { v: 'rnn', l: 'RNN (Deep Learning)' },
    { v: 'cnn', l: 'CNN (Deep Learning)' },
  ]

  useEffect(() => {
    if (!historyOptions[scale].includes(history)) {
      setHistory(historyOptions[scale][0])
    }
    const defHz = horizonOptions[scale][0].v
    if (!horizonOptions[scale].some(h => h.v === horizon)) {
      setHorizon(defHz)
    }
  }, [scale])

  useEffect(() => {
    const loadIndex = async () => {
      if (!indexName) {
        setIndexTickers([])
        setSelectedIndexTicker('')
        return
      }
      try {
        const res = await axios.get('/stocks/index/', { params: { name: indexName } })
        const arr = (res.data?.results || []).map(r => r.ticker).filter(Boolean)
        setIndexTickers(arr)
        if (arr.length > 0) setSelectedIndexTicker(arr[0])
      } catch {
        setIndexTickers([])
        setSelectedIndexTicker('')
      }
    }
    loadIndex()
  }, [indexName])

  useEffect(() => {
    if (selectedIndexTicker) {
      setTicker(selectedIndexTicker)
    }
  }, [selectedIndexTicker])

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await axios.get('/analysis/forecast/', { params: { ticker, scale, history, model, horizon } })
      setData({ series: res.data.series || [], forecast: res.data.forecast || [] })
    } catch (e) {
      setError('Failed to load analysis')
      setData({ series: [], forecast: [] })
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [ticker, scale, history, model, horizon])

  const buildDataset = () => {
    const labelsSet = new Set()
    for (const d of (data.series||[])) if (d?.date) labelsSet.add(d.date)
    for (const d of (data.forecast||[])) if (d?.date) labelsSet.add(d.date)
    const labels = Array.from(labelsSet).sort()
    const aMap = {}; for (const d of (data.series||[])) aMap[d.date] = d.close != null ? Number(d.close) : null
    const fMap = {}; for (const d of (data.forecast||[])) fMap[d.date] = d.close != null ? Number(d.close) : null
    const actualVals = labels.map(l => (fMap[l] != null ? null : (aMap[l] ?? null)))
    const forecastVals = labels.map(l => (fMap[l] != null ? fMap[l] : null))
    return {
      labels,
      datasets: [
        { label: 'Historical', data: actualVals, borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.15)', fill: true, tension: 0.3, pointRadius: 0 },
        { label: 'Forecast', data: forecastVals, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)', fill: true, tension: 0.35, pointRadius: 0, borderDash: [6,6] },
      ]
    }
  }
  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#e5e7eb' } } },
    scales: {
      x: { ticks: { color: '#a5b4fc' }, grid: { color: 'rgba(255,255,255,0.08)' } },
      y: { ticks: { color: '#a5b4fc' }, grid: { color: 'rgba(255,255,255,0.08)' } },
    },
  }

  return (
    <MotionPage>
      <Container sx={{ mt: 3 }}>
        <Typography variant="h4" gutterBottom>Stock Analysis</Typography>
        <TiltPaper sx={{ p:2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField select size="small" label="Index" value={indexName} onChange={(e)=>setIndexName(e.target.value)} SelectProps={{ native: true }}>
              <option value="">— Select Index —</option>
              <option value="nifty50">NIFTY 50</option>
              <option value="sensex30">SENSEX 30</option>
            </TextField>
            <TextField select size="small" label="Stock (from Index)" value={selectedIndexTicker} onChange={(e)=>setSelectedIndexTicker(e.target.value)} SelectProps={{ native: true }} disabled={!indexTickers.length}>
              {indexTickers.length === 0 ? <option value="">No stocks</option> : indexTickers.map(t => <option key={t} value={t}>{t}</option>)}
            </TextField>
            <TextField select size="small" label="Predictive Asset" value={ticker} onChange={(e)=>setTicker(e.target.value)} SelectProps={{ native: true }}>
              {assets.map(a => <option key={a.v} value={a.v}>{a.l}</option>)}
            </TextField>
            <TextField select size="small" label="Intelligence Model" value={model} onChange={(e)=>setModel(e.target.value)} SelectProps={{ native: true }}>
              {models.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </TextField>
            <TextField select size="small" label="Range Type" value={scale} onChange={(e)=>setScale(e.target.value)} SelectProps={{ native: true }}>
              <option value="hourly">Hourly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </TextField>
            <TextField select size="small" label="Time Range" value={history} onChange={(e)=>setHistory(e.target.value)} SelectProps={{ native: true }}>
              {historyOptions[scale].map(h => <option key={h} value={h}>{h}</option>)}
            </TextField>
            <TextField select size="small" label="Prediction Horizon" value={horizon} onChange={(e)=>setHorizon(parseInt(e.target.value))} SelectProps={{ native: true }}>
              {horizonOptions[scale].map(h => <option key={h.v} value={h.v}>{h.l}</option>)}
            </TextField>
            <Button variant="outlined" onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</Button>
          </Box>
        </TiltPaper>
        {error && <Typography color="error" sx={{ mb: 1 }}>{error}</Typography>}
        <TiltPaper sx={{ p:2 }}>
          <Typography variant="h6" gutterBottom>
            {assets.find(a=>a.v===ticker)?.l || ticker} Forecast
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            Historical trend with projected {scale} horizon using {models.find(m=>m.v===model)?.l}.
          </Typography>
          <Box sx={{ height: 460 }}>
            <Line data={buildDataset()} options={options} />
          </Box>
        </TiltPaper>
      </Container>
    </MotionPage>
  )
}

function App() {
  const auth = useAuth()
  const location = useLocation()

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Nav user={auth.user} onLogout={auth.logout} />
      <div className="bg-aurora" />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home user={auth.user} />} />
          <Route path="/login" element={!auth.user ? <Login onLogin={auth.login} /> : <Navigate to="/" />} />
          <Route path="/register" element={!auth.user ? <Register onLogin={auth.login} /> : <Navigate to="/" />} />
          <Route path="/stocks" element={<Stocks />} />
          <Route path="/stock/:ticker" element={<StockWrapper user={auth.user} />} />
          <Route path="/portfolio" element={auth.user ? <Portfolio /> : <Navigate to="/login" />} />
          <Route path="/stock-analysis" element={<StockAnalysis />} />
        </Routes>
      </AnimatePresence>
    </ThemeProvider>
  )
}

export default App
