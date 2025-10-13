/**
 * LifeSquared Color System
 * Professional without being cold, warm without being cozy, modern without being clinical.
 */

// ===== WARM NEUTRALS =====
// Every neutral has been warmed - no pure whites, grays, or blacks

export const SANCTUARY_WHITE = '#FDFCFB' // Almost white with faintest beige, like fresh paper in warm sunlight
export const SOFT_PLATINUM = '#F5F3F0' // Touch darker with brown undertones, for cards and containers
export const WARM_STONE = '#E8E5E0' // Deeper, like aged plaster or sun-baked clay, for tertiary elements

export const DEEP_EARTH = '#2C2520' // Dark brown-black, organic rather than digital - for primary text
export const CLAY_BROWN = '#5C534A' // For secondary text
export const WARM_GRAY = '#9B938A' // For the quietest elements

// ===== ADVISOR COLORS: CONTEMPLATION & WISDOM =====
export const PURPOSEFUL_BLUE = '#4A7BA7' // Strategic thinking, elevated perspective
export const CALM_TEAL = '#5B9B9F' // Contemplation and insight
export const SOFT_PURPLE = '#8B7FA8' // Wisdom and reflection

// ===== WORKER COLORS: ACTION & ENERGY =====
export const WARM_CORAL = '#D97C6E' // Action and execution
export const FOREST_GREEN = '#6B8E6F' // Capability and growth
export const WARM_AMBER = '#D9A052' // Energy and getting things done

// ===== FEEDBACK COLORS =====
export const SUCCESS_GREEN = '#7FAA73' // Soft and natural, like spring growth
export const ATTENTION_AMBER = '#E0A555' // Warm and encouraging, never screaming
export const GENTLE_WARNING = '#D18866' // Muted orange-red, serious without alarming

// ===== LIFE CATEGORY COLORS (warmed and earthier) =====
export const HEALTH_EMERALD = '#6B9E7A' // Health & Well-Being
export const RELATIONSHIPS_ROSE = '#C98B8E' // Relationships
export const FINANCES_GOLD = '#C2A05D' // Finances
export const GROWTH_SAPPHIRE = '#6B8BAA' // Personal Growth & Learning
export const LEISURE_LAVENDER = '#9B88B3' // Leisure & Lifestyle
export const SPIRITUALITY_INDIGO = '#7B7FA8' // Spirituality & Meaning
export const HOME_AMBER = '#D2A368' // Home & Environment
export const CONTRIBUTION_TERRA = '#B8806F' // Contribution & Service

/**
 * Shadow System
 * Three levels of depth with warm, organic shadows
 */
export const SHADOW_LEVEL_1 = '0 1px 3px rgba(44, 37, 32, 0.08)'
export const SHADOW_LEVEL_2 = '0 4px 8px rgba(44, 37, 32, 0.12)'
export const SHADOW_LEVEL_3 = '0 8px 16px rgba(44, 37, 32, 0.16)'

/**
 * Animation Timing
 * Spring-based with natural physics
 */
export const TIMING = {
  QUICK: 150, // Fast enough to feel immediate
  STANDARD: 250, // Standard transitions with subtle bounce
  THOUGHTFUL: 450, // Weight for important transitions
  EMERGENCE: 1200, // Token materialization ceremony
  ACTIVATION: 800, // Token activation transformation
  CELEBRATION: 2000, // Success celebration
} as const

/**
 * Spring Easing
 * CSS cubic-bezier that mimics spring physics
 */
export const SPRING_EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
export const GENTLE_EASING = 'cubic-bezier(0.32, 0.94, 0.60, 1)'
