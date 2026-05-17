import { useState, useEffect, useRef, useCallback } from 'react'
import type { WSMessage } from '../types'

type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected'

// onclose 후 재연결 시도 횟수 상한. attempts가 이 값을 "초과"하는 순간 disconnected로 전이한다.
// 즉 최대 MAX_RECONNECT_ATTEMPTS번까지 재연결 시도하고, 그 다음 close에 disconnected가 된다.
const MAX_RECONNECT_ATTEMPTS = 10

// 첫 connect를 100ms 지연하는 이유: React StrictMode의 double-mount/cleanup 직후 즉시 연결을
// 시도하면 useEffect cleanup이 곧바로 close를 호출해 반쪽 연결이 생긴다. 짧은 지연으로 cleanup 후
// 새 effect만 실제 ws를 만들도록 한다.
const INITIAL_CONNECT_DELAY_MS = 100

export const useWebSocket = (url: string) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('reconnecting')
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null)
  const webSocketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(false)
  const reconnectAttemptsRef = useRef(0)
  const connectRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    mountedRef.current = true
    // url이 바뀌면 이전 url의 시도 카운트를 새 url에 누적시키지 않는다.
    reconnectAttemptsRef.current = 0

    // 재연결 예약을 한 곳으로 모은다. onclose와 try/catch가 같은 분기를 두 번 쓰던 중복을 제거.
    const scheduleReconnect = () => {
      if (!mountedRef.current || reconnectTimeoutRef.current) return

      reconnectAttemptsRef.current += 1
      if (reconnectAttemptsRef.current > MAX_RECONNECT_ATTEMPTS) {
        setConnectionStatus('disconnected')
        console.log('최대 재연결 횟수 초과')
        return
      }

      setConnectionStatus('reconnecting')
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 30000)
      console.log(`${delay / 1000}초 후 재연결 시도`)

      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null
        connect()
      }, delay)
    }

    const connect = () => {
      if (webSocketRef.current?.readyState === WebSocket.OPEN ||
        webSocketRef.current?.readyState === WebSocket.CONNECTING) {
        return
      }

      try {
        console.log(`WebSocket 연결 시도 #${reconnectAttemptsRef.current + 1}:`, url)
        const ws = new WebSocket(url)
        webSocketRef.current = ws

        ws.onopen = () => {
          console.log('WebSocket 연결 성공')
          setConnectionStatus('connected')
          reconnectAttemptsRef.current = 0

          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
          }
        }

        ws.onmessage = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data) as WSMessage
            setLastMessage(data)
          } catch (error) {
            console.error('메시지 파싱 오류:', error)
          }
        }

        ws.onerror = (error: Event) => {
          console.error('WebSocket 에러:', error)
        }

        ws.onclose = (event: CloseEvent) => {
          console.log('WebSocket 연결 종료:', event.code, event.reason)
          webSocketRef.current = null
          scheduleReconnect()
        }

      } catch (error) {
        console.error('WebSocket 생성 실패:', error)
        scheduleReconnect()
      }
    }

    connectRef.current = connect
    const initialTimer = setTimeout(connect, INITIAL_CONNECT_DELAY_MS)

    return () => {
      mountedRef.current = false
      clearTimeout(initialTimer)

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      if (webSocketRef.current) {
        webSocketRef.current.close()
        webSocketRef.current = null
      }
    }
  }, [url])

  const sendMessage = useCallback((message: unknown): boolean => {
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify(message))
      return true
    }

    console.warn('WebSocket 연결되지 않음')
    return false
  }, [])

  const retryConnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    reconnectAttemptsRef.current = 0
    setConnectionStatus('reconnecting')
    if (connectRef.current) {
      connectRef.current()
    }
  }, [])

  const isConnected = connectionStatus === 'connected'

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    sendMessage,
    retryConnect,
  }
}
