import { useReducer } from 'react'
import type { AGVData } from '../types'
import type { AgvConnectionPayload, PositionPayload, StatusPayload, TargetFoundPayload } from '../types/messages'

export type AgvAction =
  | { type: 'position'; payload: PositionPayload }
  | { type: 'status'; payload: StatusPayload }
  | { type: 'target_found'; payload: TargetFoundPayload }
  | { type: 'agv_connection'; payload: AgvConnectionPayload }

const initialState: AGVData = {
  connected: false,
  position: { x: 0, y: 0, angle: 0 },
  status: { battery: 100, speed: 0, mode: 'auto', state: null },
  detectedEnemies: [],
  targetEnemy: null,
}

function agvReducer(state: AGVData, action: AgvAction): AGVData {
  switch (action.type) {
    case 'position':
      return { ...state, position: action.payload }
    case 'status': {
      const d = action.payload
      return {
        ...state,
        status: {
          battery: d.battery ?? state.status.battery,
          speed: d.speed ?? state.status.speed,
          mode: d.mode ?? state.status.mode,
          state: d.state ?? state.status.state,
        },
        detectedEnemies: d.detected_enemies ?? state.detectedEnemies,
        targetEnemy: 'target_enemy' in d ? (d.target_enemy ?? null) : state.targetEnemy,
      }
    }
    case 'target_found':
      return {
        ...state,
        detectedEnemies: action.payload.enemies ?? [],
        targetEnemy: action.payload.target ?? null,
      }
    case 'agv_connection':
      return { ...state, connected: action.payload.connected }
    default:
      return state
  }
}

export function useAgvState() {
  const [agvData, dispatch] = useReducer(agvReducer, initialState)
  return { agvData, dispatch }
}
