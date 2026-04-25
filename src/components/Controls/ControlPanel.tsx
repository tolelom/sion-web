import React, { useState, useEffect, useRef } from 'react'
import ConfirmModal from '../Common/ConfirmModal'
import { useConfirmDialog } from '../../hooks/useConfirmDialog'
import type { AGVData } from '../../types'

interface ControlPanelProps {
  onSendCommand: (message: unknown) => boolean
  agvData: AGVData
}

const ControlPanel = ({ onSendCommand, agvData }: ControlPanelProps) => {
  const mode = agvData?.status?.mode ?? 'auto'
  const [isPending, setIsPending] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevModeRef = useRef(mode)
  const { dialogState, confirm, alert, handleConfirm, handleCancel } = useConfirmDialog()

  useEffect(() => {
    if (mode !== prevModeRef.current) {
      prevModeRef.current = mode
      if (isPending) {
        setIsPending(false)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
      }
    }
  }, [mode, isPending])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleModeToggle = () => {
    if (isPending) return

    const newMode = mode === 'auto' ? 'manual' : 'auto'
    setIsPending(true)

    onSendCommand({
      type: 'mode_change',
      data: { mode: newMode },
    })

    console.log(`모드 변경 요청: ${mode} → ${newMode}`)

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null
      setIsPending(false)
      console.warn('모드 변경 응답 타임아웃')
    }, 2000)
  }

  const handleEmergencyStop = async () => {
    if (!await confirm('AGV를 긴급 정지하시겠습니까?', '긴급 정지')) return

    onSendCommand({
      type: 'emergency_stop',
      data: {
        reason: 'User requested emergency stop',
        timestamp: Date.now()
      },
    })

    console.log('긴급 정지 명령 전송')
    await alert('긴급 정지 명령이 전송되었습니다.', '긴급 정지')
  }

  const handleReset = async () => {
    if (!await confirm(
      'AGV를 초기화하시겠습니까?\n\n- 현재 경로가 취소됩니다\n- 시작 위치로 돌아갑니다\n- 모드가 자동 모드로 변경됩니다',
      'AGV 초기화'
    )) return

    onSendCommand({
      type: 'command',
      data: {
        action: 'reset',
        target_x: 0,
        target_y: 0,
        timestamp: Date.now()
      },
    })

    onSendCommand({
      type: 'mode_change',
      data: { mode: 'auto' },
    })

    console.log('AGV 초기화 명령 전송')
    await alert('AGV가 초기화되었습니다.', 'AGV 초기화')
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
          disabled={isPending}
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
        >
          ⏹️ 긴급 정지
        </button>

        <button
          onClick={handleReset}
          className="control-btn secondary"
          title="AGV 초기화 (시작 위치로 복귀)"
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
