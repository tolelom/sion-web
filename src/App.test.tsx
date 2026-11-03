import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import { socket, mockUseWebSocket, mockMapCanvas, stubPathfindingFetch } from './test/appHarness'

vi.mock('./hooks/useWebSocket', () => mockUseWebSocket())
vi.mock('./components/Map/MapCanvas', () => mockMapCanvas())
vi.mock('./components/Status/StatusPanel', () => ({
  default: ({ agvData }: { agvData: unknown }) => <pre data-testid="agv">{JSON.stringify(agvData)}</pre>,
}))

import App from './App'

const agv = () => JSON.parse(screen.getByTestId('agv').textContent ?? 'null')
const mapProps = () => JSON.parse(screen.getByTestId('map-props').textContent ?? 'null')
const deliver = (message: unknown) => act(() => socket.onMessage?.(message as never))

beforeEach(() => socket.reset())
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('App message routing', () => {
  it('starts from the initial AGV and map state', () => {
    render(<App />)
    expect(agv()).toEqual({
      connected: false,
      position: { x: 0, y: 0, angle: 0 },
      status: { battery: 100, speed: 0, mode: 'auto', state: null },
      detectedEnemies: [],
      targetEnemy: null,
    })
    expect(mapProps()).toEqual({ agvPosition: { x: 0, y: 0, angle: 0 }, targets: [], targetEnemy: null, obstacles: [], path: [] })
  })

  it('applies position', () => {
    render(<App />)
    deliver({ type: 'position', data: { x: 3.5, y: 4.25, angle: 1.5, timestamp: '2026-10-16T00:00:00Z' }, timestamp: 1 })
    expect(agv().position).toEqual({ x: 3.5, y: 4.25, angle: 1.5, timestamp: '2026-10-16T00:00:00Z' })
    expect(mapProps().agvPosition).toEqual({ x: 3.5, y: 4.25, angle: 1.5, timestamp: '2026-10-16T00:00:00Z' })
  })

  it('applies status with enemies and keeps unspecified fields', () => {
    render(<App />)
    const enemy = { id: 'enemy-1', name: '아리', hp: 30, x: 4, y: 5 }
    deliver({ type: 'status', data: { battery: 80, speed: 2.5, mode: 'manual', state: 'charging', detected_enemies: [enemy], target_enemy: enemy }, timestamp: 1 })
    deliver({ type: 'status', data: { battery: 79 }, timestamp: 2 })
    expect(agv().status).toEqual({ battery: 79, speed: 2.5, mode: 'manual', state: 'charging' })
    expect(agv().detectedEnemies).toEqual([enemy])
    expect(agv().targetEnemy).toEqual(enemy)
    expect(mapProps().targets).toEqual([enemy])
    expect(mapProps().targetEnemy).toEqual(enemy)
  })

  it('clears the target when status sends target_enemy null', () => {
    render(<App />)
    const enemy = { id: 'enemy-1', name: '아리', hp: 30, x: 4, y: 5 }
    deliver({ type: 'status', data: { target_enemy: enemy }, timestamp: 1 })
    deliver({ type: 'status', data: { target_enemy: null, detected_enemies: [] }, timestamp: 2 })
    expect(agv().targetEnemy).toBeNull()
    expect(agv().detectedEnemies).toEqual([])
    expect(mapProps().targetEnemy).toBeNull()
  })

  it('keeps the target when status omits target_enemy', () => {
    render(<App />)
    const enemy = { id: 'enemy-1', name: '아리', hp: 30, x: 4, y: 5 }
    deliver({ type: 'status', data: { target_enemy: enemy }, timestamp: 1 })
    deliver({ type: 'status', data: { battery: 50 }, timestamp: 2 })
    expect(agv().targetEnemy).toEqual(enemy)
  })

  it('replaces the target when status sends a new one', () => {
    render(<App />)
    const first = { id: 'enemy-1', name: '아리', hp: 30, x: 4, y: 5 }
    const second = { id: 'enemy-2', name: '야스오', hp: 70, x: 9, y: 2 }
    deliver({ type: 'status', data: { target_enemy: first }, timestamp: 1 })
    deliver({ type: 'status', data: { target_enemy: second }, timestamp: 2 })
    expect(agv().targetEnemy).toEqual(second)
    expect(mapProps().targetEnemy).toEqual(second)
  })

  it('applies map_update obstacles', () => {
    render(<App />)
    deliver({ type: 'map_update', data: { obstacles: [{ x: 1, y: 2 }, { x: 3, y: 4 }], width: 20, height: 20 }, timestamp: 1 })
    expect(mapProps().obstacles).toEqual([{ x: 1, y: 2 }, { x: 3, y: 4 }])
  })

  it('reads agv_connected from system_info and ignores it when absent', () => {
    render(<App />)
    deliver({ type: 'system_info', data: { agv_connected: true, server_time: 'now' }, timestamp: 1 })
    expect(agv().connected).toBe(true)
    deliver({ type: 'system_info', data: { server_time: 'later' }, timestamp: 2 })
    expect(agv().connected).toBe(true)
    deliver({ type: 'system_info', data: { agv_connected: false }, timestamp: 3 })
    expect(agv().connected).toBe(false)
  })

  it('ignores the robot relay messages the demo backend no longer sends', () => {
    render(<App />)
    const before = { agv: agv(), map: mapProps() }
    const enemy = { id: 'e', name: 'n', hp: 1, x: 1, y: 1 }
    deliver({ type: 'target_found', data: { enemies: [enemy], target: enemy }, timestamp: 1 })
    deliver({ type: 'path_update', data: { points: [{ x: 1, y: 1 }, { x: 2, y: 2 }], length: 1.41, algorithm: 'A*' }, timestamp: 2 })
    deliver({ type: 'agv_connected', data: { connected: true }, timestamp: 3 })
    expect({ agv: agv(), map: mapProps() }).toEqual(before)
  })

  it('drops malformed messages instead of crashing the dashboard', () => {
    render(<App />)
    const before = { agv: agv(), map: mapProps() }
    const malformed = [
      null,
      'status',
      [1, 2],
      { data: { battery: 1 } },
      { type: 'status' },
      { type: 'status', data: null },
      { type: 'position', data: {} },
      { type: 'position', data: { x: '1', y: 2, angle: 0 } },
      { type: 'map_update', data: [1] },
      { type: 'system_info', data: null },
    ]
    for (const message of malformed) {
      deliver(message)
    }
    expect({ agv: agv(), map: mapProps() }).toEqual(before)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('ignores unknown message types', () => {
    render(<App />)
    const before = { agv: agv(), map: mapProps() }
    deliver({ type: 'chat_response', data: { message: 'hi' }, timestamp: 1 })
    deliver({ type: 'something_else', data: null, timestamp: 2 })
    expect({ agv: agv(), map: mapProps() }).toEqual(before)
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('App server errors (d53cf2a)', () => {
  it('shows the server error message and hides it on dismiss', () => {
    render(<App />)
    deliver({ type: 'error', data: { message: '요청이 너무 많습니다. 잠시 후 다시 시도하세요' }, timestamp: 1 })
    expect(screen.getByRole('alert').textContent).toContain('요청이 너무 많습니다. 잠시 후 다시 시도하세요')
    fireEvent.click(screen.getByText('닫기'))
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('falls back to a generic message when error has no message', () => {
    render(<App />)
    deliver({ type: 'error', data: {}, timestamp: 1 })
    expect(screen.getByRole('alert').textContent).toContain('알 수 없는 서버 오류')
    deliver({ type: 'error', timestamp: 2 })
    expect(screen.getByRole('alert').textContent).toContain('알 수 없는 서버 오류')
  })
})

describe('Map click move (d53cf2a)', () => {
  it('reports a missing path on screen without alert()', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    stubPathfindingFetch({ success: false, message: '경로를 찾을 수 없습니다' })
    render(<App />)
    await act(async () => {
      fireEvent.click(screen.getByText('map-click'))
    })
    expect(screen.getByText(/경로를 찾을 수 없습니다. 장애물을 피해 다른 위치를 선택해주세요./)).toBeTruthy()
    expect(socket.sent).toEqual([])
    expect(alertSpy).not.toHaveBeenCalled()
  })

  it('reports an unsent move command on screen without alert()', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    stubPathfindingFetch({ success: true, path: [{ x: 0, y: 0 }, { x: 5, y: 8 }] })
    socket.sendResult = false
    render(<App />)
    await act(async () => {
      fireEvent.click(screen.getByText('map-click'))
    })
    expect(screen.getByText(/서버에 연결되어 있지 않아 이동 명령을 보내지 못했습니다./)).toBeTruthy()
    expect(socket.sent).toHaveLength(1)
    expect(alertSpy).not.toHaveBeenCalled()
  })

  it('shows the user path after a successful move', async () => {
    stubPathfindingFetch({ success: true, path: [{ x: 0, y: 0 }, { x: 5, y: 8 }] })
    render(<App />)
    await act(async () => {
      fireEvent.click(screen.getByText('map-click'))
    })
    expect(screen.getByText(/사용자 경로: 2개 포인트/)).toBeTruthy()
    expect(mapProps().path).toEqual([{ x: 0, y: 0 }, { x: 5, y: 8 }])
    expect(screen.queryByText(/보내지 못했습니다/)).toBeNull()
  })

  it('sends only the latest click when an older path answer arrives late', async () => {
    const answers: ((body: unknown) => void)[] = []
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => {
      answers.push((body) => resolve({ json: async () => body } as Response))
    })))
    render(<App />)
    await act(async () => {
      fireEvent.click(screen.getByText('map-click'))
    })
    await act(async () => {
      fireEvent.click(screen.getByText('map-click'))
    })
    expect(answers).toHaveLength(2)
    await act(async () => {
      answers[1]({ success: true, path: [{ x: 0, y: 0 }, { x: 5, y: 8 }] })
    })
    await act(async () => {
      answers[0]({ success: true, path: [{ x: 0, y: 0 }, { x: 9, y: 9 }] })
    })
    expect(socket.sent).toHaveLength(1)
    expect((socket.sent[0] as { data: { path: unknown } }).data.path).toEqual([{ x: 0, y: 0 }, { x: 5, y: 8 }])
    expect(mapProps().path).toEqual([{ x: 0, y: 0 }, { x: 5, y: 8 }])
    expect(screen.queryByText(/경로를 찾을 수 없습니다/)).toBeNull()
  })
})

