/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
    // Playwright E2E 스펙은 vitest가 픽업하지 않게 분리.
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
})
