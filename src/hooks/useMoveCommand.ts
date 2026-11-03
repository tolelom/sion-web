import { useCallback, useRef, useState } from 'react'
import { usePathfinding } from './usePathfinding'
import type { Point, SendCommand } from '../types'

const NO_PATH_MESSAGE = '경로를 찾을 수 없습니다. 장애물을 피해 다른 위치를 선택해주세요.'
const NOT_SENT_MESSAGE = '서버에 연결되어 있지 않아 이동 명령을 보내지 못했습니다.'

export const useMoveCommand = (agvPosition: Point | undefined, obstacles: Point[], onSendCommand: SendCommand) => {
  const { path, isLoading, error: pathError, findPath } = usePathfinding()
  const [moveError, setMoveError] = useState<string | null>(null)
  const latestClickRef = useRef(0)

  const moveTo = useCallback(async (target: { x: number; y: number }) => {
    const clickId = ++latestClickRef.current
    const isSupersededByNewerClick = () => clickId !== latestClickRef.current
    setMoveError(null)
    const current = agvPosition || { x: 0, y: 0 }
    const start = { x: Math.round(current.x), y: Math.round(current.y) }
    const goal = { x: Math.round(target.x), y: Math.round(target.y) }

    const calculatedPath = await findPath(start, goal, obstacles)
    if (isSupersededByNewerClick()) return
    if (!calculatedPath) {
      setMoveError(NO_PATH_MESSAGE)
      return
    }
    const sent = onSendCommand({
      type: 'command',
      data: { target_x: target.x, target_y: target.y, path: calculatedPath, mode: 'manual' },
    })
    if (!sent) {
      setMoveError(NOT_SENT_MESSAGE)
    }
  }, [agvPosition, obstacles, findPath, onSendCommand])

  return { path, isPathLoading: isLoading, pathError, moveError, moveTo }
}
