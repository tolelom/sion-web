/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const REQUIRED_ENV = ['VITE_WS_URL', 'VITE_API_BASE_URL']

export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    const env = loadEnv(mode, '.')
    const missing = REQUIRED_ENV.filter((key) => !env[key])
    if (missing.length > 0) {
      throw new Error(`빌드에 필요한 환경변수가 없습니다: ${missing.join(', ')}`)
    }
  }
  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      globals: false,
    },
  }
})
