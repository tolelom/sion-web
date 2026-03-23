export interface ChatMessage {
  id: number
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

export type ChatAction =
  | { type: 'user_message'; payload: string }
  | { type: 'ai_message'; payload: string }
  | { type: 'clear' }
