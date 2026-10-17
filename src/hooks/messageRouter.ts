import type { Dispatch } from 'react'
import type { WSMessage } from '../types'
import type { AgvAction } from './useAgvState'
import type { MapAction } from './useMapState'

export interface MessageRouteHandlers {
  agvDispatch: Dispatch<AgvAction>
  mapDispatch: Dispatch<MapAction>
  onServerError: (message: string) => void
}

export const routeMessage = (message: WSMessage, h: MessageRouteHandlers): void => {
  switch (message.type) {
    case 'position':
      h.agvDispatch({ type: 'position', payload: message.data })
      return
    case 'status':
      h.agvDispatch({ type: 'status', payload: message.data })
      return
    case 'target_found':
      h.agvDispatch({ type: 'target_found', payload: message.data })
      return
    case 'path_update':
      h.mapDispatch({ type: 'path_update', payload: message.data })
      return
    case 'map_update':
      h.mapDispatch({ type: 'map_update', payload: message.data })
      return
    case 'agv_connected':
    case 'agv_disconnected':
      h.agvDispatch({ type: 'agv_connection', payload: message.data })
      return
    case 'system_info':
      if (message.data?.agv_connected !== undefined) {
        h.agvDispatch({ type: 'agv_connection', payload: { connected: message.data.agv_connected } })
      }
      return
    case 'error':
      h.onServerError(message.data?.message ?? '알 수 없는 서버 오류')
      return
    default:
      return
  }
}
