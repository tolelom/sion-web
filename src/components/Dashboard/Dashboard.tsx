import MapCanvas from '../Map/MapCanvas'
import StatusPanel from '../Status/StatusPanel'
import ControlPanel from '../Controls/ControlPanel'
import { usePathfinding } from '../../hooks/usePathfinding'
import '../../styles/dashboard.css'
import ChatPanel from '../Chat/ChatPanel'
import { useCallback } from 'react'
import type { AGVData, MapData, PathData, ChatMessage, ChatAction, Point } from '../../types'

type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected'

interface DashboardProps {
  agvData: AGVData
  mapData: MapData
  pathData: PathData
  messages: ChatMessage[]
  isLoading: boolean
  onChatDispatch: React.Dispatch<ChatAction>
  isConnected: boolean
  connectionStatus: ConnectionStatus
  onSendCommand: (message: unknown) => boolean
  onRetryConnect: () => void
}

const Dashboard = ({ agvData, mapData, pathData, messages, isLoading, onChatDispatch, isConnected, connectionStatus, onSendCommand, onRetryConnect }: DashboardProps) => {
  const targets = agvData?.detectedEnemies || []
  const targetEnemy = agvData?.targetEnemy
  const obstacles = mapData?.obstacles || []

  const agvPathPoints = pathData?.points || []

  const { path, isLoading: isPathLoading, error, findPath } = usePathfinding()

  const handleMapClick = async (position: { x: number; y: number }) => {
    console.log('🎯 맵 클릭:', position)

    const currentPos = agvData?.position || { x: 0, y: 0 }

    const start = {
      x: Math.round(currentPos.x),
      y: Math.round(currentPos.y)
    }

    const goal = {
      x: Math.round(position.x),
      y: Math.round(position.y)
    }

    console.log('🚀 경로 탐색 시작:', start, '→', goal)

    const calculatedPath = await findPath(start, goal, obstacles)

    if (calculatedPath) {
      console.log('✅ 경로 생성 완료')

      onSendCommand({
        type: 'command',
        data: {
          target_x: position.x,
          target_y: position.y,
          path: calculatedPath,
          mode: 'manual'
        }
      })
    } else {
      console.error('❌ 경로를 찾을 수 없습니다')
      alert('경로를 찾을 수 없습니다. 장애물을 피해 다른 위치를 선택해주세요.')
    }
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1 className="dashboard-title">🚀 AGV 실시간 모니터링</h1>
        <div className="connection-status">
          <div className={`status-dot ${connectionStatus}`} />
          <span className="status-text">
            {connectionStatus === 'connected' && '서버 연결됨'}
            {connectionStatus === 'reconnecting' && '재연결 중...'}
            {connectionStatus === 'disconnected' && (
              <>
                서버 연결 실패
                <button
                  onClick={onRetryConnect}
                  style={{ marginLeft: '8px', padding: '2px 8px', fontSize: '12px', cursor: 'pointer' }}
                >
                  재연결
                </button>
              </>
            )}
          </span>
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 className="card-title">📍 실시간 맵</h2>
            <div style={{ fontSize: '14px', color: '#888', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {agvPathPoints.length > 0 && (
                <span style={{ color: '#2ecc71' }}>
                  🗺️ AGV 경로: {agvPathPoints.length}개 포인트
                </span>
              )}
              {isPathLoading && <span>🔄 경로 계산 중...</span>}
              {error && <span style={{ color: '#e74c3c' }}>❌ {error}</span>}
              {path.length > 0 && !isPathLoading && (
                <span style={{ color: '#3498db' }}>
                  ✅ 사용자 경로: {path.length}개 포인트
                </span>
              )}
            </div>
          </div>

          {agvPathPoints.length > 0 && (
            <div style={{
              background: 'rgba(46, 204, 113, 0.1)',
              border: '1px solid rgba(46, 204, 113, 0.3)',
              borderRadius: '6px',
              padding: '10px',
              marginBottom: '10px',
              fontSize: '12px',
              color: '#2ecc71'
            }}>
              <strong>🗺️ AGV 경로</strong> | 길이: {pathData.length?.toFixed(2) || 'N/A'}m | 알고리즘: {pathData.algorithm || 'N/A'}
            </div>
          )}

          <MapCanvas
            agvPosition={agvData?.position}
            targets={targets}
            targetEnemy={targetEnemy}
            obstacles={obstacles}
            path={path}
            agvPath={agvPathPoints}
            onMapClick={handleMapClick}
          />
        </div>

        <div className="sidebar">
          <StatusPanel agvData={agvData} />
          <ControlPanel onSendCommand={onSendCommand} agvData={agvData} />

          <div className="card" style={{ height: '1000px' }}>
            <ChatPanel
              messages={messages}
              isLoading={isLoading}
              onChatDispatch={onChatDispatch}
              onSendMessage={onSendCommand}
              isConnected={isConnected}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
