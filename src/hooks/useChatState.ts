import { useReducer } from 'react'
import type { ChatMessage, ChatAction } from '../types'

interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  // 메시지 id 카운터. Date.now()를 쓰면 같은 ms에 두 메시지가 추가될 때 React key가 충돌한다.
  nextId: number
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
  nextId: 2,
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
            id: state.nextId,
            type: 'user',
            content: action.payload,
            timestamp: new Date(),
          },
        ],
        nextId: state.nextId + 1,
      }
    case 'ai_message':
      return {
        ...state,
        isLoading: false,
        messages: [
          ...state.messages,
          {
            id: state.nextId,
            type: 'ai',
            content: action.payload,
            timestamp: new Date(),
          },
        ],
        nextId: state.nextId + 1,
      }
    case 'clear':
      return {
        messages: [
          {
            id: state.nextId,
            type: 'ai',
            content: '채팅이 초기화되었습니다. 다시 시작하겠습니다! 🚀',
            timestamp: new Date(),
          },
        ],
        isLoading: false,
        nextId: state.nextId + 1,
      }
    default:
      return state
  }
}

export function useChatState() {
  const [chatState, dispatch] = useReducer(chatReducer, initialState)
  return { messages: chatState.messages, isLoading: chatState.isLoading, dispatch }
}
