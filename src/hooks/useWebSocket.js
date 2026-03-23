import {useState, useEffect, useRef, useCallback} from "react";

const MAX_RECONNECT_ATTEMPTS = 10;

export const useWebSocket = (url) => {
    const [connectionStatus, setConnectionStatus] = useState("reconnecting");
    const [lastMessage, setLastMessage] = useState(null);
    const webSocketRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const mountedRef = useRef(false);
    const reconnectAttemptsRef = useRef(0);
    const connectRef = useRef(null);

    useEffect(() => {
        mountedRef.current = true;

        const connect = () => {
            if (webSocketRef.current?.readyState === WebSocket.OPEN ||
                webSocketRef.current?.readyState === WebSocket.CONNECTING) {
                return;
            }

            try {
                console.log(`🔌 WebSocket 연결 시도 #${reconnectAttemptsRef.current + 1}:`, url);
                const ws = new WebSocket(url);
                webSocketRef.current = ws;

                ws.onopen = () => {
                    console.log('✅ WebSocket 연결 성공!');
                    setConnectionStatus("connected");
                    reconnectAttemptsRef.current = 0;

                    if (reconnectTimeoutRef.current) {
                        clearTimeout(reconnectTimeoutRef.current);
                        reconnectTimeoutRef.current = null;
                    }
                };

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('📩 수신:', data);
                        setLastMessage(data);
                    } catch (error) {
                        console.error('메시지 파싱 오류:', error);
                    }
                };

                ws.onerror = (error) => {
                    console.error('❌ WebSocket 에러:', error);
                };

                ws.onclose = (event) => {
                    console.log('❌ WebSocket 연결 종료:', event.code, event.reason);
                    webSocketRef.current = null;

                    if (mountedRef.current && !reconnectTimeoutRef.current) {
                        reconnectAttemptsRef.current += 1;

                        if (reconnectAttemptsRef.current > MAX_RECONNECT_ATTEMPTS) {
                            setConnectionStatus("disconnected");
                            console.log('🚫 최대 재연결 횟수 초과, 연결 포기');
                            return;
                        }

                        setConnectionStatus("reconnecting");
                        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);
                        console.log(`🔄 ${delay / 1000}초 후 재연결 시도...`);

                        reconnectTimeoutRef.current = setTimeout(() => {
                            reconnectTimeoutRef.current = null;
                            connect();
                        }, delay);
                    }
                };

            } catch (error) {
                console.error('WebSocket 생성 실패:', error);

                if (mountedRef.current && !reconnectTimeoutRef.current) {
                    reconnectAttemptsRef.current += 1;

                    if (reconnectAttemptsRef.current > MAX_RECONNECT_ATTEMPTS) {
                        setConnectionStatus("disconnected");
                        return;
                    }

                    setConnectionStatus("reconnecting");
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectTimeoutRef.current = null;
                        connect();
                    }, delay);
                }
            }
        };

        connectRef.current = connect;
        setTimeout(connect, 100);

        return () => {
            mountedRef.current = false;

            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }

            if (webSocketRef.current) {
                webSocketRef.current.close();
                webSocketRef.current = null;
            }
        };
    }, [url]);

    const sendMessage = useCallback((message) => {
        if (webSocketRef.current?.readyState === WebSocket.OPEN) {
            webSocketRef.current.send(JSON.stringify(message));
            console.log('📤 전송:', message);
            return true;
        }

        console.warn('⚠️ WebSocket 연결되지 않음');
        return false;
    }, []);

    const retryConnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        reconnectAttemptsRef.current = 0;
        setConnectionStatus("reconnecting");
        if (connectRef.current) {
            connectRef.current();
        }
    }, []);

    const isConnected = connectionStatus === "connected";

    return {
        isConnected,
        connectionStatus,
        lastMessage,
        sendMessage,
        retryConnect,
    };
};
