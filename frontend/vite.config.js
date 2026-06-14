import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Legge VITE_BASE_URL da env, default al nome del repo GitHub
  base: process.env.VITE_BASE_URL || '/Matrimonio_test/',

  build: {
    outDir: 'dist',
    sourcemap: false,
  },

  server: {
    port: 5173,
    proxy: {
      // In locale proxia le chiamate API al backend FastAPI
      '/api': 'http://localhost:8000',
    },
  },
})
