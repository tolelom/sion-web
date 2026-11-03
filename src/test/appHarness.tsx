import { vi } from 'vitest'
import type { WSMessage } from '../types'
import type { ConnectionStatus } from '../hooks/useWebSocket'

export const socket = {
  onMessage: null as ((message: WSMessage) => void) | null,
  sendResult: true,
  sent: [] as unknown[],
  status: 'connected' as ConnectionStatus,
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
