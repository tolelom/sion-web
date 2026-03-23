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

// Go 모델에는 type, state, distance, max_hp 등 추가 필드가 있으나,
// 프론트엔드에서 사용하는 필드만 정의. 서버에서 보내는 추가 필드는 무시됨.
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
