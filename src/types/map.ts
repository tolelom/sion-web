export interface Point {
  x: number
  y: number
  angle?: number
}

export interface MapData {
  obstacles: Point[]
  width: number
  height: number
}
