import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Cloudflare Pages usa '/', GitHub Pages usa '/Matrimonio_test/'
  base: process.env.VITE_BASE_URL || '/',

  build: {
    outDir: 'dist',
    sourcemap: false,
  },

  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})