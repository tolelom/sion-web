import { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import '../../styles/chat.css';

const ChatPanel = ({ onSendMessage, isConnected }) => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'ai',
            content: '안녕하세요! 저는 AGV 사이온의 AI 해설자입니다. 🤖\n사이온의 행동을 실시간으로 설명해드리겠습니다.',
            timestamp: new Date(),
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // 메시지 추가 시 자동 스크롤
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 메시지 전송 핸들러
    const handleSendMessage = async () => {
        if (!inputValue.trim() || !isConnected) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: inputValue,
            timestamp: new Date(),
        };

        // 사용자 메시지 추가
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        // WebSocket으로 메시지 전송
        if (onSendMessage) {
            onSendMessage({
                type: 'chat',
                data: {
                    message: inputValue,
                    timestamp: Date.now(),
                }
            });
        }

        // TODO: 백엔드에서 AI 응답 받으면 주석 해제
        // 임시 응답 (실제로는 WebSocket으로 받아야 함)
        setTimeout(() => {
            const aiResponse = {
                id: Date.now() + 1,
                type: 'ai',
                content: '메시지를 받았습니다. 백엔드 연동 후 LLM 응답이 표시됩니다.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, aiResponse]);
            setIsLoading(false);
        }, 1000);
    };

    // Enter 키 전송
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // AGV 이벤트 메시지 추가 (외부에서 호출)
    const addAIMessage = (content) => {
        const aiMessage = {
            id: Date.now(),
            type: 'ai',
            content: content,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
    };

    // 외부에서 접근 가능하도록 (부모 컴포넌트에서 ref로 호출)
    useEffect(() => {
        if (!window.chatPanel) {
            window.chatPanel = {};
        }
        window.chatPanel.addAIMessage = addAIMessage;
    }, []);

    // 채팅 초기화
    const handleClearChat = () => {
        if (window.confirm('채팅 기록을 모두 삭제하시겠습니까?')) {
            setMessages([
                {
                    id: 1,
                    type: 'ai',
                    content: '채팅이 초기화되었습니다. 다시 시작하겠습니다! 🚀',
                    timestamp: new Date(),
                }
            ]);
        }
    };

    return (
        <div className="chat-panel">
            {/* 헤더 */}
            <div className="chat-header">
                <div className="chat-header-info">
                    <h3 className="chat-title">💬 AI 해설</h3>
                    <div className={`chat-status ${isConnected ? 'connected' : 'disconnected'}`}>
                        <span className="status-dot"></span>
                        <span className="status-text">
                            {isConnected ? '연결됨' : '연결 끊김'}
                        </span>
                    </div>
                </div>
                <button
                    className="chat-clear-btn"
                    onClick={handleClearChat}
                    title="채팅 초기화"
                >
                    🗑️
                </button>
            </div>

            {/* 메시지 영역 */}
            <div className="chat-messages">
                {messages.map((message) => (
                    <ChatMessage
                        key={message.id}
                        message={message}
                    />
                ))}
                {isLoading && (
                    <div className="chat-loading">
                        <div className="loading-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* 입력 영역 */}
            <div className="chat-input-container">
                <textarea
                    ref={inputRef}
                    className="chat-input"
                    placeholder={isConnected ? "메시지를 입력하세요... (Shift+Enter로 줄바꿈)" : "서버에 연결되지 않았습니다"}
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

            {/* 빠른 명령어 버튼 (선택사항) */}
            <div className="chat-quick-commands">
                <button
                    className="quick-cmd-btn"
                    onClick={() => setInputValue('현재 상황을 설명해줘')}
                    disabled={!isConnected}
                >
                    📊 상황 설명
                </button>
                <button
                    className="quick-cmd-btn"
                    onClick={() => setInputValue('왜 그 행동을 했어?')}
                    disabled={!isConnected}
                >
                    🤔 행동 이유
                </button>
                <button
                    className="quick-cmd-btn"
                    onClick={() => setInputValue('다음 행동은?')}
                    disabled={!isConnected}
                >
                    🎯 다음 행동
                </button>
            </div>
        </div>
    );
};

export default ChatPanel;
