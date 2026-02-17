import { create } from 'zustand'
import type { HexCoord } from '../hex/types.js'

interface GameState {
  selectedHex: HexCoord | null
  unitPosition: HexCoord
  unitPath: HexCoord[]
  isMoving: boolean
  currentPathIndex: number
  cameraElevation: number // degrees, 0 = flat on map, 90 = directly overhead

  selectHex: (hex: HexCoord | null) => void
  startMove: (path: HexCoord[]) => void
  advancePath: () => void
  finishMove: (destination: HexCoord) => void
  setCameraElevation: (degrees: number) => void
}

export const useGameState = create<GameState>(set => ({
  selectedHex: null,
  unitPosition: { q: 0, r: 0, s: 0 },
  unitPath: [],
  isMoving: false,
  currentPathIndex: 0,
  cameraElevation: 30,

  selectHex: hex => set({ selectedHex: hex }),
  setCameraElevation: degrees => set({ cameraElevation: degrees }),

  startMove: path =>
    set({
      unitPath: path,
      isMoving: true,
      currentPathIndex: 1, // skip index 0 (current position)
    }),

  advancePath: () =>
    set(s => ({
      currentPathIndex: s.currentPathIndex + 1,
    })),

  finishMove: destination =>
    set({
      unitPosition: destination,
      unitPath: [],
      isMoving: false,
      currentPathIndex: 0,
    }),
}))
