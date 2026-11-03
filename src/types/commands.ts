import type { Point } from './map'

export type AgvMode = 'auto' | 'manual'

export type ClientCommand =
  | { type: 'mode_change'; data: { mode: AgvMode } }
  | { type: 'emergency_stop'; data: { reason: string } }
  | { type: 'command'; data: { action: 'reset' } }
  | { type: 'command'; data: { target_x: number; target_y: number; path: Point[]; mode: 'manual' } }

export type SendCommand = (command: ClientCommand) => boolean
