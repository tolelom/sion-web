import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { usePathfinding } from './usePathfinding'

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response
}

describe('usePathfinding', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('성공 응답 시 path를 세팅하고 반환', async () => {
    const path = [{ x: 0, y: 0 }, { x: 1, y: 1 }]
    ;(globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ success: true, path }),
    )

    const { result } = renderHook(() => usePathfinding())

    let returned: unknown
    await act(async () => {
      returned = await result.current.findPath({ x: 0, y: 0 }, { x: 1, y: 1 })
    })

    expect(returned).toEqual(path)
    expect(result.current.path).toEqual(path)
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('success=false면 error 세팅, path는 빈 배열, null 반환', async () => {
    ;(globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ success: false, message: '경로 없음' }),
    )

    const { result } = renderHook(() => usePathfinding())

    let returned: unknown
    await act(async () => {
      returned = await result.current.findPath({ x: 0, y: 0 }, { x: 9, y: 9 })
    })

    expect(returned).toBeNull()
    expect(result.current.path).toEqual([])
    expect(result.current.error).toBe('경로 없음')
  })

  it('fetch가 AbortError를 던지면 타임아웃 메시지', async () => {
    const abortErr = new Error('aborted')
    abortErr.name = 'AbortError'
    ;(globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(abortErr)

    const { result } = renderHook(() => usePathfinding())

    let returned: unknown
    await act(async () => {
      returned = await result.current.findPath({ x: 0, y: 0 }, { x: 1, y: 1 })
    })

    expect(returned).toBeNull()
    expect(result.current.error).toBe('요청 타임아웃')
    expect(result.current.path).toEqual([])
  })

  it('일반 에러는 서버 연결 실패 메시지', async () => {
    ;(globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => usePathfinding())

    await act(async () => {
      await result.current.findPath({ x: 0, y: 0 }, { x: 1, y: 1 })
    })

    expect(result.current.error).toBe('서버 연결 실패')
  })

  it('clearPath는 path와 error를 초기화', async () => {
    ;(globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ success: true, path: [{ x: 1, y: 1 }] }),
    )

    const { result } = renderHook(() => usePathfinding())

    await act(async () => {
      await result.current.findPath({ x: 0, y: 0 }, { x: 1, y: 1 })
    })
    expect(result.current.path.length).toBe(1)

    act(() => {
      result.current.clearPath()
    })

    await waitFor(() => {
      expect(result.current.path).toEqual([])
      expect(result.current.error).toBeNull()
    })
  })
})
