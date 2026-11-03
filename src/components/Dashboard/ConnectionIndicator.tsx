import type { ConnectionStatus } from '../../hooks/useWebSocket'

interface ConnectionIndicatorProps {
  status: ConnectionStatus
  onRetry: () => void
}

const ConnectionIndicator = ({ status, onRetry }: ConnectionIndicatorProps) => (
  <div className="connection-status">
    <div className={`status-dot ${status}`} />
    <span className="status-text">
      {status === 'connected' && '서버 연결됨'}
      {status === 'reconnecting' && '재연결 중...'}
      {status === 'disconnected' && (
        <>
          서버 연결 실패
          <button
            onClick={onRetry}
            style={{ marginLeft: '8px', padding: '2px 8px', fontSize: '12px', cursor: 'pointer' }}
          >
            재연결
          </button>
        </>
      )}
    </span>
  </div>
)

export default ConnectionIndicator
