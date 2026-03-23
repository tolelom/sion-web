import { useReducer } from 'react'
import type { ChatMessage, ChatAction } from '../types'

interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 1,
  type: 'ai',
  content: '안녕하세요! 저는 AGV 사이온의 AI 해설자입니다. 🤖\n사이온의 행동을 실시간으로 설명해드리겠습니다.',
  timestamp: new Date(),
}

const initialState: ChatState = {
  messages: [INITIAL_MESSAGE],
  isLoading: false,
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'user_message':
      return {
        ...state,
        isLoading: true,
        messages: [
          ...state.messages,
          {
            id: Date.now(),
            type: 'user',
            content: action.payload,
            timestamp: new Date(),
          },
        ],
      }
    case 'ai_message':
      return {
        ...state,
        isLoading: false,
        messages: [
          ...state.messages,
          {
            id: Date.now(),
            type: 'ai',
            content: action.payload,
            timestamp: new Date(),
          },
        ],
      }
    case 'clear':
      return {
        messages: [
          {
            id: Date.now(),
            type: 'ai',
            content: '채팅이 초기화되었습니다. 다시 시작하겠습니다! 🚀',
            timestamp: new Date(),
          },
        ],
        isLoading: false,
      }
    default:
      return state
  }
}

export function useChatState() {
  const [chatState, dispatch] = useReducer(chatReducer, initialState)
  return { messages: chatState.messages, isLoading: chatState.isLoading, dispatch }
}
