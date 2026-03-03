import { createContext, useContext } from 'react'
import {
  DEFAULT_MAP_SPRITE_DEBUG_SETTINGS,
  type MapSpriteDebugSettings,
} from '../life-map/mapSpriteDebugConfig.js'

const MapSpriteDebugContext = createContext<MapSpriteDebugSettings>(
  DEFAULT_MAP_SPRITE_DEBUG_SETTINGS
)

export const MapSpriteDebugProvider = MapSpriteDebugContext.Provider

export const useMapSpriteDebugSettings = (): MapSpriteDebugSettings => {
  return useContext(MapSpriteDebugContext)
}
