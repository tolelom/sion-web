import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E config.
 *
 * 통합 테스트는 sion-backend가 :8001에 떠 있다고 가정한다.
 * - smoke 테스트(페이지 로드, UI 요소 존재)는 backend 없이도 통과.
 * - integration 테스트(simulator → AGV 연결됨 표시)는 /api/health 응답 가능할 때만 실행되고
 *   그렇지 않으면 skip된다.
 */
const BACKEND_URL = process.env.E2E_BACKEND_URL ?? 'http://localhost:8001'
const FRONTEND_PORT = 5173

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    // Vite dev server를 자동 기동. WS/API 엔드포인트는 backend(8001)를 가리킨다.
    command: 'npm run dev',
    url: `http://localhost:${FRONTEND_PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      VITE_API_BASE_URL: BACKEND_URL,
      VITE_WS_URL: `${BACKEND_URL.replace(/^http/, 'ws')}/websocket/web`,
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
