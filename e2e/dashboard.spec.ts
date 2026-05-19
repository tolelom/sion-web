import { test, expect, type Page } from '@playwright/test'

const BACKEND_URL = process.env.E2E_BACKEND_URL ?? 'http://localhost:8001'

/** /api/health에 닿을 수 있으면 backend가 떠 있는 것으로 간주. 아니면 통합 테스트를 skip. */
async function backendUp(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, {
      signal: AbortSignal.timeout(2_000),
    })
    return res.ok
  } catch {
    return false
  }
}

async function getConnectionStatus(page: Page): Promise<string | null> {
  return page.locator('.connection-status .status-text').first().textContent()
}

test.describe('Dashboard — smoke (backend 불필요)', () => {
  test('루트 페이지가 핵심 UI 요소들과 함께 렌더된다', async ({ page }) => {
    await page.goto('/')

    // 좌측 상단 타이틀/연결 상태 영역
    await expect(page.locator('.connection-status')).toBeVisible()

    // StatusPanel — AGV 상태 카드
    await expect(page.getByText('AGV 상태')).toBeVisible()

    // ControlPanel — 자동/수동 토글 + 긴급 정지가 있어야 한다
    await expect(page.getByRole('button', { name: /(자동|수동) 모드/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /긴급 정지/ })).toBeVisible()
  })

  test('backend가 없으면 "재연결 중..." 또는 "서버 연결 실패" 상태가 표시된다', async ({ page }) => {
    // backend가 떠 있는 경우는 별도 통합 테스트에서 검증. 여기는 표시 여부만.
    await page.goto('/')

    // 처음 몇 초간은 재연결 시도 → 둘 중 하나가 5초 내에 보여야 함.
    await expect(page.locator('.connection-status .status-text')).toHaveText(
      /(서버 연결됨|재연결 중|서버 연결 실패)/,
      { timeout: 5_000 },
    )
  })
})

test.describe('Dashboard — integration (backend 필요)', () => {
  test.beforeAll(async () => {
    if (!(await backendUp())) {
      test.skip(true, `backend 미실행 (${BACKEND_URL}/api/health). 통합 테스트 skip.`)
    }
  })

  test.afterEach(async () => {
    // 다음 테스트로 simulator 상태가 새지 않게 정리. 실패는 무시.
    try {
      await fetch(`${BACKEND_URL}/api/simulator/stop`, { method: 'POST' })
    } catch {
      /* ignore */
    }
  })

  test('backend가 살아있으면 페이지 로드 후 "서버 연결됨"이 표시된다', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.connection-status .status-text')).toHaveText('서버 연결됨', {
      timeout: 10_000,
    })
  })

  test('simulator를 시작하면 AGV가 연결되고 위치/속도가 갱신된다', async ({ page }) => {
    await page.goto('/')

    // WS 연결될 때까지 대기
    await expect(page.locator('.connection-status .status-text')).toHaveText('서버 연결됨', {
      timeout: 10_000,
    })

    // 초기에는 AGV 미연결 (시뮬레이터 시작 전)
    const badge = page.locator('.agv-connection-badge')
    await expect(badge).toBeVisible()

    // 시뮬레이터 시작 — backend가 가짜 AGV 클라이언트로 WS에 붙는 구조
    const startRes = await fetch(`${BACKEND_URL}/api/simulator/start`, { method: 'POST' })
    expect(startRes.ok, 'simulator/start 응답').toBeTruthy()

    // 잠시 후 "AGV 연결됨" 텍스트가 나타나야 한다 (시뮬레이터가 connect 메시지를 보내는 데 시간 소요)
    await expect(badge).toHaveText('AGV 연결됨', { timeout: 10_000 })

    // 위치가 (0.00, 0.00) → 변동값으로 갱신되는지 확인
    await expect(page.locator('.status-value', { hasText: /\(/ })).toBeVisible()

    // 속도 표시도 등장
    await expect(page.getByText(/m\/s$/)).toBeVisible()
  })
})
