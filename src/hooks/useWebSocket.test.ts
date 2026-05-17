import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useWebSocket } from './useWebSocket'

// jsdom의 WebSocket을 대체하는 모의 클래스.
// hook이 참조하는 정적 상태값(WebSocket.OPEN 등)과 인스턴스 메서드(send/close)를 모두 제공한다.
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

// hook 마운트 후 setTimeout(connect, 100)이 실제 WebSocket을 만들 때까지 advance.
// 첫 인스턴스 핸들러를 반환한다.
function mountAndConnect(): { cleanup: () => void; ws: MockWebSocket; result: ReturnType<typeof renderHook<ReturnType<typeof useWebSocket>, unknown>>['result'] } {
  const { result, unmount } = renderHook(() => useWebSocket(URL))

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

  it('onmessage(JSON)는 lastMessage를 갱신', () => {
    const { result, ws, cleanup } = mountAndConnect()
    act(() => {
      ws.triggerOpen()
    })

    const payload = { type: 'status', data: { battery: 80 }, timestamp: 12345 }
    act(() => {
      ws.triggerMessage(payload)
    })

    expect(result.current.lastMessage).toEqual(payload)

    cleanup()
  })

  it('onmessage(invalid JSON)는 lastMessage를 변경하지 않음', () => {
    const { result, ws, cleanup } = mountAndConnect()
    act(() => {
      ws.triggerOpen()
    })

    const before = result.current.lastMessage
    act(() => {
      ws.triggerMessage('not-json')
    })

    expect(result.current.lastMessage).toBe(before)

    cleanup()
  })

  it('sendMessage: OPEN 아닐 땐 false, OPEN이면 true + send 호출', () => {
    const { result, ws, cleanup } = mountAndConnect()

    // 아직 onopen 안 함 → readyState = CONNECTING
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

    // 첫 close: attempts=1, delay = min(1000 * 2^0, 30000) = 1000ms
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(MockWebSocket.instances).toHaveLength(2)
    const ws2 = MockWebSocket.instances[1]
    expect(ws2.url).toBe(URL)

    cleanup()
  })

  it('MAX_RECONNECT_ATTEMPTS 초과 시 disconnected로 전이', () => {
    const MAX = 10
    const { result, cleanup } = mountAndConnect()

    // 매 사이클: 현재 ws.close → 백오프 timer 충분히 advance → 새 인스턴스 생성.
    // MAX번째 close까지는 새 인스턴스가 생기고, MAX+1번째 close에서 disconnected로 전이.
    for (let i = 0; i < MAX; i++) {
      const ws = MockWebSocket.instances[i]
      act(() => { ws.triggerClose() })
      // 백오프는 최대 30s까지 자랄 수 있으므로 충분히 advance.
      act(() => { vi.advanceTimersByTime(60_000) })
      expect(MockWebSocket.instances.length).toBe(i + 2)
      expect(result.current.connectionStatus).toBe('reconnecting')
    }

    // 11번째 close: attempts가 MAX를 넘어가 disconnected.
    const last = MockWebSocket.instances[MAX]
    act(() => { last.triggerClose() })

    expect(result.current.connectionStatus).toBe('disconnected')
    expect(result.current.isConnected).toBe(false)
    // 더 이상 새 인스턴스 안 만들어짐.
    act(() => { vi.advanceTimersByTime(60_000) })
    expect(MockWebSocket.instances.length).toBe(MAX + 1)

    cleanup()
  })

  it('retryConnect: disconnected에서 호출 시 attempts 리셋 + 즉시 새 인스턴스', () => {
    const MAX = 10
    const { result, cleanup } = mountAndConnect()

    // disconnected까지 몰아간다.
    for (let i = 0; i < MAX; i++) {
      const ws = MockWebSocket.instances[i]
      act(() => { ws.triggerClose() })
      act(() => { vi.advanceTimersByTime(60_000) })
    }
    act(() => { MockWebSocket.instances[MAX].triggerClose() })
    expect(result.current.connectionStatus).toBe('disconnected')

    const before = MockWebSocket.instances.length

    act(() => {
      result.current.retryConnect()
    })

    // retryConnect는 setTimeout 없이 즉시 connect를 부른다 → 새 인스턴스가 곧바로 생성.
    expect(MockWebSocket.instances.length).toBe(before + 1)
    expect(result.current.connectionStatus).toBe('reconnecting')

    // 그 새 ws의 close는 다시 백오프를 처음(1초)부터 시작 — attempts가 리셋됐다는 증거.
    const newWs = MockWebSocket.instances[before]
    act(() => { newWs.triggerClose() })
    act(() => { vi.advanceTimersByTime(1000) })
    expect(MockWebSocket.instances.length).toBe(before + 2)

    cleanup()
  })

  it('unmount 후 onclose가 와도 reconnect 안 됨', () => {
    const { ws, cleanup } = mountAndConnect()
    act(() => { ws.triggerOpen() })

    cleanup() // unmount → mountedRef.current=false, ws.close 호출됨

    const before = MockWebSocket.instances.length
    // unmount 후에 close 이벤트가 늦게 도착해도 scheduleReconnect는 mountedRef 가드로 no-op.
    act(() => { ws.triggerClose() })
    act(() => { vi.advanceTimersByTime(60_000) })

    expect(MockWebSocket.instances.length).toBe(before)
  })
})
