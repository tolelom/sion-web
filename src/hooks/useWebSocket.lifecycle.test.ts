import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useWebSocket } from './useWebSocket'

// d53cf2a의 소켓 수명 수정을 고정한다.
// 1) 이전 소켓의 늦은 onclose가 새 소켓 참조를 지우거나 재연결을 걸지 않는다.
// 2) 첫 연결 타이머(100ms)가 돌기 전에 언마운트하면 소켓을 만들지 않는다.

class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
  static instances: MockWebSocket[] = []

  url: string
  readyState = MockWebSocket.CONNECTING
  onopen: ((ev: Event) => void) | null = null
  onmessage: ((ev: MessageEvent) => void) | null = null
  onclose: ((ev: CloseEvent) => void) | null = null
  onerror: ((ev: Event) => void) | null = null
  sent: string[] = []

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
  }

  send(data: string): void {
    this.sent.push(data)
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED
  }

  open(): void {
    this.readyState = MockWebSocket.OPEN
    this.onopen?.(new Event('open'))
  }

  fireClose(): void {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.({ code: 1006, reason: '' } as CloseEvent)
  }
}

const URL = 'ws://localhost:8001/websocket/web'

beforeEach(() => {
  MockWebSocket.instances = []
  vi.useFakeTimers()
  vi.stubGlobal('WebSocket', MockWebSocket as unknown as typeof WebSocket)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('useWebSocket lifecycle (d53cf2a)', () => {
  it('does not create a socket when unmounted before the first connect', () => {
    const { unmount } = renderHook(() => useWebSocket(URL, () => {}))
    act(() => {
      vi.advanceTimersByTime(50)
    })
    unmount()
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(MockWebSocket.instances).toHaveLength(0)
  })

  it('ignores a late close from a replaced socket', () => {
    const { result, unmount } = renderHook(() => useWebSocket(URL, () => {}))
    act(() => {
      vi.advanceTimersByTime(100)
    })
    const first = MockWebSocket.instances[0]
    act(() => {
      first.fireClose()
    })
    act(() => {
      result.current.retryConnect()
    })
    expect(MockWebSocket.instances).toHaveLength(2)
    const second = MockWebSocket.instances[1]
    act(() => {
      second.open()
    })
    expect(result.current.connectionStatus).toBe('connected')

    act(() => {
      first.fireClose()
    })
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(MockWebSocket.instances).toHaveLength(2)
    expect(result.current.connectionStatus).toBe('connected')
    expect(result.current.sendMessage({ type: 'probe' })).toBe(true)
    expect(second.sent).toEqual(['{"type":"probe"}'])
    unmount()
  })

  it('reports false and sends nothing while no socket is open', () => {
    const { result, unmount } = renderHook(() => useWebSocket(URL, () => {}))
    expect(result.current.sendMessage({ type: 'probe' })).toBe(false)
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(result.current.sendMessage({ type: 'probe' })).toBe(false)
    expect(MockWebSocket.instances[0].sent).toEqual([])
    unmount()
  })
})
