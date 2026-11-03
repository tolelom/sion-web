import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useMapState } from './useMapState'

describe('useMapState', () => {
  it('초기 상태: 빈 obstacles, 20x20', () => {
    const { result } = renderHook(() => useMapState())
    expect(result.current.mapData).toEqual({ obstacles: [], width: 20, height: 20 })
  })

  it('map_update: 부분 갱신은 기존 값을 유지 (?? 폴백)', () => {
    const { result } = renderHook(() => useMapState())

    const obstacles = [{ x: 5, y: 5 }, { x: 6, y: 6 }]
    act(() => {
      result.current.dispatch({ type: 'map_update', payload: { obstacles } })
    })
    expect(result.current.mapData.obstacles).toEqual(obstacles)
    expect(result.current.mapData.width).toBe(20)
    expect(result.current.mapData.height).toBe(20)

    act(() => {
      result.current.dispatch({ type: 'map_update', payload: { width: 30 } })
    })
    expect(result.current.mapData.obstacles).toEqual(obstacles)
    expect(result.current.mapData.width).toBe(30)
    expect(result.current.mapData.height).toBe(20)
  })
})
