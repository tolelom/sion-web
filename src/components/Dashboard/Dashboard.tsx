import { useMemo } from 'react'
import MapCanvas from '../Map/MapCanvas'
import StatusPanel from '../Status/StatusPanel'
import ControlPanel from '../Controls/ControlPanel'
import ConnectionIndicator from './ConnectionIndicator'
import { useMoveCommand } from '../../hooks/useMoveCommand'
import type { ConnectionStatus } from '../../hooks/useWebSocket'
import type { AGVData, MapData, PathData, SendCommand } from '../../types'
import '../../styles/dashboard.css'

interface DashboardProps {
  agvData: AGVData
  mapData: MapData
  pathData: PathData
  isConnected: boolean
  connectionStatus: ConnectionStatus
  serverError: string | null
  onDismissError: () => void
  onSendCommand: SendCommand
  onRetryConnect: () => void
}

const Dashboard = ({ agvData, mapData, pathData, isConnected, connectionStatus, serverError, onDismissError, onSendCommand, onRetryConnect }: DashboardProps) => {
  const targets = agvData.detectedEnemies || []
  const obstacles = useMemo(() => mapData.obstacles || [], [mapData.obstacles])
  const agvPathPoints = pathData.points || []

  const { path, isPathLoading, pathError, moveError, moveTo } = useMoveCommand(agvData.position, obstacles, onSendCommand)

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1 className="dashboard-title">🚀 AGV 실시간 모니터링</h1>
        <ConnectionIndicator status={connectionStatus} onRetry={onRetryConnect} />
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
              {pathError && <span style={{ color: '#e74c3c' }}>❌ {pathError}</span>}
              {moveError && <span style={{ color: '#e74c3c' }}>❌ {moveError}</span>}
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
            agvPosition={agvData.position}
            targets={targets}
            targetEnemy={agvData.targetEnemy}
            obstacles={obstacles}
            path={path}
            agvPath={agvPathPoints}
            onMapClick={moveTo}
          />
        </div>

        <div className="sidebar">
          <StatusPanel agvData={agvData} />
          <ControlPanel onSendCommand={onSendCommand} agvData={agvData} isConnected={isConnected} />
          {serverError && (
            <div className="card" role="alert" style={{ color: '#e74c3c' }}>
              ❌ {serverError}
              <button onClick={onDismissError} style={{ marginLeft: '8px', fontSize: '12px', cursor: 'pointer' }}>
                닫기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
