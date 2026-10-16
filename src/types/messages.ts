import type { Position, AGVStatus, Enemy } from './agv'
import type { Point } from './map'

export type PositionPayload = Position

export type StatusPayload = Partial<Pick<AGVStatus, 'battery' | 'speed' | 'mode' | 'state'>> & {
  detected_enemies?: Enemy[]
  target_enemy?: Enemy | null
}

export interface TargetFoundPayload {
  enemies?: Enemy[]
  target?: Enemy | null
}

export interface PathUpdatePayload {
  points?: Point[]
  length?: number
  algorithm?: string
  created_at?: string | null
}

export interface MapUpdatePayload {
  obstacles?: Point[]
  width?: number
  height?: number
}

export interface AgvConnectionPayload {
  connected: boolean
}

export interface SystemInfoPayload {
  connected_clients?: number
  agv_connected?: boolean
  server_time?: string
  uptime?: number
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
  | BaseMessage<'target_found', TargetFoundPayload>
  | BaseMessage<'path_update', PathUpdatePayload>
  | BaseMessage<'map_update', MapUpdatePayload>
  | BaseMessage<'agv_connected', AgvConnectionPayload>
  | BaseMessage<'agv_disconnected', AgvConnectionPayload>
  | BaseMessage<'system_info', SystemInfoPayload>
  | BaseMessage<'error', ErrorPayload>
