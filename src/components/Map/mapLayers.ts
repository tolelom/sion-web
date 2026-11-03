import type { Position, Enemy, Point } from '../../types'
import { CANVAS_HEIGHT, CANVAS_WIDTH, type Cell } from './mapGeometry'
import {
  drawAGV,
  drawAGVPath,
  drawCoordinates,
  drawGrid,
  drawHoveredCell,
  drawObstacles,
  drawPath,
  drawTarget,
  drawTargetHighlight,
} from './mapDrawing'

export interface MapScene {
  agvPosition: Position | undefined
  targets: Enemy[]
  targetEnemy: Enemy | null | undefined
  obstacles: Point[]
  path: Point[]
  agvPath: Point[]
  hoveredCell: Cell | null
}

// 배경·격자·좌표·장애물. 장애물이 바뀔 때만 다시 그려 오프스크린 캔버스에 둔다.
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

// 정적 레이어 위에 경로·적·AGV·마우스 위치를 그린다. 선택된 적이 있으면 매 프레임 호출된다.
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

  drawAGVPath(ctx, scene.agvPath)
  drawPath(ctx, scene.path)

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
