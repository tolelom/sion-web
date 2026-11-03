import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useWebSocket } from './useWebSocket'
import type { WSMessage } from '../types'

class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  static instances: MockWebSocket[] = []

  url: string
  readyState: number = MockWebSocket.CONNECTING

  onopen: ((ev: Event) => void) | null = null
  onmessage: ((ev: MessageEvent) => void) | null = null
  onclose: ((ev: CloseEvent) => void) | null = null
  onerror: ((ev: Event) => void) | null = null

  sent: string[] = []
  closed = false

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
  }

  send(data: string): void {
    this.sent.push(data)
  }

  close(): void {
    this.closed = true
    this.readyState = MockWebSocket.CLOSED
  }

  triggerOpen(): void {
    this.readyState = MockWebSocket.OPEN
    this.onopen?.(new Event('open'))
  }

  triggerMessage(payload: unknown): void {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload)
    this.onmessage?.({ data } as MessageEvent)
  }

  triggerClose(code = 1006, reason = ''): void {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.({ code, reason } as CloseEvent)
  }

  static reset(): void {
    MockWebSocket.instances = []
  }
}

beforeEach(() => {
  MockWebSocket.reset()
  vi.useFakeTimers()
  vi.stubGlobal('WebSocket', MockWebSocket as unknown as typeof WebSocket)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

const URL = 'ws://localhost:3000/websocket/web'

function mountAndConnect(onMessage: (msg: WSMessage) => void = () => {}): { cleanup: () => void; ws: MockWebSocket; result: ReturnType<typeof renderHook<ReturnType<typeof useWebSocket>, unknown>>['result'] } {
  const { result, unmount } = renderHook(() => useWebSocket(URL, onMessage))

  act(() => {
    vi.advanceTimersByTime(100)
  })

  expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(1)
  const ws = MockWebSocket.instances[0]
  return { cleanup: unmount, ws, result }
}

describe('useWebSocket', () => {
  it('마운트 → 100ms 후 WebSocket 생성, onopen 시 connected 전이', () => {
    const { result, ws, cleanup } = mountAndConnect()

    expect(ws.url).toBe(URL)
    expect(result.current.connectionStatus).toBe('reconnecting')
    expect(result.current.isConnected).toBe(false)

    act(() => {
      ws.triggerOpen()
    })

    expect(result.current.connectionStatus).toBe('connected')
    expect(result.current.isConnected).toBe(true)

    cleanup()
  })

  it('delivers every message, even several arriving before React renders', () => {
    const received: WSMessage[] = []
    const { ws, cleanup } = mountAndConnect((msg) => received.push(msg))
    act(() => {
      ws.triggerOpen()
    })

    const first = { type: 'status', data: { battery: 80 }, timestamp: 1 }
    const second = { type: 'position', data: { x: 1, y: 2, angle: 0 }, timestamp: 2 }
    act(() => {
      ws.triggerMessage(first)
      ws.triggerMessage(second)
    })

    expect(received).toEqual([first, second])
    cleanup()
  })

  it('drops messages that are not JSON', () => {
    const received: WSMessage[] = []
    const { ws, cleanup } = mountAndConnect((msg) => received.push(msg))
    act(() => {
      ws.triggerOpen()
      ws.triggerMessage('not-json')
    })

    expect(received).toEqual([])
    cleanup()
  })

  it('does not open a socket when unmounted before the first connect', () => {
    const { unmount } = renderHook(() => useWebSocket(URL, () => {}))
    unmount()
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(MockWebSocket.instances).toHaveLength(0)
  })

  it('sendMessage: OPEN 아닐 땐 false, OPEN이면 true + send 호출', () => {
    const { result, ws, cleanup } = mountAndConnect()

    expect(result.current.sendMessage({ type: 'ping' })).toBe(false)
    expect(ws.sent).toHaveLength(0)

    act(() => {
      ws.triggerOpen()
    })

    expect(result.current.sendMessage({ type: 'ping' })).toBe(true)
    expect(ws.sent).toHaveLength(1)
    expect(JSON.parse(ws.sent[0])).toEqual({ type: 'ping' })

    cleanup()
  })

  it('onclose 후 1초 백오프 → 새 WebSocket 인스턴스 생성', () => {
    const { result, ws, cleanup } = mountAndConnect()
    act(() => {
      ws.triggerOpen()
    })
    expect(MockWebSocket.instances).toHaveLength(1)

    act(() => {
      ws.triggerClose()
    })
    expect(result.current.connectionStatus).toBe('reconnecting')

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(MockWebSocket.instances).toHaveLength(2)
    const ws2 = MockWebSocket.instances[1]
    expect(ws2.url).toBe(URL)

    cleanup()
  })
})

describe('useWebSocket reconnect policy', () => {
  const advanceUntilNewSocket = (maxMs = 60_000): number => {
    const before = MockWebSocket.instances.length
    let waited = 0
    while (MockWebSocket.instances.length === before && waited < maxMs) {
      act(() => {
        vi.advanceTimersByTime(100)
      })
      waited += 100
    }
    return waited
  }

  it('backs off 1s, 2s, 4s … capped at 30s and gives up after 10 attempts', () => {
    const { result, ws, cleanup } = mountAndConnect()
    let current = ws
    const delays: number[] = []
    for (let attempt = 1; attempt <= 10; attempt++) {
      act(() => {
        current.triggerClose()
      })
      expect(result.current.connectionStatus).toBe('reconnecting')
      delays.push(advanceUntilNewSocket())
      current = MockWebSocket.instances[MockWebSocket.instances.length - 1]
    }
    expect(delays).toEqual([1000, 2000, 4000, 8000, 16000, 30000, 30000, 30000, 30000, 30000])

    act(() => {
      current.triggerClose()
    })
    expect(result.current.connectionStatus).toBe('disconnected')
    const count = MockWebSocket.instances.length
    act(() => {
      vi.advanceTimersByTime(120_000)
    })
    expect(MockWebSocket.instances).toHaveLength(count)
    cleanup()
  })

  it('retryConnect starts over after giving up', () => {
    const { result, ws, cleanup } = mountAndConnect()
    let current = ws
    for (let attempt = 1; attempt <= 11; attempt++) {
      act(() => {
        current.triggerClose()
      })
      if (attempt <= 10) {
        advanceUntilNewSocket()
        current = MockWebSocket.instances[MockWebSocket.instances.length - 1]
      }
    }
    expect(result.current.connectionStatus).toBe('disconnected')

    const count = MockWebSocket.instances.length
    act(() => {
      result.current.retryConnect()
    })
    expect(MockWebSocket.instances).toHaveLength(count + 1)
    expect(result.current.connectionStatus).toBe('reconnecting')
    const retried = MockWebSocket.instances[count]
    act(() => {
      retried.triggerClose()
    })
    expect(advanceUntilNewSocket()).toBe(1000)
    cleanup()
  })

  it('schedules a reconnect when the WebSocket constructor throws', () => {
    let throwsLeft = 1
    class ThrowingOnce extends MockWebSocket {
      constructor(url: string) {
        if (throwsLeft > 0) {
          throwsLeft -= 1
          throw new Error('bad url')
        }
        super(url)
      }
    }
    vi.stubGlobal('WebSocket', ThrowingOnce as unknown as typeof WebSocket)
    const { result, unmount } = renderHook(() => useWebSocket(URL, () => {}))
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(MockWebSocket.instances).toHaveLength(0)
    expect(result.current.connectionStatus).toBe('reconnecting')
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(MockWebSocket.instances).toHaveLength(1)
    unmount()
  })
})
