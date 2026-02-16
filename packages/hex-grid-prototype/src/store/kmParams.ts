import { create } from 'zustand'

export type ShaderMode = 'parchment' | 'kubelkaMunk'

export interface KMParams {
  // Pigment amounts (how much of each pigment is present)
  ochreAmount: number
  siennaAmount: number
  greenAmount: number
  umberAmount: number

  // Paint thickness
  baseThickness: number
  thicknessVariation: number

  // Spatial distribution
  regionScale: number
  blotchScale: number

  // Paper texture
  grainScale: number
  grainIntensity: number
  edgeDarkening: number

  // Hex edge
  edgeStrength: number
  edgeWidth: number

  set: (params: Partial<KMParams>) => void
}

export const defaultKMParams: Omit<KMParams, 'set'> = {
  ochreAmount: 0.55,
  siennaAmount: 0.30,
  greenAmount: 0.35,
  umberAmount: 0.15,

  baseThickness: 0.5,
  thicknessVariation: 0.35,

  regionScale: 0.06,
  blotchScale: 0.20,

  grainScale: 4.0,
  grainIntensity: 0.03,
  edgeDarkening: 0.04,

  edgeStrength: 0.11,
  edgeWidth: 0.04,
}

export type KMPresetValues = Omit<KMParams, 'set' | 'edgeStrength' | 'edgeWidth'>

export const kmPresets: Record<string, KMPresetValues> = {
  'Warm Parchment': {
    ochreAmount: 0.55,
    siennaAmount: 0.30,
    greenAmount: 0.35,
    umberAmount: 0.15,
    baseThickness: 0.5,
    thicknessVariation: 0.35,
    regionScale: 0.06,
    blotchScale: 0.20,
    grainScale: 4.0,
    grainIntensity: 0.03,
    edgeDarkening: 0.04,
  },

  'Verdant Wash': {
    ochreAmount: 0.25,
    siennaAmount: 0.10,
    greenAmount: 0.65,
    umberAmount: 0.10,
    baseThickness: 0.7,
    thicknessVariation: 0.4,
    regionScale: 0.05,
    blotchScale: 0.15,
    grainScale: 4.0,
    grainIntensity: 0.025,
    edgeDarkening: 0.04,
  },

  'Aged Treasure Map': {
    ochreAmount: 0.40,
    siennaAmount: 0.50,
    greenAmount: 0.12,
    umberAmount: 0.35,
    baseThickness: 1.0,
    thicknessVariation: 0.5,
    regionScale: 0.08,
    blotchScale: 0.25,
    grainScale: 5.0,
    grainIntensity: 0.05,
    edgeDarkening: 0.08,
  },

  'Light Wash': {
    ochreAmount: 0.35,
    siennaAmount: 0.12,
    greenAmount: 0.20,
    umberAmount: 0.06,
    baseThickness: 0.3,
    thicknessVariation: 0.25,
    regionScale: 0.05,
    blotchScale: 0.18,
    grainScale: 4.5,
    grainIntensity: 0.04,
    edgeDarkening: 0.02,
  },

  'Deep Forest': {
    ochreAmount: 0.15,
    siennaAmount: 0.20,
    greenAmount: 0.75,
    umberAmount: 0.30,
    baseThickness: 1.2,
    thicknessVariation: 0.45,
    regionScale: 0.04,
    blotchScale: 0.12,
    grainScale: 3.5,
    grainIntensity: 0.02,
    edgeDarkening: 0.06,
  },
}

export const useKMParams = create<KMParams>(set => ({
  ...defaultKMParams,
  set: (params) => set(params),
}))

export const useShaderMode = create<{
  mode: ShaderMode
  toggle: () => void
}>(set => ({
  mode: 'parchment',
  toggle: () => set(s => ({ mode: s.mode === 'parchment' ? 'kubelkaMunk' : 'parchment' })),
}))
