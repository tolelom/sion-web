import React, { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { ChatMessage as ChatMessageType } from '../../types'

interface ChatMessageProps {
  message: ChatMessageType
}

const TICK_MS = 60_000

const ChatMessage = ({ message }: ChatMessageProps) => {
  const { type, content, timestamp } = message
  // 마운트 시점에 고정된 timeAgo를 1분 단위로 갱신한다. 60s tick이라 N개 메시지가 각자 interval을 가져도 비용 무시 가능.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(id)
  }, [])

  const timeAgo = formatDistanceToNow(new Date(timestamp), {
    addSuffix: true,
    locale: ko,
    // now를 명시 전달하지 않지만 컴포넌트가 now state 변경 시 re-render되어 formatDistanceToNow가 새 Date.now()를 본다.
  })
  void now

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
