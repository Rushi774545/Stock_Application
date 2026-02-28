import './App.css'
import { Routes, Route, Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip
} from 'chart.js'
import { AppBar, Toolbar, Button, Container, TextField, Box, Typography, Paper, ThemeProvider, CssBaseline } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import theme from './theme'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { useRef } from 'react'

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip)

axios.defaults.baseURL = 'http://localhost:8001/api'

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
      <Container sx={{ mt: 3 }}>
        <Typography variant="h4" gutterBottom>Welcome</Typography>
        {user ? (
          <TiltPaper sx={{ p: 2 }}>
            <Typography>Logged in as {user.username}</Typography>
            <Typography>Unique ID: {user.unique_id}</Typography>
          </TiltPaper>
        ) : (
          <Typography>Please login or register to manage your portfolio.</Typography>
        )}
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
  const navigate = useNavigate()
  const fetchList = async (p = page, ps = pageSize, s = search) => {
    const res = await axios.get(`/stocks/`, { params: { page: p + 1, page_size: ps, search: s || undefined } })
    setRows(res.data.results || [])
    setRowCount(res.data.total || 0)
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
  useEffect(() => { fetchList() }, [page, pageSize])
  return (
    <MotionPage>
      <Container sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h4" sx={{ flex: 1 }}>Stocks</Typography>
        <TextField size="small" label="Search ticker" value={search} onChange={(e)=>setSearch(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter'){ setPage(0); fetchList(0, pageSize, e.target.value) }}} />
        <Button onClick={()=>{ setPage(0); fetchList(0, pageSize, search) }} variant="outlined">Search</Button>
        <Button onClick={fetchAndSave} disabled={loading} variant="contained">{loading ? 'Loading...' : 'Refresh 10 Stocks'}</Button>
      </Box>
      {notice && <Typography sx={{ mb: 1 }}>{notice}</Typography>}
      <TiltPaper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={[
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
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(m)=>{ setPage(m.page); setPageSize(m.pageSize) }}
          rowCount={rowCount}
          pageSizeOptions={[10,20,50,100]}
          onRowClick={(p)=>navigate(`/stock/${p.row.ticker}`)}
          disableRowSelectionOnClick
          getRowId={(r)=>`${r.ticker}-${r.id}`}
        />
      </TiltPaper>
      </Container>
    </MotionPage>
  )
}

function StockDetail({ ticker, user }) {
  const [series, setSeries] = useState([])
  const [qty, setQty] = useState(1)
  const [price, setPrice] = useState('')
  const [msg, setMsg] = useState('')
  useEffect(()=>{
    const load = async () => {
      const res = await axios.get(`/stocks/${ticker}/history/`, { params: { period: '6mo' } })
      setSeries(res.data.series)
    }
    load()
  },[ticker])
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
    plugins: { legend: { labels: { color: '#e5e7eb' } } },
    scales: {
      x: { ticks: { color: '#a5b4fc' }, grid: { color: 'rgba(255,255,255,0.08)' } },
      y: { ticks: { color: '#a5b4fc' }, grid: { color: 'rgba(255,255,255,0.08)' } },
    },
  }
  const buy = async () => {
    setMsg('')
    try {
      await axios.post(`/holdings/buy/`, { ticker, quantity: qty, price })
      setMsg('Bought')
    } catch {
      setMsg('Buy failed')
    }
  }
  const sell = async () => {
    setMsg('')
    try {
      await axios.post(`/holdings/sell/`, { ticker, quantity: qty })
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
        <TiltPaper sx={{ p: 2 }}><Line data={lineData('Close', series)} options={chartOptions} /></TiltPaper>
        <TiltPaper sx={{ p: 2 }}><Line data={peData(series)} options={chartOptions} /></TiltPaper>
      </Box>
      {user ? (
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <TextField type="number" label="Quantity" value={qty} onChange={(e)=>setQty(parseInt(e.target.value||'1'))} />
          <TextField type="number" label="Price (for avg)" value={price} onChange={(e)=>setPrice(e.target.value)} />
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
  const [rows, setRows] = useState([])
  useEffect(()=>{
    const load = async () => {
      const res = await axios.get(`/holdings/`)
      setRows(res.data)
    }
    load()
  },[])
  return (
    <MotionPage>
      <Container sx={{ mt: 3 }}>
      <Typography variant="h4" gutterBottom>Portfolio</Typography>
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
      </Container>
    </MotionPage>
  )
}

function StockWrapper({ user }) {
  const { ticker } = useParams()
  if (!ticker) return null
  return <StockDetail ticker={ticker} user={user} />
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
        </Routes>
      </AnimatePresence>
    </ThemeProvider>
  )
}

export default App
