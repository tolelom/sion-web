import React, { useState, useEffect, useRef } from 'react'
import ConfirmModal from '../Common/ConfirmModal'
import { useConfirmDialog } from '../../hooks/useConfirmDialog'
import type { AGVData } from '../../types'

interface ControlPanelProps {
  onSendCommand: (message: unknown) => boolean
  agvData: AGVData
  isConnected: boolean
}

const ControlPanel = ({ onSendCommand, agvData, isConnected }: ControlPanelProps) => {
  const mode = agvData?.status?.mode ?? 'auto'
  const [pendingMode, setPendingMode] = useState<string | null>(null)
  const isPending = pendingMode !== null && pendingMode !== mode
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { dialogState, confirm, alert, handleConfirm, handleCancel } = useConfirmDialog()

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const notSent = (what: string) =>
    alert(`서버에 연결되어 있지 않아 ${what} 명령을 보내지 못했습니다.`, '전송 실패')

  const handleModeToggle = () => {
    if (isPending) return

    const newMode = mode === 'auto' ? 'manual' : 'auto'
    if (!onSendCommand({ type: 'mode_change', data: { mode: newMode } })) {
      notSent('모드 변경')
      return
    }
    setPendingMode(newMode)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null
      setPendingMode(null)
    }, 2000)
  }

  const handleEmergencyStop = () => {
    if (!onSendCommand({ type: 'emergency_stop', data: { reason: 'User requested emergency stop' } })) {
      notSent('긴급 정지')
    }
  }

  const handleReset = async () => {
    if (!await confirm(
      'AGV를 초기화하시겠습니까?\n\n- 현재 경로가 취소됩니다\n- 시작 위치로 돌아갑니다\n- 모드가 자동 모드로 변경됩니다',
      'AGV 초기화'
    )) return

    if (!onSendCommand({ type: 'command', data: { action: 'reset' } })) {
      notSent('초기화')
    }
  }

  return (
    <>
    <ConfirmModal {...dialogState} onConfirm={handleConfirm} onCancel={handleCancel} />
    <div className="card">
      <h2 className="card-title">제어</h2>

      <div className="control-buttons">
        <button
          onClick={handleModeToggle}
          className="control-btn primary"
          title="자동/수동 모드 전환"
          disabled={isPending || !isConnected}
        >
          {isPending
            ? '변경 중...'
            : mode === 'auto' ? '▶️ 자동 모드' : '⏸️ 수동 모드'
          }
        </button>

        <button
          onClick={handleEmergencyStop}
          className="control-btn danger"
          title="AGV 긴급 정지"
          disabled={!isConnected}
        >
          ⏹️ 긴급 정지
        </button>

        <button
          onClick={handleReset}
          className="control-btn secondary"
          title="AGV 초기화 (시작 위치로 복귀)"
          disabled={!isConnected}
        >
          🔄 초기화
        </button>
      </div>

      <div className="info-box">
        <p>💡 맵을 클릭하면 AGV가 해당 위치로 이동합니다</p>
      </div>
    </div>
    </>
  )
}

export default React.memo(ControlPanel)
