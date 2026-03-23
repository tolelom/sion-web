import { useWebSocket } from './hooks/useWebSocket'
import { useAgvState } from './hooks/useAgvState'
import { useChatState } from './hooks/useChatState'
import { useMapState } from './hooks/useMapState'
import { useEffect } from 'react'
import Dashboard from './components/Dashboard/Dashboard'

function App() {
  const WS_URL = 'ws://sion.tolelom.xyz:3000/websocket/web'
  const { isConnected, connectionStatus, lastMessage, sendMessage, retryConnect } = useWebSocket(WS_URL)

  const { agvData, dispatch: agvDispatch } = useAgvState()
  const { messages, isLoading, dispatch: chatDispatch } = useChatState()
  const { mapData, pathData, dispatch: mapDispatch } = useMapState()

  useEffect(() => {
    if (!lastMessage) return
    console.log('[WebSocket] 수신: ', lastMessage)

    switch (lastMessage.type) {
      case 'position':
        agvDispatch({ type: 'position', payload: lastMessage.data as any })
        break
      case 'status':
        agvDispatch({ type: 'status', payload: lastMessage.data as any })
        break
      case 'target_found':
        agvDispatch({ type: 'target_found', payload: lastMessage.data as any })
        break
      case 'path_update':
        mapDispatch({ type: 'path_update', payload: lastMessage.data as any })
        break
      case 'map_update':
        mapDispatch({ type: 'map_update', payload: lastMessage.data as any })
        break
      case 'chat_response':
        chatDispatch({ type: 'ai_message', payload: (lastMessage.data as any).message })
        break
      case 'agv_event':
        chatDispatch({ type: 'ai_message', payload: (lastMessage.data as any).explanation })
        break
      case 'agv_connected':
      case 'agv_disconnected':
        agvDispatch({ type: 'agv_connection', payload: lastMessage.data as any })
        break
      case 'system_info':
        if ((lastMessage.data as any)?.agv_connected !== undefined) {
          agvDispatch({ type: 'agv_connection', payload: { connected: (lastMessage.data as any).agv_connected } })
        }
        break
      case 'error':
        console.warn('서버 에러:', (lastMessage.data as any)?.message)
        break
      default:
        console.log('알 수 없는 메시지: ', lastMessage)
    }
  }, [lastMessage])

  return (
    <Dashboard
      agvData={agvData}
      mapData={mapData}
      pathData={pathData}
      messages={messages}
      isLoading={isLoading}
      onChatDispatch={chatDispatch}
      isConnected={isConnected}
      connectionStatus={connectionStatus}
      onSendCommand={sendMessage}
      onRetryConnect={retryConnect}
    />
  )
}

export default App
