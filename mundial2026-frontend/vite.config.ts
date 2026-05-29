import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
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
    }
  }
})

