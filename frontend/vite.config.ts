import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Arayüz /api isteklerini ASP.NET Core API'ye yönlendirir (backend/src/Api).
    proxy: { '/api': 'http://localhost:5249' },
  },
})
