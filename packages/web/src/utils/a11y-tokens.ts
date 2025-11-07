/**
 * Accessibility design tokens for consistent focus states, colors, and interactions
 * Following WCAG 2.2 Level AA guidelines
 */

export const a11yTokens = {
  /**
   * Focus ring styles for keyboard navigation
   * Uses blue-500 for visibility and consistency
   */
  focusRing: {
    base: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
    inset:
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset',
    none: 'focus-visible:outline-none',
  },

  /**
   * Semantic colors for notifications and states
   * Ensures 4.5:1 contrast ratio for text
   */
  colors: {
    error: {
      bg: 'bg-red-50',
      text: 'text-red-800',
      border: 'border-red-600',
      button: 'bg-red-600 hover:bg-red-700',
    },
    success: {
      bg: 'bg-green-50',
      text: 'text-green-800',
      border: 'border-green-600',
      button: 'bg-green-600 hover:bg-green-700',
    },
    warning: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-600',
      button: 'bg-amber-600 hover:bg-amber-700',
    },
    info: {
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
  },

  /**
   * Motion preferences
   * Respects user's prefers-reduced-motion setting
   */
  motion: {
    safe: 'transition-all duration-200 motion-reduce:transition-none',
    safeFast: 'transition-all duration-150 motion-reduce:transition-none',
    safeSlow: 'transition-all duration-300 motion-reduce:transition-none',
  },

  /**
   * Interactive states
   */
  interactive: {
    hover: 'hover:bg-gray-100 transition-colors duration-150 motion-reduce:transition-none',
    active: 'active:scale-95 transition-transform duration-100 motion-reduce:transition-none',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
  },

  /**
   * Screen reader only text
   */
  srOnly: 'sr-only',
} as const

/**
 * Helper function to combine focus ring with other classes
 */
export function withFocusRing(
  classes: string,
  focusType: keyof typeof a11yTokens.focusRing = 'base'
): string {
  return `${classes} ${a11yTokens.focusRing[focusType]}`
}

/**
 * Helper function to get semantic color classes
 */
export function getSemanticColors(type: keyof typeof a11yTokens.colors) {
  return a11yTokens.colors[type]
}
