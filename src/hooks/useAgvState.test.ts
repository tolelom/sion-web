import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useAgvState } from './useAgvState'
import type { Enemy } from '../types'

const enemyA: Enemy = { id: 'a', name: 'A', hp: 100 }
const enemyB: Enemy = { id: 'b', name: 'B', hp: 50 }

describe('useAgvState', () => {
  it('초기 상태: 비연결, position 0,0,0, battery 100, mode auto', () => {
    const { result } = renderHook(() => useAgvState())
    const d = result.current.agvData
    expect(d.connected).toBe(false)
    expect(d.position).toEqual({ x: 0, y: 0, angle: 0 })
    expect(d.status.battery).toBe(100)
    expect(d.status.mode).toBe('auto')
    expect(d.detectedEnemies).toEqual([])
    expect(d.targetEnemy).toBeNull()
  })

  it('position dispatch는 좌표를 교체', () => {
    const { result } = renderHook(() => useAgvState())

    act(() => {
      result.current.dispatch({ type: 'position', payload: { x: 5, y: 7, angle: 1.2 } })
    })

    expect(result.current.agvData.position).toEqual({ x: 5, y: 7, angle: 1.2 })
  })

  it('status: 누락 필드는 기존 값 유지 (?? 폴백)', () => {
    const { result } = renderHook(() => useAgvState())

    // 첫 status: battery만 갱신
    act(() => {
      result.current.dispatch({ type: 'status', payload: { battery: 80 } })
    })
    expect(result.current.agvData.status.battery).toBe(80)
    expect(result.current.agvData.status.speed).toBe(0)
    expect(result.current.agvData.status.mode).toBe('auto')

    // 다음 status: mode만 갱신, battery 유지
    act(() => {
      result.current.dispatch({ type: 'status', payload: { mode: 'manual' } })
    })
    expect(result.current.agvData.status.battery).toBe(80)
    expect(result.current.agvData.status.mode).toBe('manual')
  })

  it('status payload의 detected_enemies / target_enemy 반영', () => {
    const { result } = renderHook(() => useAgvState())

    act(() => {
      result.current.dispatch({
        type: 'status',
        payload: { detected_enemies: [enemyA, enemyB], target_enemy: enemyA },
      })
    })

    expect(result.current.agvData.detectedEnemies).toEqual([enemyA, enemyB])
    expect(result.current.agvData.targetEnemy).toEqual(enemyA)
  })

  it('target_found는 enemies/target을 교체 (누락 시 빈 배열/null)', () => {
    const { result } = renderHook(() => useAgvState())

    act(() => {
      result.current.dispatch({ type: 'target_found', payload: { enemies: [enemyA], target: enemyA } })
    })
    expect(result.current.agvData.detectedEnemies).toEqual([enemyA])
    expect(result.current.agvData.targetEnemy).toEqual(enemyA)

    act(() => {
      result.current.dispatch({ type: 'target_found', payload: {} })
    })
    expect(result.current.agvData.detectedEnemies).toEqual([])
    expect(result.current.agvData.targetEnemy).toBeNull()
  })

  it('agv_connection은 connected 플래그만 토글', () => {
    const { result } = renderHook(() => useAgvState())

    act(() => {
      result.current.dispatch({ type: 'agv_connection', payload: { connected: true } })
    })
    expect(result.current.agvData.connected).toBe(true)

    act(() => {
      result.current.dispatch({ type: 'agv_connection', payload: { connected: false } })
    })
    expect(result.current.agvData.connected).toBe(false)
  })
})
