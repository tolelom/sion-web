import { vi } from 'vitest'
import type { WSMessage } from '../types'

// App 단위 고정 테스트 공용 도구.
// useWebSocket을 대신해 onMessage를 붙잡고 sendMessage 호출을 기록한다.
// MapCanvas를 대신해 받은 props를 JSON으로 드러내고, 지도 클릭을 버튼으로 흉내 낸다.

export const socket = {
  onMessage: null as ((message: WSMessage) => void) | null,
  sendResult: true,
  sent: [] as unknown[],
  status: 'connected' as 'connected' | 'reconnecting' | 'disconnected',
  reset() {
    this.onMessage = null
    this.sendResult = true
    this.sent = []
    this.status = 'connected'
  },
}

export function mockUseWebSocket() {
  return {
    useWebSocket: (_url: string, onMessage: (message: WSMessage) => void) => {
      socket.onMessage = onMessage
      return {
        isConnected: socket.status === 'connected',
        connectionStatus: socket.status,
        sendMessage: (message: unknown) => {
          socket.sent.push(message)
          return socket.sendResult
        },
        retryConnect: vi.fn(),
      }
    },
  }
}

export const mapClickTarget = { x: 5.4, y: 7.6 }

export function mockMapCanvas() {
  return {
    default: (props: Record<string, unknown> & { onMapClick: (p: { x: number; y: number }) => void }) => {
      const { onMapClick, ...rest } = props
      return (
        <div>
          <pre data-testid="map-props">{JSON.stringify(rest)}</pre>
          <button onClick={() => onMapClick(mapClickTarget)}>map-click</button>
        </div>
      )
    },
  }
}

export interface RecordedFetch {
  url: string
  body: unknown
}

export function stubPathfindingFetch(response: unknown): RecordedFetch[] {
  const calls: RecordedFetch[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, body: JSON.parse(String(init.body)) })
    return { json: async () => response } as Response
  }))
  return calls
}
