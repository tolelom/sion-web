import { useReducer } from 'react'

const initialState = {
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

function mapReducer(state, action) {
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
