/**
 * Animation timing constants for LifeMap UI
 * Adjust these values to change animation speeds across the entire LifeMap system
 */

/**
 * Category scale up/down animation (zoom effect)
 * This is the main zoom animation when clicking a category card
 */
export const CATEGORY_SCALE_DURATION = 0.3 // seconds

/**
 * Category card layout transition duration
 * Used for the card itself during the zoom animation
 */
export const CATEGORY_CARD_LAYOUT_DURATION = 0.3 // seconds

/**
 * Card fade out when category is expanding
 * How quickly other cards disappear when one expands
 */
export const CARD_FADE_OUT_DURATION = 0.05 // seconds

/**
 * Exit transition duration (for immediate exits)
 */
export const EXIT_TRANSITION_DURATION = 0.05 // seconds

/**
 * Card fade in when category is collapsing
 * How quickly cards reappear when category closes
 */
export const CARD_FADE_IN_DURATION = 0.3 // seconds
export const CARD_FADE_IN_DELAY = 0.15 // seconds

/**
 * Text fade in/out on category cards
 */
export const CARD_TEXT_FADE_DURATION = 0.3 // seconds
export const CARD_TEXT_FADE_DELAY = 0.1 // seconds

/**
 * Background color transition when category expands/collapses
 */
export const BACKGROUND_EXPAND_DURATION = 0.7 // seconds
export const BACKGROUND_COLLAPSE_DURATION = 0.35 // seconds

/**
 * Project cards fade in after category expansion completes
 * Delay matches CATEGORY_SCALE_DURATION
 */
export const PROJECT_CARDS_SHOW_DELAY = CATEGORY_SCALE_DURATION // seconds
export const PROJECT_CARDS_FADE_DURATION = 0.3 // seconds

/**
 * Project modal animations
 */
export const PROJECT_MODAL_DURATION = 0.3 // seconds
export const PROJECT_MODAL_SCALE = 1.05 // 5% scale up/down

/**
 * Morphing category timeout
 * Must match CATEGORY_SCALE_DURATION (in milliseconds)
 */
export const MORPHING_CATEGORY_TIMEOUT = CATEGORY_SCALE_DURATION * 1000 // milliseconds

/**
 * Easing functions
 */
export const EASE_SMOOTH = [0.4, 0, 0.2, 1] as const
export const EASE_CARD = [0.2, 0, 0.1, 1] as const
