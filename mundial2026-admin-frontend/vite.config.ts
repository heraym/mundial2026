import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001, // Admin runs on a different port to avoid conflicts with main frontend (usually 3000 or 5173)
    proxy: {
      '/usuarios': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/usuario': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/partidos': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/apuesta': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/apuestas': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/equipos': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/grupos': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/leaderboard': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/pendientes': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    }
  }
})
