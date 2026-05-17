import { useRef, useEffect, useState } from 'react'
import type { Position, Enemy, Point } from '../../types'
import {
  MAP_SIZE,
  CELL_SIZE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  drawAGV,
  drawAGVPath,
  drawHoveredCell,
  drawPath,
  drawTarget,
  drawTargetHighlight,
  renderStaticLayer,
} from './mapDrawing'

interface MapCanvasProps {
  agvPosition: Position | undefined
  targets: Enemy[]
  targetEnemy: Enemy | null | undefined
  obstacles: Point[]
  path: Point[]
  agvPath: Point[]
  onMapClick: (position: { x: number; y: number }) => void
}

const MapCanvas = ({ agvPosition, targets, targetEnemy, obstacles, path, agvPath, onMapClick }: MapCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const staticCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null)

  // 정적 레이어: obstacles가 바뀔 때만 오프스크린 캔버스에 캐시.
  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    renderStaticLayer(ctx, obstacles)
    staticCanvasRef.current = canvas

    return () => {
      staticCanvasRef.current = null
    }
  }, [obstacles])

  // 동적 레이어: 매 dep 변경마다 cached static 위에 덮어 그린다.
  // targetEnemy가 있을 때만 pulse animation을 위해 rAF 루프를 돈다.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const renderDynamicLayer = () => {
      const currentTime = Date.now()
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      if (staticCanvasRef.current) {
        ctx.drawImage(staticCanvasRef.current, 0, 0)
      } else {
        renderStaticLayer(ctx, obstacles)
      }

      if (agvPath && agvPath.length > 0) {
        drawAGVPath(ctx, agvPath)
      }
      if (path && path.length > 0) {
        drawPath(ctx, path)
      }
      if (targets && targets.length > 0) {
        targets.forEach(target => {
          const isSelected = targetEnemy != null && (
            targetEnemy.id === target.id ||
            (targetEnemy.x === target.x && targetEnemy.y === target.y)
          )
          if (isSelected) {
            drawTargetHighlight(ctx, target, currentTime)
          }
          drawTarget(ctx, target, isSelected)
        })
      }
      if (agvPosition) {
        drawAGV(ctx, agvPosition)
      }
      if (hoveredCell) {
        drawHoveredCell(ctx, hoveredCell)
      }
    }

    if (targetEnemy) {
      let animationId: number
      const animate = () => {
        renderDynamicLayer()
        animationId = requestAnimationFrame(animate)
      }
      animationId = requestAnimationFrame(animate)
      return () => cancelAnimationFrame(animationId)
    }
    renderDynamicLayer()
  }, [agvPosition, targets, targetEnemy, obstacles, path, agvPath, hoveredCell])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    if (mouseX < 0 || mouseY < 0 || mouseX >= CANVAS_WIDTH || mouseY >= CANVAS_HEIGHT) {
      setHoveredCell(null)
      return
    }

    const x = Math.round(mouseX / CELL_SIZE)
    const canvasY = Math.round(mouseY / CELL_SIZE)
    const y = MAP_SIZE - canvasY

    if (x >= 0 && x <= MAP_SIZE && y >= 0 && y <= MAP_SIZE) {
      setHoveredCell({ x, y })
    } else {
      setHoveredCell(null)
    }
  }

  const handleMouseLeave = () => {
    setHoveredCell(null)
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()

    const x = (e.clientX - rect.left) / CELL_SIZE
    const y = MAP_SIZE - (e.clientY - rect.top) / CELL_SIZE

    onMapClick({ x, y })
  }

  return (
    <div className="map-container" style={{
      background: '#0f1115',
      borderRadius: '12px',
      padding: '20px',
      display: 'inline-block'
    }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          cursor: 'crosshair',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
        }}
      />
    </div>
  )
}

export default MapCanvas
