/**
 * Simple logger that can suppress output during tests
 */

const isTest = process.env.NODE_ENV === 'test'

export const logger = {
  log: (...args: any[]) => {
    if (!isTest) {
      console.log(...args)
    }
  },
  warn: (...args: any[]) => {
    if (!isTest) {
      console.warn(...args)
    }
  },
  error: (...args: any[]) => {
    // Always show errors, even in tests
    console.error(...args)
  },
  info: (...args: any[]) => {
    if (!isTest) {
      console.info(...args)
    }
  },
}
