export interface Point {
  x: number
  y: number
  angle?: number
}

export interface PathData {
  points: Point[]
  length: number
  algorithm: string
  createdAt: string | null
}

export interface MapData {
  obstacles: Point[]
  width: number
  height: number
}
