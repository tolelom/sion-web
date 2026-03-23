import { useState, useRef, useEffect } from 'react'
import ChatMessage from './ChatMessage'
import '../../styles/chat.css'

const ChatPanel = ({ messages, isLoading, onChatDispatch, onSendMessage, isConnected }) => {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = () => {
    if (!inputValue.trim() || !isConnected) return
    onChatDispatch({ type: 'user_message', payload: inputValue })
    if (onSendMessage) {
      onSendMessage({
        type: 'chat',
        data: { message: inputValue, timestamp: Date.now() },
      })
    }
    setInputValue('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleClearChat = () => {
    if (window.confirm('채팅 기록을 모두 삭제하시겠습니까?')) {
      onChatDispatch({ type: 'clear' })
    }
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-header-info">
          <h3 className="chat-title">💬 AI 해설</h3>
          <div className={`chat-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            <span className="status-text">{isConnected ? '연결됨' : '연결 끊김'}</span>
          </div>
        </div>
        <button className="chat-clear-btn" onClick={handleClearChat} title="채팅 초기화">🗑️</button>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="chat-loading">
            <div className="loading-dots"><span></span><span></span><span></span></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <textarea
          ref={inputRef}
          className="chat-input"
          placeholder={isConnected ? '메시지를 입력하세요... (Shift+Enter로 줄바꿈)' : '서버에 연결되지 않았습니다'}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={!isConnected || isLoading}
          rows={1}
        />
        <button
          className="chat-send-btn"
          onClick={handleSendMessage}
          disabled={!isConnected || !inputValue.trim() || isLoading}
        >
          {isLoading ? '⏳' : '📤'}
        </button>
      </div>

      <div className="chat-quick-commands">
        <button className="quick-cmd-btn" onClick={() => setInputValue('현재 상황을 설명해줘')} disabled={!isConnected || isLoading}>📊 상황 설명</button>
        <button className="quick-cmd-btn" onClick={() => setInputValue('왜 그 행동을 했어?')} disabled={!isConnected || isLoading}>🤔 행동 이유</button>
        <button className="quick-cmd-btn" onClick={() => setInputValue('다음 행동은?')} disabled={!isConnected || isLoading}>🎯 다음 행동</button>
      </div>
    </div>
  )
}

export default ChatPanel
