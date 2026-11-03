import type { Dispatch } from 'react'
import type { WSMessage } from '../types'
import type { AgvAction } from './useAgvState'
import type { MapAction } from './useMapState'

export interface MessageRouteHandlers {
  agvDispatch: Dispatch<AgvAction>
  mapDispatch: Dispatch<MapAction>
  onServerError: (message: string) => void
}

const isNonArrayObject = (value: unknown): value is object =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

// 리듀서·그리기 코드가 예외를 던질 모양만 걸러 낸다.
// 백엔드가 같은 계약을 따르므로 필드 단위 검사는 일부러 하지 않는다.
export const routeMessage = (message: WSMessage, h: MessageRouteHandlers): void => {
  if (!isNonArrayObject(message)) return

  switch (message.type) {
    case 'position':
      if (isNonArrayObject(message.data) && isFiniteNumber(message.data.x) && isFiniteNumber(message.data.y)) {
        h.agvDispatch({ type: 'position', payload: message.data })
      }
      return
    case 'status':
      if (isNonArrayObject(message.data)) h.agvDispatch({ type: 'status', payload: message.data })
      return
    case 'target_found':
      if (isNonArrayObject(message.data)) h.agvDispatch({ type: 'target_found', payload: message.data })
      return
    case 'path_update':
      if (isNonArrayObject(message.data)) h.mapDispatch({ type: 'path_update', payload: message.data })
      return
    case 'map_update':
      if (isNonArrayObject(message.data)) h.mapDispatch({ type: 'map_update', payload: message.data })
      return
    case 'agv_connected':
    case 'agv_disconnected':
      if (isNonArrayObject(message.data)) h.agvDispatch({ type: 'agv_connection', payload: message.data })
      return
    case 'system_info':
      if (isNonArrayObject(message.data) && message.data.agv_connected !== undefined) {
        h.agvDispatch({ type: 'agv_connection', payload: { connected: message.data.agv_connected } })
      }
      return
    case 'error':
      h.onServerError((isNonArrayObject(message.data) ? message.data.message : undefined) ?? '알 수 없는 서버 오류')
      return
    default:
      return
  }
}
