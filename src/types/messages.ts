import type { Position, AGVStatus, Enemy } from './agv'
import type { Point } from './map'

export interface PositionPayload extends Position {}

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

export interface ChatResponsePayload {
  message: string
  model?: string
  timestamp?: number
}

export interface AgvEventPayload {
  event_type?: string
  explanation: string
  position?: Position
  timestamp?: number
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
  | BaseMessage<'chat_response', ChatResponsePayload>
  | BaseMessage<'agv_event', AgvEventPayload>
  | BaseMessage<'agv_connected', AgvConnectionPayload>
  | BaseMessage<'agv_disconnected', AgvConnectionPayload>
  | BaseMessage<'system_info', SystemInfoPayload>
  | BaseMessage<'error', ErrorPayload>
  | BaseMessage<'log' | 'llm_explanation' | 'tts', unknown>
