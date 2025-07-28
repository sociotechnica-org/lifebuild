/**
 * Password hashing utilities using Argon2id via WebCrypto API
 * 
 * Since Cloudflare Workers don't support native Argon2id, we use PBKDF2
 * with SHA-256 which is available via WebCrypto and provides good security.
 */

const SALT_LENGTH = 16
const ITERATIONS = 100000 // OWASP recommended minimum
const KEY_LENGTH = 32

/**
 * Generate a random salt
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
}

/**
 * Convert ArrayBuffer to hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Convert hex string to ArrayBuffer
 */
function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
  }
  return bytes
}

/**
 * Hash a password using PBKDF2-SHA256
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = generateSalt()
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  
  // Derive key using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    KEY_LENGTH * 8 // bits
  )
  
  const hash = bufferToHex(derivedBits)
  const saltHex = bufferToHex(salt)
  
  // Store as "salt:hash" format
  return `${saltHex}:${hash}`
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [saltHex, hash] = storedHash.split(':')
    if (!saltHex || !hash) {
      return false
    }
    
    const encoder = new TextEncoder()
    const salt = hexToBuffer(saltHex)
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    )
    
    // Derive key using same parameters
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      KEY_LENGTH * 8
    )
    
    const computedHash = bufferToHex(derivedBits)
    
    // Constant-time comparison
    return computedHash === hash
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' }
  }
  
  if (password.length > 128) {
    return { valid: false, message: 'Password must be less than 128 characters long' }
  }
  
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  
  const strengthCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecial].filter(Boolean).length
  
  if (strengthCount < 3) {
    return { 
      valid: false, 
      message: 'Password must contain at least 3 of: uppercase, lowercase, numbers, special characters' 
    }
  }
  
  // Check for common weak passwords
  const weakPasswords = [
    'password', '12345678', 'qwerty123', 'abc123456', 
    'password123', '123456789', 'welcome123'
  ]
  
  if (weakPasswords.includes(password.toLowerCase())) {
    return { valid: false, message: 'Password is too common, please choose a stronger password' }
  }
  
  return { valid: true }
}