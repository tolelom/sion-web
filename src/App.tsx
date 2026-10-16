import { useCallback, useState } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import { useAgvState } from './hooks/useAgvState'
import { useMapState } from './hooks/useMapState'
import Dashboard from './components/Dashboard/Dashboard'
import type { WSMessage } from './types'

function App() {
  const { agvData, dispatch: agvDispatch } = useAgvState()
  const { mapData, pathData, dispatch: mapDispatch } = useMapState()
  const [serverError, setServerError] = useState<string | null>(null)

  const handleMessage = useCallback((message: WSMessage) => {
    switch (message.type) {
      case 'position':
        agvDispatch({ type: 'position', payload: message.data })
        break
      case 'status':
        agvDispatch({ type: 'status', payload: message.data })
        break
      case 'target_found':
        agvDispatch({ type: 'target_found', payload: message.data })
        break
      case 'path_update':
        mapDispatch({ type: 'path_update', payload: message.data })
        break
      case 'map_update':
        mapDispatch({ type: 'map_update', payload: message.data })
        break
      case 'agv_connected':
      case 'agv_disconnected':
        agvDispatch({ type: 'agv_connection', payload: message.data })
        break
      case 'system_info':
        if (message.data?.agv_connected !== undefined) {
          agvDispatch({ type: 'agv_connection', payload: { connected: message.data.agv_connected } })
        }
        break
      case 'error':
        setServerError(message.data?.message ?? '알 수 없는 서버 오류')
        break
      default:
        break
    }
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
