import { useReducer } from 'react'
import type { MapData, PathData } from '../types'
import type { MapUpdatePayload, PathUpdatePayload } from '../types/messages'
import { MAP_SIZE } from '../constants'

interface MapState {
  mapData: MapData
  pathData: PathData
}

export type MapAction =
  | { type: 'path_update'; payload: PathUpdatePayload }
  | { type: 'map_update'; payload: MapUpdatePayload }

const initialState: MapState = {
  mapData: {
    obstacles: [],
    width: MAP_SIZE,
    height: MAP_SIZE,
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
