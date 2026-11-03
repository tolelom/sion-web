import type { Position, AGVStatus, Enemy } from './agv'
import type { Point } from './map'

export type PositionPayload = Position

export type StatusPayload = Partial<Pick<AGVStatus, 'battery' | 'speed' | 'mode' | 'state'>> & {
  detected_enemies?: Enemy[]
  target_enemy?: Enemy | null
}

export interface MapUpdatePayload {
  obstacles?: Point[]
  width?: number
  height?: number
}

export interface SystemInfoPayload {
  agv_connected?: boolean
  server_time?: string
}

export interface ErrorPayload {
  message?: string
}

interface BaseMessage<T extends string, D> {
  type: T
  data: D
  timestamp: number
}

export type WSMessage =
  | BaseMessage<'position', PositionPayload>
  | BaseMessage<'status', StatusPayload>
  | BaseMessage<'map_update', MapUpdatePayload>
  | BaseMessage<'system_info', SystemInfoPayload>
  | BaseMessage<'error', ErrorPayload>
