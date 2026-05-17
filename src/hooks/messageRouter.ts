import type { Dispatch } from 'react'
import type { WSMessage, ChatAction } from '../types'
import type { AgvAction } from './useAgvState'
import type { MapAction } from './useMapState'

export interface MessageRouteHandlers {
  agvDispatch: Dispatch<AgvAction>
  mapDispatch: Dispatch<MapAction>
  chatDispatch: Dispatch<ChatAction>
}

// 서버에서 받은 WSMessage 한 건을 적절한 dispatch로 보낸다.
// App.tsx의 inline switch가 비대해지면 type 좁히기 분기와 dispatch 매핑이 한 함수에서 뒤섞이므로 분리.
export const routeMessage = (msg: WSMessage, h: MessageRouteHandlers): void => {
  switch (msg.type) {
    case 'position':
      h.agvDispatch({ type: 'position', payload: msg.data })
      return
    case 'status':
      h.agvDispatch({ type: 'status', payload: msg.data })
      return
    case 'target_found':
      h.agvDispatch({ type: 'target_found', payload: msg.data })
      return
    case 'path_update':
      h.mapDispatch({ type: 'path_update', payload: msg.data })
      return
    case 'map_update':
      h.mapDispatch({ type: 'map_update', payload: msg.data })
      return
    case 'chat_response':
      h.chatDispatch({ type: 'ai_message', payload: msg.data.message })
      return
    case 'agv_event':
      h.chatDispatch({ type: 'ai_message', payload: msg.data.explanation })
      return
    case 'agv_connected':
    case 'agv_disconnected':
      h.agvDispatch({ type: 'agv_connection', payload: msg.data })
      return
    case 'system_info':
      if (msg.data?.agv_connected !== undefined) {
        h.agvDispatch({ type: 'agv_connection', payload: { connected: msg.data.agv_connected } })
      }
      return
    case 'error':
      console.warn('서버 에러:', msg.data?.message)
      return
    case 'log':
    case 'llm_explanation':
    case 'tts':
      // 클라이언트가 표시 책임 없는 타입 — 무시.
      return
  }
}
