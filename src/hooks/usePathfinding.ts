import { useState, useCallback } from 'react'
import type { Point } from '../types'

export interface FindPathOptions {
  mapWidth?: number
  mapHeight?: number
  timeoutMs?: number
}

interface PathfindingResult {
  path: Point[]
  isLoading: boolean
  error: string | null
  findPath: (start: Point, goal: Point, obstacles?: Point[], options?: FindPathOptions) => Promise<Point[] | null>
  clearPath: () => void
}

// 백엔드 A* 그리드 크기. 호출 측이 자체 크기를 갖는 경우 findPath의 options 인자로 덮어쓴다.
const DEFAULT_MAP_WIDTH = 20
const DEFAULT_MAP_HEIGHT = 20
const DEFAULT_TIMEOUT_MS = 10000

export const usePathfinding = (): PathfindingResult => {
  const [path, setPath] = useState<Point[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const findPath = useCallback(async (start: Point, goal: Point, obstacles: Point[] = [], options: FindPathOptions = {}): Promise<Point[] | null> => {
    setIsLoading(true)
    setError(null)

    const requestData = {
      start,
      goal,
      map_width: options.mapWidth ?? DEFAULT_MAP_WIDTH,
      map_height: options.mapHeight ?? DEFAULT_MAP_HEIGHT,
      obstacles,
    }

    // env가 미설정/빈문자열이면 Number(undefined|'') → NaN. `??`는 nullish만 fallback하므로 NaN을 거르지 못한다.
    // 그래서 env fallback은 falsy 친화적인 ||로 둔다(0/NaN/'' → DEFAULT).
    const timeoutMs = options.timeoutMs ?? (Number(import.meta.env.VITE_API_TIMEOUT) || DEFAULT_TIMEOUT_MS)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/api/pathfinding`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
          signal: controller.signal,
        }
      )
      clearTimeout(timeoutId)

      const data = await response.json()

      if (data.success && data.path) {
        setPath(data.path)
        return data.path
      }
      console.error('경로 탐색 실패:', data.message)
      setError(data.message || '경로를 찾을 수 없습니다')
      setPath([])
      return null
    } catch (err) {
      clearTimeout(timeoutId)
      if (err instanceof Error && err.name === 'AbortError') {
        console.error('경로 탐색 타임아웃')
        setError('요청 타임아웃')
      } else {
        console.error('경로 탐색 API 오류:', err)
        setError('서버 연결 실패')
      }
      setPath([])
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearPath = useCallback(() => {
    setPath([])
    setError(null)
  }, [])

  return {
    path,
    isLoading,
    error,
    findPath,
    clearPath,
  }
}
