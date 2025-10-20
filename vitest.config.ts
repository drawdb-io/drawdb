import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    exclude: ['node_modules', 'dist', 'e2e', 'tests', 'cypress', '**/node_modules/**'],
    globals: true,
  },
})
