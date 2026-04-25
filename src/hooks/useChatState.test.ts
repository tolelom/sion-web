import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useChatState } from './useChatState'

describe('useChatState', () => {
  it('초기 상태는 AI welcome 메시지 1개, isLoading=false', () => {
    const { result } = renderHook(() => useChatState())
    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0].type).toBe('ai')
    expect(result.current.isLoading).toBe(false)
  })

  it('user_message dispatch는 메시지를 추가하고 isLoading=true', () => {
    const { result } = renderHook(() => useChatState())

    act(() => {
      result.current.dispatch({ type: 'user_message', payload: '안녕' })
    })

    expect(result.current.messages).toHaveLength(2)
    const userMsg = result.current.messages[1]
    expect(userMsg.type).toBe('user')
    expect(userMsg.content).toBe('안녕')
    expect(result.current.isLoading).toBe(true)
  })

  it('ai_message dispatch는 메시지를 추가하고 isLoading=false', () => {
    const { result } = renderHook(() => useChatState())

    act(() => {
      result.current.dispatch({ type: 'user_message', payload: 'Q' })
    })
    expect(result.current.isLoading).toBe(true)

    act(() => {
      result.current.dispatch({ type: 'ai_message', payload: 'A' })
    })

    expect(result.current.messages).toHaveLength(3)
    const aiMsg = result.current.messages[2]
    expect(aiMsg.type).toBe('ai')
    expect(aiMsg.content).toBe('A')
    expect(result.current.isLoading).toBe(false)
  })

  it('clear는 단일 안내 메시지로 리셋하고 isLoading=false', () => {
    const { result } = renderHook(() => useChatState())

    act(() => {
      result.current.dispatch({ type: 'user_message', payload: 'X' })
      result.current.dispatch({ type: 'ai_message', payload: 'Y' })
    })
    expect(result.current.messages.length).toBeGreaterThan(1)

    act(() => {
      result.current.dispatch({ type: 'clear' })
    })

    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0].type).toBe('ai')
    expect(result.current.messages[0].content).toContain('초기화')
    expect(result.current.isLoading).toBe(false)
  })
})
