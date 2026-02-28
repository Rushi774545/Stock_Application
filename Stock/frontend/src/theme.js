import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#7c3aed' },
    secondary: { main: '#10b981' },
    background: { default: '#0b1020', paper: 'rgba(13,17,34,0.7)' },
    text: { primary: '#e5e7eb', secondary: '#a5b4fc' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.08)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          background: 'linear-gradient(90deg, #0b1020 0%, #1e1b4b 100%)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
        },
      },
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      'system-ui',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'Noto Sans',
      'sans-serif',
    ].join(','),
  },
})

export default theme
