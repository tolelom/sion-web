import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import { socket, mockUseWebSocket, mockMapCanvas, stubPathfindingFetch, mapClickTarget } from './test/appHarness'

// 데모 백엔드 main(sion-backend 7b1a8fe)과의 메시지 계약을 고정한다.
// 송신: 실제 컴포넌트를 눌러 나온 JSON을 그대로 비교한다.
// 수신: 백엔드가 보내는 type은 모두 화면 상태를 바꿔야 한다.
// 백엔드 값은 그 커밋의 services/simulator.go, handlers/websocket_web.go, handlers/pathfinding.go 기준이다.

vi.mock('./hooks/useWebSocket', () => mockUseWebSocket())
vi.mock('./components/Map/MapCanvas', () => mockMapCanvas())
vi.mock('./components/Status/StatusPanel', () => ({
  default: ({ agvData }: { agvData: unknown }) => <pre data-testid="agv">{JSON.stringify(agvData)}</pre>,
}))

import App from './App'

const BACKEND_SENDS = ['status', 'position', 'map_update', 'system_info', 'error'] as const
const BACKEND_ACCEPTS = ['emergency_stop', 'mode_change', 'command'] as const

const wire = (message: unknown) => JSON.parse(JSON.stringify(message))

beforeEach(() => socket.reset())
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('messages sent to the demo backend', () => {
  it('mode toggle sends mode_change with the next mode', () => {
    render(<App />)
    fireEvent.click(screen.getByText('▶️ 자동 모드'))
    expect(socket.sent.map(wire)).toEqual([{ type: 'mode_change', data: { mode: 'manual' } }])
  })

  it('emergency stop sends emergency_stop with a reason', () => {
    render(<App />)
    fireEvent.click(screen.getByText(/긴급 정지/))
    expect(socket.sent.map(wire)).toEqual([{ type: 'emergency_stop', data: { reason: 'User requested emergency stop' } }])
  })

  it('reset sends command{action: reset} after confirmation', async () => {
    render(<App />)
    await act(async () => {
      fireEvent.click(screen.getByText(/초기화/))
    })
    await act(async () => {
      fireEvent.click(screen.getByText('확인'))
    })
    expect(socket.sent.map(wire)).toEqual([{ type: 'command', data: { action: 'reset' } }])
  })

  it('map click posts the pathfinding request and sends the path command', async () => {
    const calls = stubPathfindingFetch({ success: true, path: [{ x: 2, y: 2 }, { x: 5, y: 8 }] })
    render(<App />)
    act(() => socket.onMessage?.({ type: 'position', data: { x: 2.4, y: 1.6, angle: 0 }, timestamp: 1 } as never))
    act(() => socket.onMessage?.({ type: 'map_update', data: { obstacles: [{ x: 3, y: 3 }], width: 20, height: 20 }, timestamp: 2 } as never))
    await act(async () => {
      fireEvent.click(screen.getByText('map-click'))
    })
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toMatch(/\/api\/pathfinding$/)
    expect(calls[0].body).toEqual({
      start: { x: 2, y: 2 },
      goal: { x: 5, y: 8 },
      map_width: 20,
      map_height: 20,
      obstacles: [{ x: 3, y: 3 }],
    })
    expect(socket.sent.map(wire)).toEqual([{
      type: 'command',
      data: { target_x: mapClickTarget.x, target_y: mapClickTarget.y, path: [{ x: 2, y: 2 }, { x: 5, y: 8 }], mode: 'manual' },
    }])
  })

  it('only sends message types the demo backend accepts', async () => {
    stubPathfindingFetch({ success: true, path: [{ x: 0, y: 0 }] })
    render(<App />)
    fireEvent.click(screen.getByText('▶️ 자동 모드'))
    fireEvent.click(screen.getByText(/긴급 정지/))
    await act(async () => {
      fireEvent.click(screen.getByText(/초기화/))
    })
    await act(async () => {
      fireEvent.click(screen.getByText('확인'))
    })
    await act(async () => {
      fireEvent.click(screen.getByText('map-click'))
    })
    const types = (socket.sent as { type: string }[]).map((m) => m.type)
    expect(types.length).toBeGreaterThan(0)
    for (const type of types) {
      expect(BACKEND_ACCEPTS).toContain(type)
    }
  })
})

describe('messages received from the demo backend', () => {
  const samples: Record<(typeof BACKEND_SENDS)[number], unknown> = {
    status: { type: 'status', data: { battery: 42, speed: 1, mode: 'auto', state: 'searching', detected_enemies: [], target_enemy: null }, timestamp: 1 },
    position: { type: 'position', data: { x: 7, y: 8, angle: 0.5, timestamp: '2026-10-16T00:00:00Z' }, timestamp: 1 },
    map_update: { type: 'map_update', data: { obstacles: [{ x: 9, y: 9 }], width: 20, height: 20 }, timestamp: 1 },
    system_info: { type: 'system_info', data: { agv_connected: true, server_time: '2026-10-16T00:00:00Z' }, timestamp: 1 },
    error: { type: 'error', data: { message: '지원하지 않는 메시지 타입: "chat"' }, timestamp: 1 },
  }

  for (const type of BACKEND_SENDS) {
    it(`reacts to ${type}`, () => {
      render(<App />)
      const before = document.body.innerHTML
      act(() => socket.onMessage?.(samples[type] as never))
      expect(document.body.innerHTML).not.toEqual(before)
    })
  }
})
