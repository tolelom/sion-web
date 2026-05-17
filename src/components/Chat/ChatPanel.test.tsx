import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import ChatPanel from './ChatPanel'
import type { ChatMessage } from '../../types'

// jsdom은 scrollIntoView를 구현하지 않는다. ChatPanel의 messagesEndRef.scrollIntoView 호출이 throw하므로 stub.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

const makeMessages = (): ChatMessage[] => [
  { id: 1, type: 'ai', content: '안녕하세요', timestamp: new Date() },
  { id: 2, type: 'user', content: '상황 알려줘', timestamp: new Date() },
]

afterEach(() => {
  cleanup()
})

describe('ChatPanel', () => {
  it('messages prop을 ai/user 구분해 렌더', () => {
    render(
      <ChatPanel
        messages={makeMessages()}
        isLoading={false}
        onChatDispatch={vi.fn()}
        onSendMessage={vi.fn()}
        isConnected={true}
      />
    )

    expect(screen.getByText('안녕하세요')).toBeTruthy()
    expect(screen.getByText('상황 알려줘')).toBeTruthy()
    // ai/user 라벨 둘 다 존재.
    expect(screen.getByText('AI 해설자')).toBeTruthy()
    expect(screen.getByText('사용자')).toBeTruthy()
  })

  it('입력 후 전송 클릭 → onChatDispatch(user_message) + onSendMessage(chat)', () => {
    const onDispatch = vi.fn()
    const onSend = vi.fn().mockReturnValue(true)
    render(
      <ChatPanel
        messages={[]}
        isLoading={false}
        onChatDispatch={onDispatch}
        onSendMessage={onSend}
        isConnected={true}
      />
    )

    const input = screen.getByPlaceholderText(/메시지를 입력하세요/) as HTMLTextAreaElement
    fireEvent.change(input, { target: { value: '안녕' } })
    expect(input.value).toBe('안녕')

    // disabled가 풀린 전송 버튼(텍스트는 📤 아이콘)을 누른다.
    const buttons = screen.getAllByRole('button')
    const sendBtn = buttons.find(b => b.textContent === '📤') as HTMLButtonElement
    expect(sendBtn.disabled).toBe(false)
    fireEvent.click(sendBtn)

    expect(onDispatch).toHaveBeenCalledWith({ type: 'user_message', payload: '안녕' })
    expect(onSend).toHaveBeenCalledTimes(1)
    const [msg] = onSend.mock.calls[0]
    expect((msg as { type: string }).type).toBe('chat')
    // 전송 후 input 비워짐.
    expect(input.value).toBe('')
  })

  it('!isConnected면 input/send 비활성, dispatch 미호출', () => {
    const onDispatch = vi.fn()
    const onSend = vi.fn().mockReturnValue(true)
    render(
      <ChatPanel
        messages={[]}
        isLoading={false}
        onChatDispatch={onDispatch}
        onSendMessage={onSend}
        isConnected={false}
      />
    )

    const input = screen.getByPlaceholderText(/서버에 연결되지 않았습니다/) as HTMLTextAreaElement
    expect(input.disabled).toBe(true)

    // disabled 상태라 fireEvent.change가 통과하더라도 handleSendMessage의 isConnected 가드로 dispatch 안 됨.
    fireEvent.change(input, { target: { value: '안녕' } })
    const buttons = screen.getAllByRole('button')
    const sendBtn = buttons.find(b => b.textContent === '📤' || b.textContent === '⏳')
    if (sendBtn) {
      expect((sendBtn as HTMLButtonElement).disabled).toBe(true)
    }

    expect(onDispatch).not.toHaveBeenCalled()
    expect(onSend).not.toHaveBeenCalled()
  })

  it('clear 버튼 → confirm 모달 → 확인 시 onChatDispatch(clear)', async () => {
    const onDispatch = vi.fn()
    render(
      <ChatPanel
        messages={makeMessages()}
        isLoading={false}
        onChatDispatch={onDispatch}
        onSendMessage={vi.fn()}
        isConnected={true}
      />
    )

    fireEvent.click(screen.getByTitle('채팅 초기화'))
    await waitFor(() => expect(screen.getByText('채팅 기록을 모두 삭제하시겠습니까?')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: '확인' }))

    await waitFor(() => expect(onDispatch).toHaveBeenCalledWith({ type: 'clear' }))
  })

  it('quick command 클릭 시 input value가 해당 텍스트로 채워짐', () => {
    render(
      <ChatPanel
        messages={[]}
        isLoading={false}
        onChatDispatch={vi.fn()}
        onSendMessage={vi.fn()}
        isConnected={true}
      />
    )

    const input = screen.getByPlaceholderText(/메시지를 입력하세요/) as HTMLTextAreaElement
    fireEvent.click(screen.getByRole('button', { name: /상황 설명/ }))
    expect(input.value).toBe('현재 상황을 설명해줘')

    fireEvent.click(screen.getByRole('button', { name: /다음 행동/ }))
    expect(input.value).toBe('다음 행동은?')
  })
})
