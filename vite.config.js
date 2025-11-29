import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [ react() ],
  // Opcional: cambiar alias para imports
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  // Opcional: configuración para servidor de desarrollo
  server: {
    port: 5173,
    // host: '0.0.0.0', // usar si necesitas acceso desde red externa
  }
})
