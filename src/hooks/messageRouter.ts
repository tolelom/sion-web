import type { Dispatch } from 'react'
import type { WSMessage } from '../types'
import type { AgvAction } from './useAgvState'
import type { MapAction } from './useMapState'

export interface MessageRouteHandlers {
  agvDispatch: Dispatch<AgvAction>
  mapDispatch: Dispatch<MapAction>
  onServerError: (message: string) => void
}

// 타입상 이미 객체인 payload를 좁히는 용도라 `object`로 둔다(필드 타입을 지우지 않게).
const isRecord = (value: unknown): value is object =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

// 서버 JSON은 파싱만 하고 들어오므로 여기서 모양을 확인한다.
// 리듀서나 그리기 코드가 null·숫자 아닌 좌표를 만나 예외를 던지면 화면 전체가 내려가기 때문에,
// 그럴 수 있는 메시지는 버린다. 필드 단위 검사는 하지 않는다(백엔드가 같은 저장소 계약을 따른다).
export const routeMessage = (message: WSMessage, h: MessageRouteHandlers): void => {
  if (!isRecord(message)) return

  switch (message.type) {
    case 'position':
      if (isRecord(message.data) && isNumber(message.data.x) && isNumber(message.data.y)) {
        h.agvDispatch({ type: 'position', payload: message.data })
      }
      return
    case 'status':
      if (isRecord(message.data)) h.agvDispatch({ type: 'status', payload: message.data })
      return
    case 'target_found':
      if (isRecord(message.data)) h.agvDispatch({ type: 'target_found', payload: message.data })
      return
    case 'path_update':
      if (isRecord(message.data)) h.mapDispatch({ type: 'path_update', payload: message.data })
      return
    case 'map_update':
      if (isRecord(message.data)) h.mapDispatch({ type: 'map_update', payload: message.data })
      return
    case 'agv_connected':
    case 'agv_disconnected':
      if (isRecord(message.data)) h.agvDispatch({ type: 'agv_connection', payload: message.data })
      return
    case 'system_info':
      if (isRecord(message.data) && message.data.agv_connected !== undefined) {
        h.agvDispatch({ type: 'agv_connection', payload: { connected: message.data.agv_connected } })
      }
      return
    case 'error':
      h.onServerError((isRecord(message.data) ? message.data.message : undefined) ?? '알 수 없는 서버 오류')
      return
    default:
      return
  }
}
