import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { ChatMessage as ChatMessageType } from '../../types'

interface ChatMessageProps {
  message: ChatMessageType
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const { type, content, timestamp } = message

  const timeAgo = formatDistanceToNow(new Date(timestamp), {
    addSuffix: true,
    locale: ko,
  })

  return (
    <div className={`chat-message ${type}`}>
      <div className="message-avatar">
        {type === 'ai' ? '🤖' : '👤'}
      </div>
      <div className="message-content">
        <div className="message-header">
          <span className="message-sender">
            {type === 'ai' ? 'AI 해설자' : '사용자'}
          </span>
          <span className="message-time">{timeAgo}</span>
        </div>
        <div className="message-text">
          {content.split('\n').map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

export default React.memo(ChatMessage)
