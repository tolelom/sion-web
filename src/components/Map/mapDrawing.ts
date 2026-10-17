import type { Position, Enemy, Point } from '../../types'
import { MAP_SIZE } from '../../constants'

export const CELL_SIZE = 30
export const CANVAS_WIDTH = MAP_SIZE * CELL_SIZE
export const CANVAS_HEIGHT = MAP_SIZE * CELL_SIZE

export const drawGrid = (ctx: CanvasRenderingContext2D) => {
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

export const drawCoordinates = (ctx: CanvasRenderingContext2D) => {
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

export const drawObstacles = (ctx: CanvasRenderingContext2D, obstacleList: Point[]) => {
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

export const drawPath = (ctx: CanvasRenderingContext2D, pathPoints: Point[]) => {
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

export const drawAGVPath = (ctx: CanvasRenderingContext2D, pathPoints: Point[]) => {
  if (!pathPoints || pathPoints.length < 1) {
    return
  }

  ctx.strokeStyle = 'rgba(46, 204, 113, 0.8)'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.setLineDash([])

  ctx.beginPath()
  pathPoints.forEach((point, index) => {
    const canvasX = point.x * CELL_SIZE
    const canvasY = (MAP_SIZE - point.y) * CELL_SIZE

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

export const drawAGV = (ctx: CanvasRenderingContext2D, position: Position) => {
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

export const drawTargetHighlight = (ctx: CanvasRenderingContext2D, target: Enemy, time: number) => {
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

export const drawTarget = (ctx: CanvasRenderingContext2D, target: Enemy, isSelected: boolean) => {
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

export const drawHoveredCell = (ctx: CanvasRenderingContext2D, cell: { x: number; y: number }) => {
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

export interface MapScene {
  agvPosition: Position | undefined
  targets: Enemy[]
  targetEnemy: Enemy | null | undefined
  obstacles: Point[]
  path: Point[]
  agvPath: Point[]
  hoveredCell: { x: number; y: number } | null
}

export const renderStaticLayer = (ctx: CanvasRenderingContext2D, obstacles: Point[]) => {
  ctx.fillStyle = '#1a1d23'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  drawGrid(ctx)
  drawCoordinates(ctx)
  if (obstacles && obstacles.length > 0) {
    drawObstacles(ctx, obstacles)
  }
}

const isSelectedTarget = (target: Enemy, targetEnemy: Enemy | null | undefined) =>
  targetEnemy != null && (
    targetEnemy.id === target.id ||
    (targetEnemy.x === target.x && targetEnemy.y === target.y)
  )

export const renderDynamicLayer = (
  ctx: CanvasRenderingContext2D,
  scene: MapScene,
  staticLayer: HTMLCanvasElement | null,
  time: number,
) => {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  if (staticLayer) {
    ctx.drawImage(staticLayer, 0, 0)
  } else {
    renderStaticLayer(ctx, scene.obstacles)
  }

  if (scene.agvPath && scene.agvPath.length > 0) {
    drawAGVPath(ctx, scene.agvPath)
  }

  if (scene.path && scene.path.length > 0) {
    drawPath(ctx, scene.path)
  }

  if (scene.targets && scene.targets.length > 0) {
    scene.targets.forEach(target => {
      const isSelected = isSelectedTarget(target, scene.targetEnemy)
      if (isSelected) {
        drawTargetHighlight(ctx, target, time)
      }
      drawTarget(ctx, target, isSelected)
    })
  }

  if (scene.agvPosition) {
    drawAGV(ctx, scene.agvPosition)
  }

  if (scene.hoveredCell) {
    drawHoveredCell(ctx, scene.hoveredCell)
  }
}

export const canvasToCell = (canvasX: number, canvasY: number): { x: number; y: number } | null => {
  if (canvasX < 0 || canvasY < 0 || canvasX >= CANVAS_WIDTH || canvasY >= CANVAS_HEIGHT) {
    return null
  }
  const x = Math.round(canvasX / CELL_SIZE)
  const y = MAP_SIZE - Math.round(canvasY / CELL_SIZE)
  if (x >= 0 && x <= MAP_SIZE && y >= 0 && y <= MAP_SIZE) {
    return { x, y }
  }
  return null
}

export const canvasToMap = (canvasX: number, canvasY: number) => ({
  x: canvasX / CELL_SIZE,
  y: MAP_SIZE - canvasY / CELL_SIZE,
})
