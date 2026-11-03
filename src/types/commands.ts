import type { Point } from './map'

// 대시보드가 WebSocket으로 백엔드에 보내는 메시지.
// 실제로 나가는 JSON은 src/contract.test.tsx가 고정한다.

export type AgvMode = 'auto' | 'manual'

export type ClientCommand =
  | { type: 'mode_change'; data: { mode: AgvMode } }
  | { type: 'emergency_stop'; data: { reason: string } }
  | { type: 'command'; data: { action: 'reset' } }
  | { type: 'command'; data: { target_x: number; target_y: number; path: Point[]; mode: 'manual' } }

export type SendCommand = (command: ClientCommand) => boolean
