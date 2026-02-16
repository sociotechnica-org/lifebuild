import { create } from 'zustand'
import type { HexCoord } from '../hex/types.js'
import { hexEquals } from '../hex/math.js'

export interface SpriteData {
  id: string
  url: string
  coord: HexCoord
  scale: number
}

interface SpriteState {
  sprites: SpriteData[]
  heldSpriteId: string | null

  pickUp: (id: string) => void
  drop: (coord: HexCoord) => void
  cancel: () => void
  spriteAt: (coord: HexCoord) => SpriteData | undefined
}

const initialSprites: SpriteData[] = [
  // Central village — sanctuary spans ~3 hexes
  { id: 'sanctuary', url: '/sprites/sanctuary.png', coord: { q: 0, r: 0, s: 0 }, scale: 4.5 },
  { id: 'well', url: '/sprites/well.png', coord: { q: 2, r: -2, s: 0 }, scale: 2.2 },
  { id: 'statue', url: '/sprites/statue.png', coord: { q: -2, r: 1, s: 1 }, scale: 2.5 },

  // Houses — spread out, ~1.5 hexes each
  { id: 'house1', url: '/sprites/house1.png', coord: { q: 3, r: -1, s: -2 }, scale: 2.8 },
  { id: 'house2', url: '/sprites/house2.png', coord: { q: 3, r: -3, s: 0 }, scale: 2.6 },
  { id: 'house3', url: '/sprites/house3.png', coord: { q: 5, r: -3, s: -2 }, scale: 2.8 },

  // Farms — single hex each, well spaced
  { id: 'crop1', url: '/sprites/crop-plot1.png', coord: { q: 5, r: 1, s: -6 }, scale: 2.2 },
  { id: 'crop2', url: '/sprites/crop-plot2.png', coord: { q: 7, r: -1, s: -6 }, scale: 2.2 },
  { id: 'crop3', url: '/sprites/crop-plot3.png', coord: { q: 6, r: 0, s: -6 }, scale: 2.2 },

  // Wall
  { id: 'wall', url: '/sprites/wall.png', coord: { q: -3, r: 2, s: 1 }, scale: 2.8 },

  // Trees — western forest
  { id: 'tree-w1', url: '/sprites/tree1.png', coord: { q: -4, r: 1, s: 3 }, scale: 2.0 },
  { id: 'tree-w2', url: '/sprites/tree2.png', coord: { q: -6, r: 3, s: 3 }, scale: 2.8 },
  { id: 'tree-w3', url: '/sprites/tree3.png', coord: { q: -5, r: 1, s: 4 }, scale: 2.2 },
  { id: 'tree-w4', url: '/sprites/tree4.png', coord: { q: -7, r: 3, s: 4 }, scale: 2.8 },
  { id: 'tree-w5', url: '/sprites/tree5.png', coord: { q: -7, r: 5, s: 2 }, scale: 2.0 },
  { id: 'tree-w6', url: '/sprites/tree6.png', coord: { q: -4, r: -1, s: 5 }, scale: 3.0 },
  { id: 'tree-w7', url: '/sprites/tree7.png', coord: { q: -8, r: 4, s: 4 }, scale: 2.8 },

  // Trees — northeast
  { id: 'tree-ne1', url: '/sprites/tree1.png', coord: { q: 4, r: -6, s: 2 }, scale: 2.0 },
  { id: 'tree-ne2', url: '/sprites/tree3.png', coord: { q: 6, r: -7, s: 1 }, scale: 2.2 },
  { id: 'tree-ne3', url: '/sprites/tree5.png', coord: { q: 7, r: -8, s: 1 }, scale: 1.8 },

  // Trees — south
  { id: 'tree-s1', url: '/sprites/tree2.png', coord: { q: -1, r: 6, s: -5 }, scale: 2.6 },
  { id: 'tree-s2', url: '/sprites/tree4.png', coord: { q: 1, r: 7, s: -8 }, scale: 2.6 },
  { id: 'tree-s3', url: '/sprites/tree7.png', coord: { q: -3, r: 7, s: -4 }, scale: 2.8 },
]

export const useSpriteState = create<SpriteState>((set, get) => ({
  sprites: initialSprites,
  heldSpriteId: null,

  pickUp: id => set({ heldSpriteId: id }),

  drop: coord =>
    set(s => ({
      heldSpriteId: null,
      sprites: s.sprites.map(sp => (sp.id === s.heldSpriteId ? { ...sp, coord } : sp)),
    })),

  cancel: () => set({ heldSpriteId: null }),

  spriteAt: coord => get().sprites.find(sp => hexEquals(sp.coord, coord)),
}))
