import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Slow version: no bundle analyzer, no optimizations
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    port: 3000,
    host: true,
  },
})
