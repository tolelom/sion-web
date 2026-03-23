import { useRef, useEffect, useState } from 'react'
import type { Position, Enemy, Point } from '../../types'

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

  const MAP_SIZE = 20
  const CELL_SIZE = 30
  const CANVAS_WIDTH = MAP_SIZE * CELL_SIZE
  const CANVAS_HEIGHT = MAP_SIZE * CELL_SIZE

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1

    for (let i = 0; i <= MAP_SIZE; i++) {
      const x = i * CELL_SIZE
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, CANVAS_HEIGHT)
      ctx.stroke()
    }

    for (let i = 0; i <= MAP_SIZE; i++) {
      const y = i * CELL_SIZE
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(CANVAS_WIDTH, y)
      ctx.stroke()
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 2

    for (let i = 0; i <= MAP_SIZE; i += 5) {
      const x = i * CELL_SIZE
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, CANVAS_HEIGHT)
      ctx.stroke()

      const y = i * CELL_SIZE
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(CANVAS_WIDTH, y)
      ctx.stroke()
    }
  }

  const drawCoordinates = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.font = '11px monospace'
    ctx.textAlign = 'center'

    for (let i = 0; i <= MAP_SIZE; i += 5) {
      const x = i * CELL_SIZE
      ctx.fillText(`${i}m`, x, CANVAS_HEIGHT - 8)
    }

    ctx.textAlign = 'right'
    for (let i = 0; i <= MAP_SIZE; i += 5) {
      const y = CANVAS_HEIGHT - i * CELL_SIZE
      ctx.fillText(`${i}m`, 25, y + 4)
    }
  }

  const drawObstacles = (ctx: CanvasRenderingContext2D, obstacleList: Point[]) => {
    if (!obstacleList || obstacleList.length === 0) return

    obstacleList.forEach(obstacle => {
      const x = (obstacle.x - 0.5) * CELL_SIZE
      const y = (MAP_SIZE - obstacle.y - 0.5) * CELL_SIZE

      ctx.fillStyle = 'rgba(149, 165, 166, 0.7)'
      ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE)

      ctx.strokeStyle = 'rgba(127, 140, 141, 1)'
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE)

      ctx.strokeStyle = 'rgba(52, 73, 94, 0.8)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x + 5, y + 5)
      ctx.lineTo(x + CELL_SIZE - 5, y + CELL_SIZE - 5)
      ctx.moveTo(x + CELL_SIZE - 5, y + 5)
      ctx.lineTo(x + 5, y + CELL_SIZE - 5)
      ctx.stroke()
    })
  }

  const drawPath = (ctx: CanvasRenderingContext2D, pathPoints: Point[]) => {
    if (!pathPoints || pathPoints.length < 2) return

    ctx.strokeStyle = 'rgba(52, 152, 219, 0.6)'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.setLineDash([5, 5])

    ctx.beginPath()
    pathPoints.forEach((point, index) => {
      const x = point.x * CELL_SIZE
      const y = (MAP_SIZE - point.y) * CELL_SIZE

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()
    ctx.setLineDash([])

    const lastPoint = pathPoints[pathPoints.length - 1]
    const targetX = lastPoint.x * CELL_SIZE
    const targetY = (MAP_SIZE - lastPoint.y) * CELL_SIZE

    ctx.fillStyle = 'rgba(52, 152, 219, 0.3)'
    ctx.beginPath()
    ctx.arc(targetX, targetY, 20, 0, 2 * Math.PI)
    ctx.fill()

    ctx.strokeStyle = '#3498db'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  const drawAGVPath = (ctx: CanvasRenderingContext2D, pathPoints: Point[]) => {
    if (!pathPoints || pathPoints.length < 1) {
      console.log('[MapCanvas.drawAGVPath] pathPoints 부족')
      return
    }

    console.log('[MapCanvas.drawAGVPath] 그리기 시작, 포인트 수:', pathPoints.length)

    ctx.strokeStyle = 'rgba(46, 204, 113, 0.8)'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.setLineDash([])

    ctx.beginPath()
    pathPoints.forEach((point, index) => {
      const canvasX = point.x * CELL_SIZE
      const canvasY = (MAP_SIZE - point.y) * CELL_SIZE

      console.log(`[MapCanvas.drawAGVPath] 포인트[${index}]: (${point.x}, ${point.y}) -> Canvas (${canvasX}, ${canvasY})`)

      if (index === 0) {
        ctx.moveTo(canvasX, canvasY)
      } else {
        ctx.lineTo(canvasX, canvasY)
      }
    })
    ctx.stroke()

    if (pathPoints.length > 0) {
      const lastPoint = pathPoints[pathPoints.length - 1]
      const targetX = lastPoint.x * CELL_SIZE
      const targetY = (MAP_SIZE - lastPoint.y) * CELL_SIZE

      ctx.fillStyle = 'rgba(46, 204, 113, 0.3)'
      ctx.beginPath()
      ctx.arc(targetX, targetY, 18, 0, 2 * Math.PI)
      ctx.fill()

      ctx.strokeStyle = '#2ecc71'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    console.log('[MapCanvas.drawAGVPath] 그리기 완료')
  }

  const drawHealthBar = (ctx: CanvasRenderingContext2D, x: number, y: number, hp: number) => {
    const barWidth = 40
    const barHeight = 5

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight)

    const hpColor = hp > 50 ? '#2ecc71' : hp > 25 ? '#f39c12' : '#e74c3c'
    ctx.fillStyle = hpColor
    ctx.fillRect(x - barWidth / 2, y, (barWidth * hp) / 100, barHeight)

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 1
    ctx.strokeRect(x - barWidth / 2, y, barWidth, barHeight)
  }

  const drawAGV = (ctx: CanvasRenderingContext2D, position: Position) => {
    const x = position.x * CELL_SIZE
    const y = (MAP_SIZE - position.y) * CELL_SIZE
    const angle = position.angle || 0

    ctx.fillStyle = '#3498db'
    ctx.shadowColor = 'rgba(52, 152, 219, 0.8)'
    ctx.shadowBlur = 15
    ctx.beginPath()
    ctx.arc(x, y, 18, 0, 2 * Math.PI)
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.strokeStyle = '#2980b9'
    ctx.lineWidth = 3
    ctx.stroke()

    ctx.strokeStyle = '#ffffff'
    ctx.fillStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.beginPath()

    const arrowLength = 15
    const arrowX = x + Math.cos(angle) * arrowLength
    const arrowY = y + Math.sin(angle) * arrowLength

    ctx.moveTo(x, y)
    ctx.lineTo(arrowX, arrowY)
    ctx.stroke()

    const arrowHeadSize = 6
    ctx.beginPath()
    ctx.moveTo(arrowX, arrowY)
    ctx.lineTo(
      arrowX - Math.cos(angle - Math.PI / 6) * arrowHeadSize,
      arrowY - Math.sin(angle - Math.PI / 6) * arrowHeadSize
    )
    ctx.lineTo(
      arrowX - Math.cos(angle + Math.PI / 6) * arrowHeadSize,
      arrowY - Math.sin(angle + Math.PI / 6) * arrowHeadSize
    )
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('AGV', x, y - 28)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '10px monospace'
    ctx.fillText(
      `(${position.x.toFixed(1)}, ${position.y.toFixed(1)})`,
      x,
      y + 35
    )
  }

  const drawTargetHighlight = (ctx: CanvasRenderingContext2D, target: Enemy, time: number) => {
    const x = (target.x ?? 0) * CELL_SIZE
    const y = (MAP_SIZE - (target.y ?? 0)) * CELL_SIZE

    const pulseSize = 25 + Math.sin(time / 200) * 5
    const pulseOpacity = 0.3 + Math.sin(time / 200) * 0.2

    ctx.strokeStyle = `rgba(255, 215, 0, ${pulseOpacity})`
    ctx.lineWidth = 3
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.arc(x, y, pulseSize, 0, 2 * Math.PI)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, 20, 0, 2 * Math.PI)
    ctx.stroke()

    ctx.fillStyle = '#ffd700'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('🎯 TARGET', x, y - 35)
  }

  const drawTarget = (ctx: CanvasRenderingContext2D, target: Enemy, isSelected: boolean) => {
    const x = (target.x ?? 0) * CELL_SIZE
    const y = (MAP_SIZE - (target.y ?? 0)) * CELL_SIZE

    const fillColor = isSelected ? '#ff5555' : '#e74c3c'
    const shadowColor = isSelected ? 'rgba(255, 85, 85, 1)' : 'rgba(231, 76, 60, 0.8)'

    ctx.fillStyle = fillColor
    ctx.shadowColor = shadowColor
    ctx.shadowBlur = isSelected ? 20 : 15
    ctx.beginPath()
    ctx.arc(x, y, 15, 0, 2 * Math.PI)
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.strokeStyle = '#c0392b'
    ctx.lineWidth = 3
    ctx.stroke()

    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x - 8, y)
    ctx.lineTo(x + 8, y)
    ctx.moveTo(x, y - 8)
    ctx.lineTo(x, y + 8)
    ctx.stroke()

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(target.name || '아리', x, y + 30)

    if (target.hp !== undefined) {
      drawHealthBar(ctx, x, y - 25, target.hp)
    }
  }

  const drawHoveredCell = (ctx: CanvasRenderingContext2D, cell: { x: number; y: number }) => {
    const x = cell.x * CELL_SIZE
    const y = (MAP_SIZE - cell.y) * CELL_SIZE

    ctx.fillStyle = 'rgba(52, 152, 219, 0.8)'
    ctx.beginPath()
    ctx.arc(x, y, 6, 0, 2 * Math.PI)
    ctx.fill()

    ctx.strokeStyle = '#3498db'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = '#3498db'
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    ctx.fillText(
      `(${cell.x}, ${cell.y})`,
      x + 10,
      y - 5
    )
  }

  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#1a1d23'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    drawGrid(ctx)
    drawCoordinates(ctx)

    if (obstacles && obstacles.length > 0) {
      drawObstacles(ctx, obstacles)
    }

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

    const renderDynamicLayer = () => {
      const currentTime = Date.now()
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      if (staticCanvasRef.current) {
        ctx.drawImage(staticCanvasRef.current, 0, 0)
      } else {
        ctx.fillStyle = '#1a1d23'
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        drawGrid(ctx)
        drawCoordinates(ctx)
        if (obstacles && obstacles.length > 0) {
          drawObstacles(ctx, obstacles)
        }
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
    } else {
      renderDynamicLayer()
    }

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

    if (onMapClick) {
      onMapClick({ x, y })
    }
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
