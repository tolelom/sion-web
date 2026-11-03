/* Generated from contract/sion.schema.json by `npm run contract:types`. Do not edit. */

/**
 * sion-web와 sion-api 사이의 계약. WebSocket /websocket/web 메시지와 POST /api/pathfinding 본문.
 */
export type SionContract = ServerMessage | ClientCommand | PathfindingRequest | PathfindingResponse
/**
 * 서버가 대시보드로 보내는 메시지.
 */
export type ServerMessage = StatusMessage | PositionMessage | MapUpdateMessage | SystemInfoMessage | ErrorMessage
export type AgvMode = 'auto' | 'manual'
export type AgvState = 'idle' | 'moving' | 'charging' | 'searching' | 'stopped' | 'emergency'
/**
 * Unix 시각(밀리초).
 */
export type Timestamp = number
/**
 * 대시보드가 서버로 보내는 명령. 서버는 모르는 필드를 무시한다.
 */
export type ClientCommand = EmergencyStopCommand | ModeChangeCommand | MoveCommand
/**
 * POST /api/pathfinding 응답 본문. 요청 형식이나 맵 크기가 잘못되면 HTTP 400, 경로가 없으면 HTTP 200에 success=false.
 */
export type PathfindingResponse = PathfindingSuccess | PathfindingFailure

export interface StatusMessage {
  type: 'status'
  data: StatusPayload
  timestamp: Timestamp
}
export interface StatusPayload {
  battery: number
  speed: number
  mode: AgvMode
  state: AgvState
  detected_enemies: Enemy[]
  target_enemy: Enemy | null
}
export interface Enemy {
  id: string
  name: string
  hp: number
  x: number
  y: number
}
export interface PositionMessage {
  type: 'position'
  data: PositionPayload
  timestamp: Timestamp
}
export interface PositionPayload {
  x: number
  y: number
  /**
   * 라디안.
   */
  angle: number
  timestamp: string
}
/**
 * 접속 직후 한 번 보낸다.
 */
export interface MapUpdateMessage {
  type: 'map_update'
  data: MapUpdatePayload
  timestamp: Timestamp
}
export interface MapUpdatePayload {
  obstacles: Cell[]
  width: number
  height: number
}
export interface Cell {
  x: number
  y: number
}
/**
 * 접속 직후 map_update보다 먼저 한 번 보낸다.
 */
export interface SystemInfoMessage {
  type: 'system_info'
  data: SystemInfoPayload
  timestamp: Timestamp
}
export interface SystemInfoPayload {
  /**
   * 시뮬레이터가 늘 AGV 역할을 하므로 true다.
   */
  agv_connected: boolean
  server_time: string
}
/**
 * 명령을 받아들이지 않았을 때 그 연결에만 보낸다. 받아들인 명령에는 답하지 않는다.
 */
export interface ErrorMessage {
  type: 'error'
  data: ErrorPayload
  timestamp: Timestamp
}
export interface ErrorPayload {
  /**
   * 사용자에게 그대로 보여 주는 한국어 문구.
   */
  message: string
}
/**
 * 초기화 전까지 시뮬레이터를 멈춘다.
 */
export interface EmergencyStopCommand {
  type: 'emergency_stop'
  /**
   * 서버는 내용을 보지 않는다. 대시보드는 {reason}을 보낸다.
   */
  data?: {
    [k: string]: unknown
  }
}
export interface ModeChangeCommand {
  type: 'mode_change'
  data: {
    mode: AgvMode
  }
}
export interface MoveCommand {
  type: 'command'
  data: ResetCommandData | PathCommandData
}
/**
 * 시뮬레이터를 처음 상태로 되돌린다. 긴급 정지와 방전도 푼다.
 */
export interface ResetCommandData {
  action: 'reset'
}
/**
 * 수동 모드로 바꾸고 경로를 따라가게 한다. 긴급 정지나 방전 중에는 거절한다.
 */
export interface PathCommandData {
  /**
   * @minItems 1
   * @maxItems 400
   */
  path: SimulatorPoint[]
  /**
   * 서버는 보지 않는다.
   */
  target_x?: number
  /**
   * 서버는 보지 않는다.
   */
  target_y?: number
  /**
   * 서버는 보지 않는다.
   */
  mode?: 'manual'
}
/**
 * 시뮬레이터 맵(20x20) 안의 좌표. 경계값 20도 맵 안이다.
 */
export interface SimulatorPoint {
  x: number
  y: number
}
/**
 * POST /api/pathfinding 요청 본문. 좌표는 내림한 셀로 계산한다.
 */
export interface PathfindingRequest {
  start: Waypoint
  goal: Waypoint
  map_width: number
  map_height: number
  obstacles?: Cell[]
}
export interface Waypoint {
  x: number
  y: number
}
export interface PathfindingSuccess {
  success: true
  /**
   * 시작 셀부터 목표 셀까지 8방향으로 이어지는 셀 좌표.
   *
   * @minItems 1
   */
  path: Waypoint[]
  message: string
}
export interface PathfindingFailure {
  success: false
  message: string
}
