import { useCallback, useState } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import { useAgvState } from './hooks/useAgvState'
import { useMapState } from './hooks/useMapState'
import { routeMessage } from './hooks/messageRouter'
import Dashboard from './components/Dashboard/Dashboard'
import type { WSMessage } from './types'

function App() {
  const { agvData, dispatch: agvDispatch } = useAgvState()
  const { mapData, pathData, dispatch: mapDispatch } = useMapState()
  const [serverError, setServerError] = useState<string | null>(null)

  const handleMessage = useCallback((message: WSMessage) => {
    routeMessage(message, { agvDispatch, mapDispatch, onServerError: setServerError })
  }, [agvDispatch, mapDispatch])

  const { isConnected, connectionStatus, sendMessage, retryConnect } = useWebSocket(import.meta.env.VITE_WS_URL, handleMessage)

  return (
    <Dashboard
      agvData={agvData}
      mapData={mapData}
      pathData={pathData}
      isConnected={isConnected}
      connectionStatus={connectionStatus}
      serverError={serverError}
      onDismissError={() => setServerError(null)}
      onSendCommand={sendMessage}
      onRetryConnect={retryConnect}
    />
  )
}

export default App
