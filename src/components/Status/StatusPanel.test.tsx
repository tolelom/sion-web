import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import StatusPanel from './StatusPanel'
import type { AGVData } from '../../types'

// master(2311e85 이후)의 StatusPanel 테스트를 main 타입에 맞춰 옮겼다.
// 마지막 describe는 배터리 색 경계와 상태 라벨 전체를 추가로 고정한다.

afterEach(() => {
  cleanup()
})

const baseAGV = (overrides: Partial<AGVData> = {}): AGVData => ({
  connected: true,
  position: { x: 1.234, y: 5.678, angle: Math.PI / 2 },
  status: { battery: 75, speed: 0.42, mode: 'auto', state: 'moving' },
  detectedEnemies: [],
  targetEnemy: null,
  ...overrides,
})

describe('StatusPanel', () => {
  it('AGV 연결 상태를 배지에 표시한다 (연결됨)', () => {
    render(<StatusPanel agvData={baseAGV({ connected: true })} />)
    expect(screen.getByText('AGV 연결됨')).toBeTruthy()
  })

  it('AGV 연결 상태를 배지에 표시한다 (끊김)', () => {
    render(<StatusPanel agvData={baseAGV({ connected: false })} />)
    expect(screen.getByText('AGV 연결 끊김')).toBeTruthy()
  })

  it('state 값에 따라 한글 라벨로 표시한다', () => {
    render(<StatusPanel agvData={baseAGV({
      status: { battery: 50, speed: 0, mode: 'auto', state: 'moving' },
    })} />)
    expect(screen.getByText('이동 중')).toBeTruthy()
  })

  it('알 수 없는 state는 idle로 폴백한다', () => {
    render(<StatusPanel agvData={baseAGV({
      status: { battery: 10, speed: 0, mode: 'auto', state: 'flying' },
    })} />)
    expect(screen.getByText('대기')).toBeTruthy()
  })

  it('위치를 소수 둘째 자리까지 표시한다', () => {
    render(<StatusPanel agvData={baseAGV()} />)
    expect(screen.getByText('(1.23, 5.68)')).toBeTruthy()
  })

  it('angle을 도(°) 단위로 변환해 표시한다', () => {
    render(<StatusPanel agvData={baseAGV({
      position: { x: 0, y: 0, angle: Math.PI },
    })} />)
    // π rad → 180°
    expect(screen.getByText('각도: 180°')).toBeTruthy()
  })

  it('배터리 퍼센트를 표시한다', () => {
    render(<StatusPanel agvData={baseAGV({
      status: { battery: 88, speed: 0, mode: 'auto', state: 'idle' },
    })} />)
    expect(screen.getByText('88%')).toBeTruthy()
  })

  it('속도를 m/s 단위 소수 첫째자리로 표시한다', () => {
    render(<StatusPanel agvData={baseAGV({
      status: { battery: 50, speed: 1.234, mode: 'auto', state: 'idle' },
    })} />)
    expect(screen.getByText('1.2 m/s')).toBeTruthy()
  })

  it('모드 배지: auto 는 "자동"', () => {
    render(<StatusPanel agvData={baseAGV({
      status: { battery: 50, speed: 0, mode: 'auto', state: 'idle' },
    })} />)
    expect(screen.getByText('자동')).toBeTruthy()
  })

  it('모드 배지: manual 은 "수동"', () => {
    render(<StatusPanel agvData={baseAGV({
      status: { battery: 50, speed: 0, mode: 'manual', state: 'idle' },
    })} />)
    expect(screen.getByText('수동')).toBeTruthy()
  })

  it('targetEnemy가 있으면 이름과 HP를 표시한다', () => {
    render(<StatusPanel agvData={baseAGV({
      targetEnemy: { id: 'e1', name: '미니언', hp: 42, x: 3.21, y: 7.89 },
    })} />)
    expect(screen.getByText('미니언')).toBeTruthy()
    expect(screen.getByText('HP: 42%')).toBeTruthy()
    expect(screen.getByText('위치: (3.2, 7.9)')).toBeTruthy()
  })

  it('targetEnemy가 없으면 타겟 섹션이 렌더되지 않는다', () => {
    render(<StatusPanel agvData={baseAGV({ targetEnemy: null })} />)
    expect(screen.queryByText('현재 타겟')).toBeNull()
  })

  it('감지된 적의 수를 표시한다', () => {
    render(<StatusPanel agvData={baseAGV({
      detectedEnemies: [
        { id: 'a', name: 'A', hp: 100 },
        { id: 'b', name: 'B', hp: 100 },
        { id: 'c', name: 'C', hp: 100 },
      ],
    })} />)
    expect(screen.getByText('3명')).toBeTruthy()
  })

  it('감지된 적이 0명이면 섹션이 렌더되지 않는다', () => {
    render(<StatusPanel agvData={baseAGV({ detectedEnemies: [] })} />)
    expect(screen.queryByText('감지된 적')).toBeNull()
  })

  it('battery=0 이어도 0%로 정상 표시 (?? 사용 검증)', () => {
    render(<StatusPanel agvData={baseAGV({
      status: { battery: 0, speed: 0, mode: 'auto', state: 'idle' },
    })} />)
    expect(screen.getByText('0%')).toBeTruthy()
  })
})

describe('StatusPanel levels and labels', () => {
  const batteryColor = (battery: number) => {
    const { container } = render(<StatusPanel agvData={baseAGV({
      status: { battery, speed: 0, mode: 'auto', state: 'idle' },
    })} />)
    const fill = container.querySelector('.battery-fill') as HTMLElement
    const result = { color: fill.style.backgroundColor, width: fill.style.width }
    cleanup()
    return result
  }

  it('colors the battery by level boundaries', () => {
    expect(batteryColor(61)).toEqual({ color: 'rgb(46, 204, 113)', width: '61%' })
    expect(batteryColor(60)).toEqual({ color: 'rgb(243, 156, 18)', width: '60%' })
    expect(batteryColor(31)).toEqual({ color: 'rgb(243, 156, 18)', width: '31%' })
    expect(batteryColor(30)).toEqual({ color: 'rgb(231, 76, 60)', width: '30%' })
    expect(batteryColor(0)).toEqual({ color: 'rgb(231, 76, 60)', width: '0%' })
  })

  it('labels every simulator state', () => {
    const labels: Record<string, string> = {
      idle: '대기',
      moving: '이동 중',
      charging: '돌진 중',
      searching: '탐색 중',
      stopped: '정지',
      emergency: '긴급 정지',
    }
    for (const [state, label] of Object.entries(labels)) {
      render(<StatusPanel agvData={baseAGV({ status: { battery: 50, speed: 0, mode: 'auto', state } })} />)
      expect(screen.getByText(label)).toBeTruthy()
      cleanup()
    }
    render(<StatusPanel agvData={baseAGV({ status: { battery: 50, speed: 0, mode: 'auto', state: null } })} />)
    expect(screen.getByText('대기')).toBeTruthy()
  })

  it('colors the target HP bar and falls back to a default name', () => {
    const { container } = render(<StatusPanel agvData={baseAGV({
      targetEnemy: { id: 'e', name: '', hp: 25, x: 1, y: 2 },
    })} />)
    expect(screen.getByText('적')).toBeTruthy()
    const bar = Array.from(container.querySelectorAll('div')).find((d) => d.style.width === '25%') as HTMLElement
    expect(bar.style.backgroundColor).toBe('rgb(231, 76, 60)')
  })
})
