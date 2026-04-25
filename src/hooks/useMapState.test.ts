import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useMapState } from './useMapState'

describe('useMapState', () => {
  it('초기 상태: 빈 obstacles, 20x20, 빈 path', () => {
    const { result } = renderHook(() => useMapState())
    expect(result.current.mapData).toEqual({ obstacles: [], width: 20, height: 20 })
    expect(result.current.pathData).toEqual({ points: [], length: 0, algorithm: '', createdAt: null })
  })

  it('path_update: 누락 필드는 기본값으로 리셋 (?? 폴백 없음, 직접 기본값)', () => {
    const { result } = renderHook(() => useMapState())

    const points = [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }]
    act(() => {
      result.current.dispatch({
        type: 'path_update',
        payload: { points, length: 2.83, algorithm: 'astar', created_at: '2026-04-25T00:00:00Z' },
      })
    })
    expect(result.current.pathData.points).toEqual(points)
    expect(result.current.pathData.length).toBeCloseTo(2.83)
    expect(result.current.pathData.algorithm).toBe('astar')
    expect(result.current.pathData.createdAt).toBe('2026-04-25T00:00:00Z')

    // 빈 페이로드는 path를 초기화
    act(() => {
      result.current.dispatch({ type: 'path_update', payload: {} })
    })
    expect(result.current.pathData).toEqual({ points: [], length: 0, algorithm: '', createdAt: null })
  })

  it('map_update: 부분 갱신은 기존 값을 유지 (?? 폴백)', () => {
    const { result } = renderHook(() => useMapState())

    // obstacles만 업데이트, width/height 유지
    const obstacles = [{ x: 5, y: 5 }, { x: 6, y: 6 }]
    act(() => {
      result.current.dispatch({ type: 'map_update', payload: { obstacles } })
    })
    expect(result.current.mapData.obstacles).toEqual(obstacles)
    expect(result.current.mapData.width).toBe(20)
    expect(result.current.mapData.height).toBe(20)

    // width만 업데이트, obstacles 유지
    act(() => {
      result.current.dispatch({ type: 'map_update', payload: { width: 30 } })
    })
    expect(result.current.mapData.obstacles).toEqual(obstacles)
    expect(result.current.mapData.width).toBe(30)
    expect(result.current.mapData.height).toBe(20)
  })

  it('path_update와 map_update는 서로 영향을 주지 않음', () => {
    const { result } = renderHook(() => useMapState())

    act(() => {
      result.current.dispatch({ type: 'map_update', payload: { width: 10, height: 12 } })
      result.current.dispatch({ type: 'path_update', payload: { points: [{ x: 1, y: 1 }], length: 1 } })
    })

    expect(result.current.mapData.width).toBe(10)
    expect(result.current.mapData.height).toBe(12)
    expect(result.current.pathData.points).toHaveLength(1)
  })
})
