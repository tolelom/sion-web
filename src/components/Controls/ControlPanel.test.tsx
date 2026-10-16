import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import ControlPanel from './ControlPanel'
import type { AGVData } from '../../types'

const agv: AGVData = {
  connected: true,
  position: { x: 2, y: 2, angle: 0 },
  status: { battery: 100, speed: 1, mode: 'auto', state: 'searching' },
  detectedEnemies: [],
  targetEnemy: null,
}

afterEach(cleanup)

describe('ControlPanel', () => {
  it('sends the emergency stop with one click', () => {
    const send = vi.fn(() => true)
    render(<ControlPanel onSendCommand={send} agvData={agv} isConnected />)
    fireEvent.click(screen.getByText(/긴급 정지/))
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ type: 'emergency_stop' }))
    expect(screen.queryByText(/전송되었습니다/)).toBeNull()
  })

  it('reports a failed emergency stop instead of claiming success', async () => {
    const send = vi.fn(() => false)
    render(<ControlPanel onSendCommand={send} agvData={agv} isConnected />)
    await act(async () => {
      fireEvent.click(screen.getByText(/긴급 정지/))
    })
    expect(screen.getByText(/보내지 못했습니다/)).toBeTruthy()
    expect(screen.queryByText(/전송되었습니다/)).toBeNull()
  })

  it('disables every control while disconnected', () => {
    render(<ControlPanel onSendCommand={vi.fn(() => false)} agvData={agv} isConnected={false} />)
    for (const button of screen.getAllByRole('button')) {
      expect((button as HTMLButtonElement).disabled).toBe(true)
    }
  })

  it('reports a failed reset instead of claiming success', async () => {
    const send = vi.fn(() => false)
    render(<ControlPanel onSendCommand={send} agvData={agv} isConnected />)
    await act(async () => {
      fireEvent.click(screen.getByText(/초기화/))
    })
    await act(async () => {
      fireEvent.click(screen.getByText('확인'))
    })
    expect(screen.getByText(/보내지 못했습니다/)).toBeTruthy()
    expect(screen.queryByText(/초기화되었습니다/)).toBeNull()
  })
})
