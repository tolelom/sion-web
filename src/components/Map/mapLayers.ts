import type { Position, Enemy, Point } from '../../types'
import { CANVAS_HEIGHT, CANVAS_WIDTH, type Cell } from './mapGeometry'
import {
  drawAGV,
  drawCoordinates,
  drawGrid,
  drawHoveredCell,
  drawObstacles,
  drawPlannedPath,
  drawTarget,
  drawTargetHighlight,
} from './mapDrawing'

export interface MapScene {
  agvPosition: Position | undefined
  targets: Enemy[]
  targetEnemy: Enemy | null | undefined
  obstacles: Point[]
  path: Point[]
  hoveredCell: Cell | null
}

export const renderStaticLayer = (ctx: CanvasRenderingContext2D, obstacles: Point[]) => {
  ctx.fillStyle = '#1a1d23'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  drawGrid(ctx)
  drawCoordinates(ctx)
  drawObstacles(ctx, obstacles)
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

  drawPlannedPath(ctx, scene.path)

  scene.targets?.forEach(target => {
    const isSelected = isSelectedTarget(target, scene.targetEnemy)
    if (isSelected) {
      drawTargetHighlight(ctx, target, time)
    }
    drawTarget(ctx, target, isSelected)
  })

  if (scene.agvPosition) {
    drawAGV(ctx, scene.agvPosition)
  }

  if (scene.hoveredCell) {
    drawHoveredCell(ctx, scene.hoveredCell)
  }
}
