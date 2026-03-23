import { useReducer } from 'react'
import type { MapData, PathData, Point } from '../types'

interface MapState {
  mapData: MapData
  pathData: PathData
}

type MapAction =
  | { type: 'path_update'; payload: { points?: Point[]; length?: number; algorithm?: string; created_at?: string | null } }
  | { type: 'map_update'; payload: { obstacles?: Point[]; width?: number; height?: number } }

const initialState: MapState = {
  mapData: {
    obstacles: [],
    width: 20,
    height: 20,
  },
  pathData: {
    points: [],
    length: 0,
    algorithm: '',
    createdAt: null,
  },
}

function mapReducer(state: MapState, action: MapAction): MapState {
  switch (action.type) {
    case 'path_update': {
      const d = action.payload
      return {
        ...state,
        pathData: {
          points: d.points ?? [],
          length: d.length ?? 0,
          algorithm: d.algorithm ?? '',
          createdAt: d.created_at ?? null,
        },
      }
    }
    case 'map_update': {
      const d = action.payload
      return {
        ...state,
        mapData: {
          obstacles: d.obstacles ?? state.mapData.obstacles,
          width: d.width ?? state.mapData.width,
          height: d.height ?? state.mapData.height,
        },
      }
    }
    default:
      return state
  }
}

export function useMapState() {
  const [mapState, dispatch] = useReducer(mapReducer, initialState)
  return { mapData: mapState.mapData, pathData: mapState.pathData, dispatch }
}
