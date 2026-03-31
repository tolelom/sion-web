export interface Position {
  x: number
  y: number
  angle: number
}

export interface AGVStatus {
  battery: number
  speed: number
  mode: string
  state: string | null
}

export interface Enemy {
  id: string
  name: string
  hp: number
  x?: number
  y?: number
  position?: Position
}

export interface AGVData {
  connected: boolean
  position: Position
  status: AGVStatus
  detectedEnemies: Enemy[]
  targetEnemy: Enemy | null
}
