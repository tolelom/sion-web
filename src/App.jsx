import { useWebSocket } from './hooks/useWebSocket.js'
import { useAgvState } from './hooks/useAgvState.js'
import { useChatState } from './hooks/useChatState.js'
import { useMapState } from './hooks/useMapState.js'
import { useEffect } from 'react'
import Dashboard from './components/Dashboard/Dashboard.jsx'

function App() {
  const WS_URL = 'ws://sion.tolelom.xyz:3000/websocket/web'
  const { isConnected, connectionStatus, lastMessage, sendMessage, retryConnect } = useWebSocket(WS_URL)

  const { agvData, dispatch: agvDispatch } = useAgvState()
  const { messages, isLoading, dispatch: chatDispatch } = useChatState()
  const { mapData, pathData, dispatch: mapDispatch } = useMapState()

  // WebSocket 메시지 라우팅
  useEffect(() => {
    if (!lastMessage) return
    console.log('[WebSocket] 수신: ', lastMessage)

    switch (lastMessage.type) {
      case 'position':
        agvDispatch({ type: 'position', payload: lastMessage.data })
        break
      case 'status':
        agvDispatch({ type: 'status', payload: lastMessage.data })
        break
      case 'target_found':
        agvDispatch({ type: 'target_found', payload: lastMessage.data })
        break
      case 'path_update':
        mapDispatch({ type: 'path_update', payload: lastMessage.data })
        break
      case 'map_update':
        mapDispatch({ type: 'map_update', payload: lastMessage.data })
        break
      case 'chat_response':
        chatDispatch({ type: 'ai_message', payload: lastMessage.data.message })
        break
      case 'agv_event':
        chatDispatch({ type: 'ai_message', payload: lastMessage.data.explanation })
        break
      case 'agv_connected':
      case 'agv_disconnected':
        agvDispatch({ type: 'agv_connection', payload: lastMessage.data })
        break
      case 'system_info':
        // Welcome 메시지에서 AGV 연결 상태 초기화
        if (lastMessage.data?.agv_connected !== undefined) {
          agvDispatch({ type: 'agv_connection', payload: { connected: lastMessage.data.agv_connected } })
        }
        break
      case 'error':
        console.warn('서버 에러:', lastMessage.data?.message)
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
