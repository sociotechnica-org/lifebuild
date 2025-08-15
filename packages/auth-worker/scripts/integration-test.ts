#!/usr/bin/env tsx

/**
 * Auth Service Integration Test
 *
 * Tests all Milestone 1 features of the JWT authentication service.
 * Can be run standalone to verify auth service functionality.
 *
 * Usage:
 *   pnpm test:integration
 *   npx tsx scripts/integration-test.ts
 */

import { performance } from 'perf_hooks'
import { spawn, ChildProcess } from 'child_process'

// Test configuration
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8788'
const TEST_TIMEOUT = 30000 // 30 seconds
const AUTO_START_SERVER = process.env.AUTO_START_SERVER !== 'false' // Default to true

interface TestResult {
  name: string
  success: boolean
  duration: number
  error?: string
  data?: any
}

class AuthIntegrationTester {
  private results: TestResult[] = []
  private testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'SecureTestPass123!',
  }
  private serverProcess: ChildProcess | null = null

  /**
   * Make a POST request to the auth service
   */
  private async makeAuthRequest(endpoint: string, body: any): Promise<Response> {
    return await fetch(`${AUTH_SERVICE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  /**
   * Make a GET request to the auth service
   */
  private async makeGetRequest(endpoint: string): Promise<Response> {
    return await fetch(`${AUTH_SERVICE_URL}${endpoint}`)
  }

  /**
   * Validate successful response and return data
   */
  private async validateSuccessResponse(response: Response, operation: string): Promise<any> {
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`${operation} failed: ${response.status} - ${error}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(`${operation} failed: ${data.error?.message}`)
    }

    return data
  }

  /**
   * Validate error response with expected status and error code
   */
  private async validateErrorResponse(
    response: Response,
    expectedStatus: number,
    expectedErrorCode: string,
    operation: string
  ): Promise<void> {
    if (response.ok) {
      throw new Error(`${operation} should have been rejected`)
    }

    if (response.status !== expectedStatus) {
      throw new Error(`Expected ${expectedStatus} status, got ${response.status}`)
    }

    const data = await response.json()

    if (data.error?.code !== expectedErrorCode) {
      throw new Error(`Expected ${expectedErrorCode} error, got ${data.error?.code}`)
    }
  }

  /**
   * Start the development server
   */
  private async startServer(): Promise<boolean> {
    return new Promise(resolve => {
      console.log('🔧 Starting auth service...')

      this.serverProcess = spawn('pnpm', ['dev'], {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      let serverReady = false
      const timeout = setTimeout(() => {
        if (!serverReady) {
          console.error('❌ Server failed to start within 30 seconds')
          resolve(false)
        }
      }, 30000)

      this.serverProcess.stdout?.on('data', data => {
        const output = data.toString()
        if (output.includes('Ready on http://localhost:8788') && !serverReady) {
          serverReady = true
          clearTimeout(timeout)
          console.log('✅ Auth service started successfully')
          setTimeout(() => resolve(true), 1000) // Give it a moment to be fully ready
        }
      })

      this.serverProcess.stderr?.on('data', data => {
        const output = data.toString()
        if (output.includes('Address already in use')) {
          console.log('ℹ️  Server already running on port 8788')
          serverReady = true
          clearTimeout(timeout)
          resolve(true)
        }
      })

      this.serverProcess.on('error', error => {
        console.error('❌ Failed to start server:', error.message)
        clearTimeout(timeout)
        resolve(false)
      })
    })
  }

  /**
   * Stop the development server
   */
  private stopServer(): void {
    if (this.serverProcess && !this.serverProcess.killed) {
      console.log('🛑 Stopping auth service...')
      this.serverProcess.kill('SIGTERM')
      this.serverProcess = null
    }
  }

  /**
   * Run all integration tests
   */
  async runAllTests(): Promise<boolean> {
    console.log('🚀 Starting Auth Service Integration Tests')
    console.log(`📍 Testing against: ${AUTH_SERVICE_URL}`)
    console.log(`📧 Test user: ${this.testUser.email}`)
    console.log('')

    // Auto-start server if needed
    if (AUTO_START_SERVER) {
      const started = await this.startServer()
      if (!started) {
        console.error('❌ Failed to start auth service automatically')
        return false
      }
    }

    // Check if service is running
    const healthCheck = await this.runTest('Health Check', () => this.testHealth())
    if (!healthCheck.success) {
      if (AUTO_START_SERVER) {
        this.stopServer()
      }
      console.error('❌ Auth service is not accessible')
      if (!AUTO_START_SERVER) {
        console.error("   Make sure it's running: pnpm dev")
        console.error('   Or set AUTO_START_SERVER=true to start automatically')
      }
      return false
    }

    // Core auth flow tests
    await this.runTest('User Signup', () => this.testSignup())
    await this.runTest('Duplicate Email Rejection', () => this.testDuplicateSignup())
    await this.runTest('User Login', () => this.testLogin())
    await this.runTest('Invalid Credentials', () => this.testInvalidLogin())
    await this.runTest('Token Refresh', () => this.testTokenRefresh())
    await this.runTest('User Logout', () => this.testLogout())

    // Security tests
    await this.runTest('Password Strength Validation', () => this.testWeakPassword())
    await this.runTest('Email Format Validation', () => this.testInvalidEmail())
    await this.runTest('Invalid Token Rejection', () => this.testInvalidToken())
    await this.runTest('CORS Headers', () => this.testCorsHeaders())

    // Performance tests
    await this.runTest('Response Time Check', () => this.testResponseTime())

    this.printSummary()

    // Cleanup server if we started it
    if (AUTO_START_SERVER) {
      this.stopServer()
    }

    return this.results.every(r => r.success)
  }

  /**
   * Test the health endpoint
   */
  private async testHealth(): Promise<void> {
    const response = await this.makeGetRequest('/health')

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`)
    }

    const data = await response.json()

    if (data.status !== 'healthy') {
      throw new Error(`Service reports unhealthy status: ${data.status}`)
    }

    return data
  }

  /**
   * Test user signup
   */
  private async testSignup(): Promise<any> {
    const response = await this.makeAuthRequest('/signup', this.testUser)
    const data = await this.validateSuccessResponse(response, 'Signup')

    // Validate response structure
    if (!data.user || !data.accessToken || !data.refreshToken) {
      throw new Error('Signup response missing required fields')
    }

    if (data.user.email !== this.testUser.email) {
      throw new Error('User email mismatch in response')
    }

    if (!data.user.instances || data.user.instances.length === 0) {
      throw new Error('User should have default instance')
    }

    if (data.user.instances[0].name !== 'Personal Workspace') {
      throw new Error('Default instance should be named "Personal Workspace"')
    }

    return data
  }

  /**
   * Test duplicate email rejection
   */
  private async testDuplicateSignup(): Promise<void> {
    const response = await this.makeAuthRequest('/signup', this.testUser)
    await this.validateErrorResponse(response, 400, 'EMAIL_ALREADY_EXISTS', 'Duplicate signup')
  }

  /**
   * Test user login
   */
  private async testLogin(): Promise<any> {
    const response = await this.makeAuthRequest('/login', this.testUser)
    const data = await this.validateSuccessResponse(response, 'Login')

    // Validate response structure
    if (!data.user || !data.accessToken || !data.refreshToken) {
      throw new Error('Login response missing required fields')
    }

    if (data.user.email !== this.testUser.email) {
      throw new Error('User email mismatch in login response')
    }

    return data
  }

  /**
   * Test invalid credentials
   */
  private async testInvalidLogin(): Promise<void> {
    const invalidCredentials = {
      email: this.testUser.email,
      password: 'WrongPassword123!',
    }
    const response = await this.makeAuthRequest('/login', invalidCredentials)
    await this.validateErrorResponse(response, 400, 'INVALID_CREDENTIALS', 'Invalid login')
  }

  /**
   * Test token refresh
   */
  private async testTokenRefresh(): Promise<void> {
    // First login to get tokens
    const loginData = await this.testLogin()

    const response = await this.makeAuthRequest('/refresh', {
      refreshToken: loginData.refreshToken,
    })
    const data = await this.validateSuccessResponse(response, 'Token refresh')

    if (!data.accessToken || !data.refreshToken) {
      throw new Error('Refresh response missing tokens')
    }

    // New tokens should be different
    if (data.accessToken === loginData.accessToken) {
      throw new Error('New access token should be different')
    }

    if (data.refreshToken === loginData.refreshToken) {
      throw new Error('New refresh token should be different (token rotation)')
    }
  }

  /**
   * Test logout
   */
  private async testLogout(): Promise<void> {
    const response = await this.makeAuthRequest('/logout', {
      refreshToken: 'any-token',
    })
    await this.validateSuccessResponse(response, 'Logout')
  }

  /**
   * Test weak password rejection
   */
  private async testWeakPassword(): Promise<void> {
    const weakUser = {
      email: `weak-${Date.now()}@example.com`,
      password: 'weak',
    }
    const response = await this.makeAuthRequest('/signup', weakUser)
    await this.validateErrorResponse(response, 400, 'WEAK_PASSWORD', 'Weak password signup')
  }

  /**
   * Test invalid email format
   */
  private async testInvalidEmail(): Promise<void> {
    const invalidEmailUser = {
      email: 'invalid-email-format',
      password: 'ValidPass123!',
    }
    const response = await this.makeAuthRequest('/signup', invalidEmailUser)
    await this.validateErrorResponse(response, 400, 'INVALID_REQUEST', 'Invalid email signup')
  }

  /**
   * Test invalid token rejection
   */
  private async testInvalidToken(): Promise<void> {
    const response = await this.makeAuthRequest('/refresh', {
      refreshToken: 'invalid.jwt.token',
    })
    await this.validateErrorResponse(response, 400, 'INVALID_TOKEN', 'Invalid token refresh')
  }

  /**
   * Test CORS headers
   */
  private async testCorsHeaders(): Promise<void> {
    const response = await fetch(`${AUTH_SERVICE_URL}/health`, {
      method: 'OPTIONS',
    })

    if (response.status !== 204) {
      throw new Error(`Expected 204 for OPTIONS, got ${response.status}`)
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
    }

    if (!corsHeaders['Access-Control-Allow-Origin']) {
      throw new Error('Missing CORS Allow-Origin header')
    }

    if (!corsHeaders['Access-Control-Allow-Methods']?.includes('POST')) {
      throw new Error('CORS should allow POST method')
    }

    return corsHeaders
  }

  /**
   * Test response time performance
   */
  private async testResponseTime(): Promise<number> {
    const start = performance.now()

    await this.makeGetRequest('/health')

    const duration = performance.now() - start

    if (duration > 2000) {
      // 2 seconds
      throw new Error(`Health endpoint too slow: ${duration.toFixed(0)}ms`)
    }

    return duration
  }

  /**
   * Run a single test with error handling
   */
  private async runTest(name: string, testFn: () => Promise<any>): Promise<TestResult> {
    const start = performance.now()
    console.log(`🧪 ${name}...`)

    try {
      const data = await Promise.race([
        testFn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Test timeout')), TEST_TIMEOUT)
        ),
      ])

      const duration = performance.now() - start
      const result: TestResult = { name, success: true, duration, data }

      console.log(`   ✅ Passed (${duration.toFixed(0)}ms)`)
      this.results.push(result)
      return result
    } catch (error) {
      const duration = performance.now() - start
      const result: TestResult = {
        name,
        success: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
      }

      console.log(`   ❌ Failed (${duration.toFixed(0)}ms): ${result.error}`)
      this.results.push(result)
      return result
    }
  }

  /**
   * Print test summary
   */
  private printSummary(): void {
    console.log('')
    console.log('📊 Test Summary')
    console.log('===============')

    const passed = this.results.filter(r => r.success).length
    const failed = this.results.filter(r => !r.success).length
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0)

    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏱️  Total time: ${totalTime.toFixed(0)}ms`)
    console.log('')

    if (failed > 0) {
      console.log('❌ Failed Tests:')
      this.results.filter(r => !r.success).forEach(r => console.log(`   • ${r.name}: ${r.error}`))
      console.log('')
    }

    if (passed === this.results.length) {
      console.log('🎉 All tests passed! Auth service is working correctly.')
    } else {
      console.log('💥 Some tests failed. Check the auth service implementation.')
    }
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new AuthIntegrationTester()

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...')
    if ((tester as any).serverProcess) {
      ;(tester as any).stopServer()
    }
    process.exit(0)
  })

  tester
    .runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('💥 Test runner error:', error)
      if ((tester as any).serverProcess) {
        ;(tester as any).stopServer()
      }
      process.exit(1)
    })
}

export default AuthIntegrationTester
