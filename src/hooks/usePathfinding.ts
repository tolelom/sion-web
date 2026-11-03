import { useState, useCallback, useEffect, useRef } from 'react'
import type { Point } from '../types'
import { MAP_SIZE } from '../constants'
import { API_BASE_URL, API_TIMEOUT_MS } from '../config'

interface PathfindingResult {
  path: Point[]
  isLoading: boolean
  error: string | null
  findPath: (start: Point, goal: Point, obstacles?: Point[]) => Promise<Point[] | null>
  clearPath: () => void
}

// POST /api/pathfinding 응답. 실패하면 success=false와 message가 온다.
interface PathfindingResponse {
  success?: boolean
  path?: unknown
  message?: string
}

// 경로 탐색 요청은 한 번에 하나만 유효하다. 새 요청을 보내면 이전 요청은 취소하고,
// 늦게 도착한 이전 응답은 상태를 바꾸지 않고 null로 끝난다.
export const usePathfinding = (): PathfindingResult => {
  const [path, setPath] = useState<Point[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const activeRequestRef = useRef<AbortController | null>(null)

  useEffect(() => () => {
    const active = activeRequestRef.current
    activeRequestRef.current = null
    active?.abort()
  }, [])

  const findPath = useCallback(async (start: Point, goal: Point, obstacles: Point[] = []): Promise<Point[] | null> => {
    activeRequestRef.current?.abort()
    const controller = new AbortController()
    activeRequestRef.current = controller
    const isCurrent = () => activeRequestRef.current === controller

    setIsLoading(true)
    setError(null)

    const requestData = {
      start: { x: start.x, y: start.y },
      goal: { x: goal.x, y: goal.y },
      map_width: MAP_SIZE,
      map_height: MAP_SIZE,
      obstacles: obstacles,
    }

    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

    try {
      const response = await fetch(`${API_BASE_URL}/api/pathfinding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
        signal: controller.signal,
      })
      const data = await response.json() as PathfindingResponse
      if (!isCurrent()) return null
      console.log('경로 탐색 응답:', data)

      if (data.success && Array.isArray(data.path)) {
        const found = data.path as Point[]
        setPath(found)
        console.log('경로 탐색 성공:', found.length, '개 웨이포인트')
        return found
      }
      console.error('경로 탐색 실패:', data.message)
      setError(data.message || '경로를 찾을 수 없습니다')
      setPath([])
      return null
    } catch (err) {
      if (!isCurrent()) return null
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
      clearTimeout(timeoutId)
      if (isCurrent()) {
        activeRequestRef.current = null
        setIsLoading(false)
      }
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
