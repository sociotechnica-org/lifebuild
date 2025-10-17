import type { Env } from './_worker.js'
import {
  verifyJWT,
  isWithinGracePeriod,
  DEFAULT_GRACE_PERIOD_SECONDS,
  DEV_AUTH,
  AuthErrorCode,
} from '@work-squared/shared/auth'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

interface UploadImageResponse {
  url: string
  key: string
}

interface ErrorResponse {
  error: string
  code?: string
}

/**
 * Authenticate request using JWT or dev token
 */
async function authenticateRequest(request: Request, env: Env): Promise<{ userId: string }> {
  const requireAuth = env.REQUIRE_AUTH === 'true' || env.ENVIRONMENT === 'production'

  // Development mode - allow unauthenticated access
  if (!requireAuth) {
    console.log('Auth disabled in development mode')
    return { userId: DEV_AUTH.DEFAULT_USER_ID }
  }

  // Check for auth token
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    throw new Error(`${AuthErrorCode.TOKEN_MISSING}: Authentication required`)
  }

  const token = authHeader.replace('Bearer ', '')

  // Handle legacy insecure token during transition
  if (token === DEV_AUTH.INSECURE_TOKEN) {
    if (env.ENVIRONMENT === 'development') {
      console.log('Using legacy insecure token in development')
      return { userId: DEV_AUTH.DEFAULT_USER_ID }
    } else {
      throw new Error(`${AuthErrorCode.TOKEN_INVALID}: Legacy token not allowed in production`)
    }
  }

  // Verify JWT
  const jwtSecret = env.JWT_SECRET
  if (!jwtSecret) {
    throw new Error(`${AuthErrorCode.AUTH_SERVICE_ERROR}: JWT secret not configured`)
  }

  const payload = await verifyJWT(token, jwtSecret)
  if (!payload) {
    throw new Error(`${AuthErrorCode.TOKEN_INVALID}: Invalid JWT token`)
  }

  // Check expiration with grace period
  const gracePeriodSeconds = parseInt(
    env.GRACE_PERIOD_SECONDS || DEFAULT_GRACE_PERIOD_SECONDS.toString()
  )

  if (!isWithinGracePeriod(payload, gracePeriodSeconds)) {
    throw new Error(`${AuthErrorCode.GRACE_PERIOD_EXPIRED}: Token expired beyond grace period`)
  }

  return { userId: payload.userId }
}

/**
 * Validate uploaded file
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`,
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }
  }

  return { valid: true }
}

/**
 * Generate unique key for uploaded image
 */
function generateImageKey(filename: string): string {
  const ext = filename.split('.').pop() || 'jpg'
  const uuid = crypto.randomUUID()
  return `covers/${uuid}.${ext}`
}

/**
 * Handle image upload request
 */
export async function handleImageUpload(request: Request, env: Env): Promise<Response> {
  try {
    // Authenticate request
    const { userId } = await authenticateRequest(request, env)
    console.log(`Image upload request from user: ${userId}`)

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided', code: 'NO_FILE' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error!, code: 'INVALID_FILE' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // Generate unique key
    const key = generateImageKey(file.name)

    // Upload to R2
    await env.IMAGES.put(key, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        originalName: file.name,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      },
    })

    console.log(`Image uploaded successfully: ${key}`)

    // Generate public URL from R2 bucket
    const r2PublicUrl = env.R2_PUBLIC_URL
    if (!r2PublicUrl) {
      throw new Error('R2_PUBLIC_URL not configured')
    }
    const url = `${r2PublicUrl}/${key}`

    return new Response(JSON.stringify({ url, key }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Image upload error:', error)
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack)
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isAuthError = errorMessage.includes(AuthErrorCode.TOKEN_MISSING)

    return new Response(
      JSON.stringify({
        error: isAuthError ? 'Authentication required' : 'Upload failed',
        code: isAuthError ? 'AUTH_REQUIRED' : 'UPLOAD_FAILED',
        details: errorMessage, // Include error message for debugging
      }),
      {
        status: isAuthError ? 401 : 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
}

/**
 * Handle image retrieval request
 */
export async function handleImageGet(request: Request, env: Env, key: string): Promise<Response> {
  try {
    const object = await env.IMAGES.get(key)

    if (!object) {
      return new Response('Image not found', { status: 404 })
    }

    return new Response(object.body as unknown as BodyInit, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
        ETag: object.etag,
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Image retrieval error:', error)
    return new Response('Failed to retrieve image', { status: 500 })
  }
}
