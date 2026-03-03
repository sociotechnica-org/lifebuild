import { createHex } from '@lifebuild/shared/hex'
import type { HexCoord } from '@lifebuild/shared/hex'

export type MapTreeSpriteConfig = {
  id: string
  label: string
  textureUrl: string
  coord: HexCoord
  width: number
  height: number
  opacity?: number
  elevation?: number
  tint?: string
  defaultScale: number
  defaultOrigin: MapSpriteOrigin
}

export type MapSpriteOrigin = {
  x: number
  y: number
}

export const MAP_TREE_SPRITE_CONFIGS: readonly MapTreeSpriteConfig[] = [
  {
    id: 'tree-west',
    label: 'Tree West',
    textureUrl: '/sprites/tree1.png',
    coord: createHex(-3, 2),
    width: 1.15,
    height: 1.35,
    opacity: 0.98,
    elevation: 0.62,
    defaultOrigin: { x: 0, y: 0.48 },
    tint: '#fff7e4',
    defaultScale: 1,
  },
  {
    id: 'tree-north',
    label: 'Tree North',
    textureUrl: '/sprites/tree3.png',
    coord: createHex(-1, -3),
    width: 1.08,
    height: 1.28,
    opacity: 0.98,
    elevation: 0.62,
    defaultOrigin: { x: 0, y: 0.46 },
    tint: '#fff8ea',
    defaultScale: 1,
  },
  {
    id: 'tree-east',
    label: 'Tree East',
    textureUrl: '/sprites/tree5.png',
    coord: createHex(3, -2),
    width: 1.04,
    height: 1.24,
    opacity: 0.98,
    elevation: 0.6,
    defaultOrigin: { x: 0, y: 0.44 },
    tint: '#fff8ea',
    defaultScale: 1,
  },
  {
    id: 'tree-south',
    label: 'Tree South',
    textureUrl: '/sprites/tree7.png',
    coord: createHex(1, 3),
    width: 1.12,
    height: 1.32,
    opacity: 0.98,
    elevation: 0.6,
    defaultOrigin: { x: 0, y: 0.44 },
    tint: '#fff7e8',
    defaultScale: 1,
  },
] as const

export type MapTreeSpriteId = (typeof MAP_TREE_SPRITE_CONFIGS)[number]['id']

export type MapSpriteDebugSettings = {
  sanctuaryScale: number
  workshopScale: number
  sanctuaryOrigin: MapSpriteOrigin
  workshopOrigin: MapSpriteOrigin
  treeScales: Record<MapTreeSpriteId, number>
  treeOrigins: Record<MapTreeSpriteId, MapSpriteOrigin>
}

const DEFAULT_TREE_SCALES = Object.fromEntries(
  MAP_TREE_SPRITE_CONFIGS.map(tree => [tree.id, tree.defaultScale])
) as Record<MapTreeSpriteId, number>

const DEFAULT_TREE_ORIGINS = Object.fromEntries(
  MAP_TREE_SPRITE_CONFIGS.map(tree => [tree.id, tree.defaultOrigin])
) as Record<MapTreeSpriteId, MapSpriteOrigin>

export const DEFAULT_MAP_SPRITE_DEBUG_SETTINGS: MapSpriteDebugSettings = {
  sanctuaryScale: 1,
  workshopScale: 1,
  sanctuaryOrigin: { x: 0, y: 0.45 },
  workshopOrigin: { x: 0, y: 0.45 },
  treeScales: DEFAULT_TREE_SCALES,
  treeOrigins: DEFAULT_TREE_ORIGINS,
}
