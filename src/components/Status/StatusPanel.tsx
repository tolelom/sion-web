import React from 'react'
import type { AGVData, Enemy } from '../../types'
import { batteryColor, hpColor } from '../../utils/levelColors'

interface StatusPanelProps {
  agvData: AGVData
}

interface StateDisplay {
  icon: string
  text: string
  color: string
}

// 시뮬레이터가 보내는 state 값별 표시. 모르는 값이나 null은 idle로 본다.
const STATE_DISPLAY: Record<string, StateDisplay> = {
  idle: { icon: '🚦', text: '대기', color: '#95a5a6' },
  moving: { icon: '🚗', text: '이동 중', color: '#3498db' },
  charging: { icon: '⚡', text: '돌진 중', color: '#e74c3c' },
  searching: { icon: '🔍', text: '탐색 중', color: '#f39c12' },
  stopped: { icon: '⛔', text: '정지', color: '#e67e22' },
  emergency: { icon: '🚨', text: '긴급 정지', color: '#c0392b' },
}

const stateDisplay = (state: string | null): StateDisplay => STATE_DISPLAY[state ?? 'idle'] || STATE_DISPLAY.idle

const hintStyle = { fontSize: '11px', color: '#888' }

interface StatusItemProps {
  icon: React.ReactNode
  iconClassName?: string
  iconStyle?: React.CSSProperties
  label: string
  style?: React.CSSProperties
  children: React.ReactNode
}

const StatusItem = ({ icon, iconClassName, iconStyle, label, style, children }: StatusItemProps) => (
  <div className="status-item" style={style}>
    <div className={iconClassName ? `status-icon ${iconClassName}` : 'status-icon'} style={iconStyle}>
      {icon}
    </div>
    <div className="status-content">
      <p className="status-label">{label}</p>
      {children}
    </div>
  </div>
)

const AgvConnectionBadge = ({ connected }: { connected: boolean }) => (
  <div style={{
    padding: '6px 12px',
    marginBottom: '10px',
    borderRadius: '6px',
    fontSize: '13px',
    background: connected ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
    border: `1px solid ${connected ? 'rgba(46, 204, 113, 0.3)' : 'rgba(231, 76, 60, 0.3)'}`,
    color: connected ? '#2ecc71' : '#e74c3c',
  }}>
    {connected ? 'AGV 연결됨' : 'AGV 연결 끊김'}
  </div>
)

const TargetItem = ({ target }: { target: Enemy }) => (
  <StatusItem
    icon="🎯"
    iconStyle={{ fontSize: '20px' }}
    label="현재 타겟"
    style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '12px', marginTop: '8px' }}
  >
    <p className="status-value" style={{ color: '#e74c3c', fontWeight: 'bold' }}>
      {target.name || '적'}
    </p>
    {target.hp !== undefined && (
      <div style={{ marginTop: '4px' }}>
        <div style={{
          width: '100%',
          height: '6px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${target.hp}%`,
            height: '100%',
            backgroundColor: hpColor(target.hp),
            transition: 'width 0.3s ease'
          }} />
        </div>
        <span style={hintStyle}>
          HP: {target.hp}%
        </span>
      </div>
    )}
    {target.x !== undefined && target.y !== undefined && (
      <p className="status-hint" style={{ ...hintStyle, marginTop: '4px' }}>
        위치: ({target.x.toFixed(1)}, {target.y.toFixed(1)})
      </p>
    )}
  </StatusItem>
)

const StatusPanel = ({ agvData }: StatusPanelProps) => {
  const position = agvData?.position || { x: 0, y: 0, angle: 0 }
  const status = agvData?.status || { battery: 0, speed: 0, mode: 'auto', state: 'idle' }
  const detectedEnemies = agvData?.detectedEnemies || []
  const state = stateDisplay(status.state)
  const battery = status.battery || 0

  return (
    <div className="card">
      <h2 className="card-title">AGV 상태</h2>
      <AgvConnectionBadge connected={agvData?.connected ?? false} />

      {/* 상태·위치 두 줄은 한 묶음이다(위치 줄은 묶음의 마지막이라 아래 구분선이 없다). */}
      <div>
        <StatusItem icon={state.icon} iconStyle={{ fontSize: '24px' }} label="상태">
          <p className="status-value" style={{ color: state.color, fontWeight: 'bold' }}>
            {state.text}
          </p>
        </StatusItem>

        <StatusItem icon="📍" iconClassName="blue" label="위치">
          <p className="status-value">
            ({position.x?.toFixed(2)}, {position.y?.toFixed(2)})
          </p>
          {position.angle !== undefined && (
            <p className="status-hint" style={{ ...hintStyle, marginTop: '2px' }}>
              각도: {(position.angle * 180 / Math.PI).toFixed(0)}°
            </p>
          )}
        </StatusItem>
      </div>

      <StatusItem icon="🔋" iconClassName="green" label="배터리">
        <div className="battery-container">
          <div className="battery-bar">
            <div
              className="battery-fill"
              style={{
                width: `${battery}%`,
                backgroundColor: batteryColor(battery)
              }}
            />
          </div>
          <span className="battery-percentage">
            {battery}%
          </span>
        </div>
      </StatusItem>

      <StatusItem icon="⚡" iconClassName="orange" label="속도">
        <p className="status-value">{status.speed?.toFixed(1) || 0} m/s</p>
      </StatusItem>

      <StatusItem icon={status.mode === 'auto' ? '🤖' : '🎮'} label="모드">
        <span className={`mode-badge ${status.mode || 'auto'}`}>
          {status.mode === 'auto' ? '자동' : '수동'}
        </span>
      </StatusItem>

      {agvData?.targetEnemy && <TargetItem target={agvData.targetEnemy} />}

      {detectedEnemies.length > 0 && (
        <StatusItem icon="👁️" iconStyle={{ fontSize: '20px' }} label="감지된 적">
          <p className="status-value">
            {detectedEnemies.length}명
          </p>
        </StatusItem>
      )}
    </div>
  )
}

export default React.memo(StatusPanel)
