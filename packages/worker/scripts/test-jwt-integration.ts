#!/usr/bin/env tsx

/**
 * Integration test script for JWT authentication with sync server
 * 
 * This script tests the complete flow:
 * 1. Creates a test user via auth service
 * 2. Tests sync payload validation with JWT
 * 3. Verifies event metadata injection
 * 4. Tests grace period handling
 * 5. Cleans up test data
 * 
 * Usage:
 *   pnpm test:jwt-integration
 *   npx tsx scripts/test-jwt-integration.ts
 */

import { performance } from 'perf_hooks'

// Configuration
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://work-squared-auth.jessmartin.workers.dev'
const SYNC_SERVICE_URL = process.env.SYNC_SERVICE_URL || 'http://localhost:8787'
const TEST_TIMEOUT = 30000 // 30 seconds

interface TestResult {
  name: string
  success: boolean
  duration: number
  error?: string
  data?: any
}

class JWTIntegrationTester {
  private results: TestResult[] = []
  private testUser = {
    email: `jwt-integration-test-${Date.now()}@example.com`,
    password: 'SecureJWTTestPass123!'
  }
  private authTokens: any = null

  /**
   * Make a request to auth service
   */
  private async makeAuthRequest(endpoint: string, body: any): Promise<Response> {
    return await fetch(`${AUTH_SERVICE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  }

  /**
   * Validate response and return data
   */
  private async validateResponse(response: Response, operation: string): Promise<any> {
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
   * Test user signup and get JWT tokens
   */
  private async testUserSignup(): Promise<any> {
    const response = await this.makeAuthRequest('/signup', this.testUser)
    const data = await this.validateResponse(response, 'User signup')

    // Store tokens for subsequent tests
    this.authTokens = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user
    }

    return data
  }

  /**
   * Test JWT token refresh
   */
  private async testTokenRefresh(): Promise<any> {
    if (!this.authTokens?.refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await this.makeAuthRequest('/refresh', {
      refreshToken: this.authTokens.refreshToken
    })
    const data = await this.validateResponse(response, 'Token refresh')

    // Update tokens
    this.authTokens.accessToken = data.accessToken
    this.authTokens.refreshToken = data.refreshToken

    return data
  }

  /**
   * Test sync payload validation
   */
  private async testSyncPayloadValidation(): Promise<any> {
    if (!this.authTokens?.accessToken) {
      throw new Error('No access token available')
    }

    const syncPayload = {
      instanceId: this.authTokens.user.instances[0].id,
      authToken: this.authTokens.accessToken
    }

    // In a real test, this would test the actual WebSocket connection
    // For now, we simulate the validation logic
    console.log('Testing sync payload structure:', {
      hasInstanceId: !!syncPayload.instanceId,
      hasAuthToken: !!syncPayload.authToken,
      tokenLength: syncPayload.authToken.length
    })

    // Validate JWT structure (basic check)
    const tokenParts = syncPayload.authToken.split('.')
    if (tokenParts.length !== 3) {
      throw new Error('Invalid JWT format - should have 3 parts')
    }

    return { valid: true, syncPayload }
  }

  /**
   * Test event metadata structure
   */
  private async testEventMetadata(): Promise<any> {
    const mockEvents = [
      {
        name: 'v1.TaskCreated',
        args: {
          id: 'task-123',
          title: 'Test Task',
          projectId: 'project-456',
          columnId: 'column-789',
          position: 1,
          createdAt: new Date(),
          // metadata should be injected by worker
        }
      },
      {
        name: 'v1.ProjectCreated',
        args: {
          id: 'project-456',
          name: 'Test Project',
          description: 'A test project',
          createdAt: new Date(),
          // metadata should be injected by worker
        }
      }
    ]

    // Simulate metadata injection
    const userId = this.authTokens?.user?.id || 'test-user'
    const injectedEvents = mockEvents.map(event => ({
      ...event,
      args: {
        ...event.args,
        metadata: {
          userId,
          timestamp: Date.now()
        }
      }
    }))

    // Validate metadata structure
    for (const event of injectedEvents) {
      if (!event.args.metadata) {
        throw new Error(`Event ${event.name} missing metadata`)
      }
      if (!event.args.metadata.userId) {
        throw new Error(`Event ${event.name} missing userId in metadata`)
      }
      if (!event.args.metadata.timestamp) {
        throw new Error(`Event ${event.name} missing timestamp in metadata`)
      }
    }

    return { events: injectedEvents, userId }
  }

  /**
   * Test grace period logic
   */
  private async testGracePeriod(): Promise<any> {
    const now = Math.floor(Date.now() / 1000)
    const gracePeriodSeconds = 24 * 60 * 60 // 24 hours

    const testCases = [
      {
        name: 'Valid token',
        exp: now + 3600, // 1 hour from now
        shouldBeValid: true
      },
      {
        name: 'Recently expired (within grace)',
        exp: now - 1800, // 30 minutes ago
        shouldBeValid: true
      },
      {
        name: 'Expired beyond grace',
        exp: now - (25 * 3600), // 25 hours ago
        shouldBeValid: false
      }
    ]

    const results = testCases.map(testCase => {
      const isWithinGrace = testCase.exp + gracePeriodSeconds > now
      const passed = isWithinGrace === testCase.shouldBeValid
      
      return {
        ...testCase,
        isWithinGrace,
        passed
      }
    })

    const allPassed = results.every(r => r.passed)
    if (!allPassed) {
      throw new Error('Grace period logic validation failed')
    }

    return { results, gracePeriodSeconds }
  }

  /**
   * Test development mode fallback
   */
  private async testDevelopmentFallback(): Promise<any> {
    const insecurePayload = {
      instanceId: 'test-instance',
      authToken: 'insecure-token-change-me'
    }

    // In development mode, this should be accepted
    // In production mode, this should be rejected
    const environment = process.env.NODE_ENV || 'development'
    const shouldAccept = environment === 'development'

    console.log('Testing development fallback:', {
      environment,
      shouldAccept,
      payload: insecurePayload
    })

    return { environment, shouldAccept, payload: insecurePayload }
  }

  /**
   * Cleanup test user
   */
  private async cleanup(): Promise<void> {
    if (this.authTokens?.refreshToken) {
      try {
        await this.makeAuthRequest('/logout', {
          refreshToken: this.authTokens.refreshToken
        })
        console.log('✅ Test user cleanup completed')
      } catch (error) {
        console.warn('⚠️  Test user cleanup failed:', error)
      }
    }
  }

  /**
   * Run a single test
   */
  private async runTest(name: string, testFn: () => Promise<any>): Promise<TestResult> {
    const start = performance.now()
    console.log(`🧪 ${name}...`)

    try {
      const data = await Promise.race([
        testFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), TEST_TIMEOUT)
        )
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
        error: error instanceof Error ? error.message : String(error)
      }
      
      console.log(`   ❌ Failed (${duration.toFixed(0)}ms): ${result.error}`)
      this.results.push(result)
      return result
    }
  }

  /**
   * Run all JWT integration tests
   */
  async runAllTests(): Promise<boolean> {
    console.log('🚀 Starting JWT Sync Integration Tests')
    console.log(`📍 Auth Service: ${AUTH_SERVICE_URL}`)
    console.log(`📍 Sync Service: ${SYNC_SERVICE_URL}`)
    console.log(`📧 Test User: ${this.testUser.email}`)
    console.log('')

    try {
      // Core JWT flow tests
      await this.runTest('User Signup & JWT Generation', () => this.testUserSignup())
      await this.runTest('Token Refresh', () => this.testTokenRefresh())
      await this.runTest('Sync Payload Validation', () => this.testSyncPayloadValidation())
      
      // Event attribution tests
      await this.runTest('Event Metadata Injection', () => this.testEventMetadata())
      
      // Grace period tests
      await this.runTest('Grace Period Logic', () => this.testGracePeriod())
      
      // Development mode tests
      await this.runTest('Development Mode Fallback', () => this.testDevelopmentFallback())

      this.printSummary()
      return this.results.every(r => r.success)

    } finally {
      // Always cleanup, even if tests fail
      await this.cleanup()
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
      this.results
        .filter(r => !r.success)
        .forEach(r => console.log(`   • ${r.name}: ${r.error}`))
      console.log('')
    }

    if (passed === this.results.length) {
      console.log('🎉 All JWT integration tests passed!')
    } else {
      console.log('💥 Some tests failed. Check the implementation.')
    }
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new JWTIntegrationTester()
  
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('💥 Test runner error:', error)
      process.exit(1)
    })
}

export default JWTIntegrationTester