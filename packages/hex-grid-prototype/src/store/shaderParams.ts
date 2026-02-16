import { create } from 'zustand'

export interface ShaderParams {
  // Noise scales
  regionScale: number
  region2Scale: number
  blotchScale: number
  blotch2Scale: number
  wetEdgeScale: number
  grainScale: number
  fiberScaleX: number
  fiberScaleY: number
  speckleScale: number

  // Strengths / intensities
  sageStrength: number
  stainStrength: number
  poolLightStrength: number
  poolDarkStrength: number
  wetEdgeStrength: number
  grainIntensity: number
  fiberIntensity: number
  speckleIntensity: number

  // Hex edge
  edgeStrength: number
  edgeWidth: number

  set: (params: Partial<ShaderParams>) => void
}

export const defaultShaderParams: Omit<ShaderParams, 'set'> = {
  regionScale: 0.06,
  region2Scale: 0.09,
  blotchScale: 0.25,
  blotch2Scale: 0.15,
  wetEdgeScale: 0.12,
  grainScale: 4.0,
  fiberScaleX: 8.0,
  fiberScaleY: 2.0,
  speckleScale: 12.0,

  sageStrength: 0.35,
  stainStrength: 0.3,
  poolLightStrength: 0.25,
  poolDarkStrength: 0.15,
  wetEdgeStrength: 0.03,
  grainIntensity: 0.04,
  fiberIntensity: 0.022,
  speckleIntensity: 0.015,

  edgeStrength: 0.11,
  edgeWidth: 0.04,
}

export type ShaderParamValues = Omit<ShaderParams, 'set'>

// Presets only set noise/strength params — hex edge values are kept independent
type PresetValues = Omit<ShaderParamValues, 'edgeStrength' | 'edgeWidth'>

export const presets: Record<string, PresetValues> = {
  Parchment: {
    regionScale: 0.06,
    region2Scale: 0.09,
    blotchScale: 0.25,
    blotch2Scale: 0.15,
    wetEdgeScale: 0.12,
    grainScale: 4.0,
    fiberScaleX: 8.0,
    fiberScaleY: 2.0,
    speckleScale: 12.0,
    sageStrength: 0.35,
    stainStrength: 0.3,
    poolLightStrength: 0.25,
    poolDarkStrength: 0.15,
    wetEdgeStrength: 0.03,
    grainIntensity: 0.04,
    fiberIntensity: 0.022,
    speckleIntensity: 0.015,
  },

  Verdant: {
    regionScale: 0.04,
    region2Scale: 0.06,
    blotchScale: 0.2,
    blotch2Scale: 0.12,
    wetEdgeScale: 0.1,
    grainScale: 4.0,
    fiberScaleX: 7.0,
    fiberScaleY: 2.0,
    speckleScale: 10.0,
    sageStrength: 0.65,
    stainStrength: 0.1,
    poolLightStrength: 0.2,
    poolDarkStrength: 0.2,
    wetEdgeStrength: 0.02,
    grainIntensity: 0.035,
    fiberIntensity: 0.018,
    speckleIntensity: 0.012,
  },

  'Aged Map': {
    regionScale: 0.08,
    region2Scale: 0.12,
    blotchScale: 0.3,
    blotch2Scale: 0.2,
    wetEdgeScale: 0.14,
    grainScale: 5.0,
    fiberScaleX: 10.0,
    fiberScaleY: 3.0,
    speckleScale: 14.0,
    sageStrength: 0.15,
    stainStrength: 0.55,
    poolLightStrength: 0.15,
    poolDarkStrength: 0.3,
    wetEdgeStrength: 0.06,
    grainIntensity: 0.06,
    fiberIntensity: 0.03,
    speckleIntensity: 0.025,
  },

  'Clean Linen': {
    regionScale: 0.05,
    region2Scale: 0.07,
    blotchScale: 0.22,
    blotch2Scale: 0.14,
    wetEdgeScale: 0.1,
    grainScale: 5.5,
    fiberScaleX: 10.0,
    fiberScaleY: 2.5,
    speckleScale: 15.0,
    sageStrength: 0.08,
    stainStrength: 0.08,
    poolLightStrength: 0.3,
    poolDarkStrength: 0.1,
    wetEdgeStrength: 0.01,
    grainIntensity: 0.06,
    fiberIntensity: 0.035,
    speckleIntensity: 0.02,
  },

  Watercolor: {
    regionScale: 0.05,
    region2Scale: 0.07,
    blotchScale: 0.15,
    blotch2Scale: 0.1,
    wetEdgeScale: 0.1,
    grainScale: 3.5,
    fiberScaleX: 6.0,
    fiberScaleY: 1.5,
    speckleScale: 8.0,
    sageStrength: 0.5,
    stainStrength: 0.45,
    poolLightStrength: 0.35,
    poolDarkStrength: 0.25,
    wetEdgeStrength: 0.05,
    grainIntensity: 0.03,
    fiberIntensity: 0.015,
    speckleIntensity: 0.01,
  },

  'Jess Preference': {
    regionScale: 0.09,
    region2Scale: 0.25,
    blotchScale: 0.16,
    blotch2Scale: 0.2,
    wetEdgeScale: 0.0855,
    grainScale: 6.3,
    fiberScaleX: 6.74,
    fiberScaleY: 3.3,
    speckleScale: 7,
    sageStrength: 0.44,
    stainStrength: 0.42,
    poolLightStrength: 0.186,
    poolDarkStrength: 0.305,
    wetEdgeStrength: 0.003,
    grainIntensity: 0.0222,
    fiberIntensity: 0.0256,
    speckleIntensity: 0.0288,
  },
}

export const useShaderParams = create<ShaderParams>(set => ({
  ...defaultShaderParams,
  set: params => set(params),
}))
