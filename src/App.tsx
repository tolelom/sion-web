import { useWebSocket } from './hooks/useWebSocket'
import { useAgvState } from './hooks/useAgvState'
import { useChatState } from './hooks/useChatState'
import { useMapState } from './hooks/useMapState'
import { routeMessage } from './hooks/messageRouter'
import { useEffect } from 'react'
import Dashboard from './components/Dashboard/Dashboard'

function App() {
  const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3000/websocket/web'
  const { isConnected, connectionStatus, lastMessage, sendMessage, retryConnect } = useWebSocket(WS_URL)

  const { agvData, dispatch: agvDispatch } = useAgvState()
  const { messages, isLoading, dispatch: chatDispatch } = useChatState()
  const { mapData, pathData, dispatch: mapDispatch } = useMapState()

  useEffect(() => {
    if (!lastMessage) return
    routeMessage(lastMessage, { agvDispatch, mapDispatch, chatDispatch })
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
