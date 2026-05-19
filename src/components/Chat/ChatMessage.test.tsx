import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import ChatMessage from './ChatMessage'
import type { ChatMessage as ChatMessageType } from '../../types'

const makeMessage = (overrides: Partial<ChatMessageType> = {}): ChatMessageType => ({
  id: 1,
  type: 'user',
  content: '안녕',
  timestamp: new Date('2026-05-19T12:00:00Z'),
  ...overrides,
})

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-05-19T12:00:30Z')) // 메시지 후 30초
})

afterEach(() => {
  vi.useRealTimers()
  cleanup()
})

describe('ChatMessage', () => {
  it('user 타입은 사용자 아바타/라벨을 표시한다', () => {
    render(<ChatMessage message={makeMessage({ type: 'user' })} />)
    expect(screen.getByText('사용자')).toBeTruthy()
    expect(screen.getByText('👤')).toBeTruthy()
  })

  it('ai 타입은 AI 해설자 아바타/라벨을 표시한다', () => {
    render(<ChatMessage message={makeMessage({ type: 'ai' })} />)
    expect(screen.getByText('AI 해설자')).toBeTruthy()
    expect(screen.getByText('🤖')).toBeTruthy()
  })

  it('메시지 내용을 표시한다', () => {
    render(<ChatMessage message={makeMessage({ content: '경로 계획 중입니다' })} />)
    expect(screen.getByText('경로 계획 중입니다')).toBeTruthy()
  })

  it('개행 문자가 있으면 각 줄을 별도 <p>로 렌더한다', () => {
    const { container } = render(
      <ChatMessage message={makeMessage({ content: '첫째 줄\n둘째 줄\n셋째 줄' })} />
    )
    const paragraphs = container.querySelectorAll('.message-text p')
    expect(paragraphs).toHaveLength(3)
    expect(paragraphs[0].textContent).toBe('첫째 줄')
    expect(paragraphs[2].textContent).toBe('셋째 줄')
  })

  it('type에 해당하는 className이 적용된다', () => {
    const { container } = render(<ChatMessage message={makeMessage({ type: 'ai' })} />)
    const wrapper = container.querySelector('.chat-message')
    expect(wrapper?.className).toContain('ai')
  })

  it('초기 마운트에서 timeAgo가 렌더된다 (한국어 상대 시간)', () => {
    render(<ChatMessage message={makeMessage()} />)
    // date-fns/ko로 "1분 미만 전" 같은 텍스트
    const timeEl = screen.getByText(/(전|후)/)
    expect(timeEl).toBeTruthy()
  })

  it('1분 간격 ticker로 timeAgo가 갱신된다', () => {
    render(<ChatMessage message={makeMessage()} />)
    const before = screen.getByText(/(전|후)/).textContent

    // 5분 경과
    act(() => {
      vi.setSystemTime(new Date('2026-05-19T12:05:30Z'))
      vi.advanceTimersByTime(60_000)
    })

    const after = screen.getByText(/(전|후)/).textContent
    expect(after).not.toBe(before)
  })

  it('언마운트 시 interval이 정리된다', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    const { unmount } = render(<ChatMessage message={makeMessage()} />)
    unmount()
    expect(clearIntervalSpy).toHaveBeenCalled()
  })
})
