import React from 'react'
import type { AGVData } from '../../types'

interface StatusPanelProps {
  agvData: AGVData
}

interface StateDisplay {
  icon: string
  text: string
  color: string
}

// state ID → 표시 정보. 컴포넌트 외부에 두어 매 렌더 재생성 방지.
const STATE_DISPLAY_MAP: Record<string, StateDisplay> = {
  idle: { icon: '🚦', text: '대기', color: '#95a5a6' },
  moving: { icon: '🚗', text: '이동 중', color: '#3498db' },
  charging: { icon: '⚡', text: '돌진 중', color: '#e74c3c' },
  searching: { icon: '🔍', text: '탐색 중', color: '#f39c12' },
  stopped: { icon: '⛔', text: '정지', color: '#e67e22' },
  emergency: { icon: '🚨', text: '긴급 정지', color: '#c0392b' },
}

const getStateDisplay = (state: string | null): StateDisplay =>
  STATE_DISPLAY_MAP[state ?? 'idle'] ?? STATE_DISPLAY_MAP.idle

const getBatteryColor = (battery: number): string => {
  if (battery > 60) return '#2ecc71'
  if (battery > 30) return '#f39c12'
  return '#e74c3c'
}

const getHpColor = (hp: number): string => {
  if (hp > 50) return '#2ecc71'
  if (hp > 25) return '#f39c12'
  return '#e74c3c'
}

const StatusPanel = ({ agvData }: StatusPanelProps) => {
  const agvConnected = agvData?.connected ?? false
  const position = agvData?.position ?? { x: 0, y: 0, angle: 0 }
  const status = agvData?.status ?? { battery: 0, speed: 0, mode: 'auto', state: 'idle' }
  const targetEnemy = agvData?.targetEnemy
  const detectedEnemies = agvData?.detectedEnemies ?? []

  const stateDisplay = getStateDisplay(status.state)
  // 0이 유효 값(speed=0, battery=0)인 필드는 || 대신 ??.
  const battery = status.battery ?? 0
  const speed = status.speed ?? 0

  return (
    <div className="card">
      <h2 className="card-title">AGV 상태</h2>

      <div className={`agv-connection-badge ${agvConnected ? 'connected' : 'disconnected'}`}>
        {agvConnected ? 'AGV 연결됨' : 'AGV 연결 끊김'}
      </div>

      <div>
        <div className="status-item">
          <div className="status-icon" style={{ fontSize: '24px' }}>
            {stateDisplay.icon}
          </div>
          <div className="status-content">
            <p className="status-label">상태</p>
            <p className="status-value" style={{ color: stateDisplay.color, fontWeight: 'bold' }}>
              {stateDisplay.text}
            </p>
          </div>
        </div>

        <div className="status-item">
          <div className="status-icon blue">📍</div>
          <div className="status-content">
            <p className="status-label">위치</p>
            <p className="status-value">
              ({position.x?.toFixed(2)}, {position.y?.toFixed(2)})
            </p>
            {position.angle !== undefined && (
              <p className="status-hint">
                각도: {(position.angle * 180 / Math.PI).toFixed(0)}°
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="status-item">
        <div className="status-icon green">🔋</div>
        <div className="status-content">
          <p className="status-label">배터리</p>
          <div className="battery-container">
            <div
              className="battery-fill"
              style={{
                width: `${battery}%`,
                backgroundColor: getBatteryColor(battery),
              }}
            />
          </div>
          <span className="battery-percentage">{battery}%</span>
        </div>
      </div>

      <div className="status-item">
        <div className="status-icon orange">⚡</div>
        <div className="status-content">
          <p className="status-label">속도</p>
          <p className="status-value">{speed.toFixed(1)} m/s</p>
        </div>
      </div>

      <div className="status-item">
        <div className="status-icon">
          {status.mode === 'auto' ? '🤖' : '🎮'}
        </div>
        <div className="status-content">
          <p className="status-label">모드</p>
          <span className={`mode-badge ${status.mode ?? 'auto'}`}>
            {status.mode === 'auto' ? '자동' : '수동'}
          </span>
        </div>
      </div>

      {targetEnemy && (
        <div className="status-item target-section">
          <div className="status-icon" style={{ fontSize: '20px' }}>🎯</div>
          <div className="status-content">
            <p className="status-label">현재 타겟</p>
            <p className="status-value" style={{ color: '#e74c3c', fontWeight: 'bold' }}>
              {targetEnemy.name || '적'}
            </p>
            {targetEnemy.hp !== undefined && (
              <div>
                <div className="target-hp-bar">
                  <div
                    className="target-hp-fill"
                    style={{
                      width: `${targetEnemy.hp}%`,
                      backgroundColor: getHpColor(targetEnemy.hp),
                    }}
                  />
                </div>
                <span className="target-hp-text">HP: {targetEnemy.hp}%</span>
              </div>
            )}
            {targetEnemy.x !== undefined && targetEnemy.y !== undefined && (
              <p className="status-hint">
                위치: ({targetEnemy.x.toFixed(1)}, {targetEnemy.y.toFixed(1)})
              </p>
            )}
          </div>
        </div>
      )}

      {detectedEnemies.length > 0 && (
        <div className="status-item">
          <div className="status-icon" style={{ fontSize: '20px' }}>👁️</div>
          <div className="status-content">
            <p className="status-label">감지된 적</p>
            <p className="status-value">{detectedEnemies.length}명</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(StatusPanel)
