import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import ControlPanel from './ControlPanel'
import type { AGVData } from '../../types'

// fake timers는 confirm 모달의 promise resolve와 waitFor의 폴링 setTimeout과 모두 부딪힌다.
// real timer를 쓰고, ControlPanel의 mode toggle 2s setTimeout은 unmount cleanup이 정리한다.

const makeAGVData = (mode: 'auto' | 'manual' = 'auto'): AGVData => ({
  connected: true,
  position: { x: 0, y: 0, angle: 0 },
  status: { battery: 100, speed: 0, mode, state: 'idle' },
  detectedEnemies: [],
  targetEnemy: null,
})

afterEach(() => {
  cleanup()
})

describe('ControlPanel', () => {
  it('mode toggle: 클릭 시 mode_change 명령 전송 + 버튼 disabled', () => {
    const onSend = vi.fn().mockReturnValue(true)
    render(<ControlPanel onSendCommand={onSend} agvData={makeAGVData('auto')} />)

    // 자동 모드 → 클릭하면 manual로 전환 요청.
    const toggle = screen.getByRole('button', { name: /자동 모드/ })
    fireEvent.click(toggle)

    expect(onSend).toHaveBeenCalledWith({ type: 'mode_change', data: { mode: 'manual' } })
    // 응답 대기 동안 isPending → 버튼 비활성 + 라벨 변경.
    const pending = screen.getByRole('button', { name: '변경 중...' }) as HTMLButtonElement
    expect(pending.disabled).toBe(true)
  })

  it('mode toggle: agvData.mode가 외부에서 변경되면 isPending 리셋', () => {
    const onSend = vi.fn().mockReturnValue(true)
    const { rerender } = render(<ControlPanel onSendCommand={onSend} agvData={makeAGVData('auto')} />)
    fireEvent.click(screen.getByRole('button', { name: /자동 모드/ }))
    expect((screen.getByRole('button', { name: '변경 중...' }) as HTMLButtonElement).disabled).toBe(true)

    // 서버 응답이 와서 prop의 mode가 manual로 갱신됐다고 가정.
    rerender(<ControlPanel onSendCommand={onSend} agvData={makeAGVData('manual')} />)

    // isPending이 풀려서 다시 클릭 가능.
    expect((screen.getByRole('button', { name: /수동 모드/ }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('긴급 정지: confirm 확인 → emergency_stop 전송 후 alert 모달', async () => {
    const onSend = vi.fn().mockReturnValue(true)
    render(<ControlPanel onSendCommand={onSend} agvData={makeAGVData('auto')} />)

    fireEvent.click(screen.getByRole('button', { name: /긴급 정지/ }))

    // 1단계: 확인 모달
    await waitFor(() => expect(screen.getByText('AGV를 긴급 정지하시겠습니까?')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: '확인' }))

    // emergency_stop 명령이 전송되어야.
    await waitFor(() => {
      const call = onSend.mock.calls.find(([msg]) => (msg as { type: string }).type === 'emergency_stop')
      expect(call).toBeTruthy()
    })

    // 2단계: 알림 모달이 이어서 뜬다.
    await waitFor(() => expect(screen.getByText('긴급 정지 명령이 전송되었습니다.')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
  })

  it('긴급 정지: confirm 취소 → 명령 미전송', async () => {
    const onSend = vi.fn().mockReturnValue(true)
    render(<ControlPanel onSendCommand={onSend} agvData={makeAGVData('auto')} />)

    fireEvent.click(screen.getByRole('button', { name: /긴급 정지/ }))
    await waitFor(() => expect(screen.getByText('AGV를 긴급 정지하시겠습니까?')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: '취소' }))

    await waitFor(() => expect(screen.queryByText('AGV를 긴급 정지하시겠습니까?')).toBeNull())
    expect(onSend).not.toHaveBeenCalled()
  })

  it('초기화: confirm 확인 → command(reset) + mode_change(auto) 2건 전송', async () => {
    const onSend = vi.fn().mockReturnValue(true)
    render(<ControlPanel onSendCommand={onSend} agvData={makeAGVData('manual')} />)

    fireEvent.click(screen.getByRole('button', { name: /초기화/ }))
    await waitFor(() => expect(screen.getByText(/초기화하시겠습니까/)).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: '확인' }))

    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(2))
    const types = onSend.mock.calls.map(([msg]) => (msg as { type: string }).type)
    expect(types).toContain('command')
    expect(types).toContain('mode_change')

    // alert 모달 닫기.
    await waitFor(() => expect(screen.getByText('AGV가 초기화되었습니다.')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
  })
})
