import { MAP_SIZE } from '../../constants'

export const CELL_SIZE = 30
export const CANVAS_WIDTH = MAP_SIZE * CELL_SIZE
export const CANVAS_HEIGHT = MAP_SIZE * CELL_SIZE

export interface Cell {
  x: number
  y: number
}

export const toCanvasX = (mapX: number): number => mapX * CELL_SIZE
export const toCanvasY = (mapY: number): number => (MAP_SIZE - mapY) * CELL_SIZE

export const nearestCellToCanvasPoint = (canvasX: number, canvasY: number): Cell | null => {
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
