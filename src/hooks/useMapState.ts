import { useReducer } from 'react'
import type { MapData } from '../types'
import type { MapUpdatePayload } from '../types/messages'
import { MAP_SIZE } from '../constants'

export type MapAction = { type: 'map_update'; payload: MapUpdatePayload }

const initialState: MapData = {
  obstacles: [],
  width: MAP_SIZE,
  height: MAP_SIZE,
}

function mapReducer(state: MapData, action: MapAction): MapData {
  switch (action.type) {
    case 'map_update': {
      const d = action.payload
      return {
        obstacles: d.obstacles ?? state.obstacles,
        width: d.width ?? state.width,
        height: d.height ?? state.height,
      }
    }
    default:
      return state
  }
}

export function useMapState() {
  const [mapData, dispatch] = useReducer(mapReducer, initialState)
  return { mapData, dispatch }
}
