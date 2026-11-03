import { useState, useEffect, useRef, useCallback } from 'react'
import type { WSMessage } from '../types'

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected'

const MAX_RECONNECT_ATTEMPTS = 10
const BASE_RECONNECT_DELAY_MS = 1000
const MAX_RECONNECT_DELAY_MS = 30000
// StrictMode가 effect를 마운트→정리→마운트로 두 번 돌리므로, 곧 버려질 첫 소켓을 만들지 않게 잠깐 미룬다.
const INITIAL_CONNECT_DELAY_MS = 100

const exponentialBackoffDelay = (attemptNumber: number): number =>
  Math.min(BASE_RECONNECT_DELAY_MS * Math.pow(2, attemptNumber - 1), MAX_RECONNECT_DELAY_MS)

export const useWebSocket = (url: string, onMessage: (message: WSMessage) => void) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('reconnecting')
  const onMessageRef = useRef(onMessage)
  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])
  const webSocketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(false)
  const reconnectAttemptsRef = useRef(0)
  const connectRef = useRef<(() => void) | null>(null)

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true

    const scheduleReconnect = () => {
      if (!mountedRef.current || reconnectTimeoutRef.current) return

      reconnectAttemptsRef.current += 1
      if (reconnectAttemptsRef.current > MAX_RECONNECT_ATTEMPTS) {
        setConnectionStatus('disconnected')
        console.log('최대 재연결 횟수 초과')
        return
      }

      setConnectionStatus('reconnecting')
      const delay = exponentialBackoffDelay(reconnectAttemptsRef.current)
      console.log(`${delay / 1000}초 후 재연결 시도`)
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null
        connect()
      }, delay)
    }

    const connect = () => {
      if (!mountedRef.current) return
      const current = webSocketRef.current
      if (current?.readyState === WebSocket.OPEN || current?.readyState === WebSocket.CONNECTING) {
        return
      }

      let ws: WebSocket
      try {
        console.log(`WebSocket 연결 시도 #${reconnectAttemptsRef.current + 1}:`, url)
        ws = new WebSocket(url)
      } catch (error) {
        console.error('WebSocket 생성 실패:', error)
        scheduleReconnect()
        return
      }
      webSocketRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket 연결 성공')
        setConnectionStatus('connected')
        reconnectAttemptsRef.current = 0
        clearReconnectTimer()
      }

      ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as WSMessage
          onMessageRef.current(data)
        } catch (error) {
          console.error('메시지 파싱 오류:', error)
        }
      }

      ws.onerror = (error: Event) => {
        console.error('WebSocket 에러:', error)
      }

      ws.onclose = (event: CloseEvent) => {
        console.log('WebSocket 연결 종료:', event.code, event.reason)
        const isReplacedOrDisposed = webSocketRef.current !== ws
        if (isReplacedOrDisposed) return
        webSocketRef.current = null
        scheduleReconnect()
      }
    }

    connectRef.current = connect
    const initialConnect = setTimeout(connect, INITIAL_CONNECT_DELAY_MS)

    return () => {
      mountedRef.current = false
      clearTimeout(initialConnect)
      clearReconnectTimer()

      if (webSocketRef.current) {
        webSocketRef.current.close()
        webSocketRef.current = null
      }
    }
  }, [url, clearReconnectTimer])

  const sendMessage = useCallback((message: unknown): boolean => {
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify(message))
      return true
    }

    console.warn('WebSocket 연결되지 않음')
    return false
  }, [])

  const retryConnect = useCallback(() => {
    clearReconnectTimer()
    reconnectAttemptsRef.current = 0
    setConnectionStatus('reconnecting')
    connectRef.current?.()
  }, [clearReconnectTimer])

  return {
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    sendMessage,
    retryConnect,
  }
}
