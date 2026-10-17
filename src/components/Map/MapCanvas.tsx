import { useRef, useEffect, useState } from 'react'
import type { Position, Enemy, Point } from '../../types'
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  canvasToCell,
  canvasToMap,
  renderDynamicLayer,
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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scene = { agvPosition, targets, targetEnemy, obstacles, path, agvPath, hoveredCell }
    const draw = () => renderDynamicLayer(ctx, scene, staticCanvasRef.current, Date.now())

    if (!targetEnemy) {
      draw()
      return
    }

    let animationId: number
    const animate = () => {
      draw()
      animationId = requestAnimationFrame(animate)
    }
    animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [agvPosition, targets, targetEnemy, obstacles, path, agvPath, hoveredCell])

  const canvasPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = canvasPoint(e)
    if (!point) return
    setHoveredCell(canvasToCell(point.x, point.y))
  }

  const handleMouseLeave = () => {
    setHoveredCell(null)
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = canvasPoint(e)
    if (!point) return
    onMapClick(canvasToMap(point.x, point.y))
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
