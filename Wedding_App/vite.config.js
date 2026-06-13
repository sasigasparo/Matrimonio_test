import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  base: process.env.VITE_BASE_URL || '/Sito_Wedding/',

  build: {
    outDir: 'dist',
    sourcemap: false,
  },

  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      '/uploads': 'http://localhost:8000',
    }
  }
})