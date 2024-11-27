import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Esto asegura que las rutas generadas sean relativas al archivo index.html
  build: {
    outDir: 'dist', // Carpeta de salida para producción
    emptyOutDir: true, // Limpia la carpeta antes de construir
  },
  server: {
    port: 5173, // El puerto donde Vite escucha por defecto
  },
})

