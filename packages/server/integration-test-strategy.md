# Agentic Loop Integration Test Strategy

## Challenge

Integration tests for the agentic loop are complex because they involve round-trips with external services (Braintrust LLM API), making them difficult to isolate and run reliably in CI environments.

## Recommended Testing Strategy

### 1. Unit Tests (Current Foundation)

- **Test individual components**: AgenticLoop, ToolExecutor, ConversationHistory
- **Mock external dependencies**: LLMProvider interface with BraintrustProvider mocked
- **Test error handling**: Retry logic, timeout handling, resource cleanup
- **Test resource management**: ResourceMonitor behaviors
- **Coverage**: ~90% of agentic loop logic without external API calls

### 2. Contract Tests for LLM Provider

```typescript
// Test that our LLMProvider interface contract works correctly
describe('BraintrustProvider Contract', () => {
  it('should handle successful LLM responses', async () => {
    // Mock successful Braintrust API response
    const mockProvider = new MockBraintrustProvider({
      response: { message: 'Hello', toolCalls: [] },
    })

    const result = await mockProvider.call(messages, context)
    expect(result).toMatchExpectedFormat()
  })

  it('should handle API errors correctly', async () => {
    // Test various error scenarios
    const mockProvider = new MockBraintrustProvider({
      error: new Error('Rate limit exceeded'),
    })

    await expect(mockProvider.call(messages, context)).rejects.toThrow()
  })
})
```

### 3. Integration Test Tiers

#### Tier 1: Local Development Tests

- **Purpose**: Developer confidence during development
- **Environment**: Local machine with real API calls
- **Frequency**: On-demand via `npm run test:integration:local`
- **Requirements**: Developer provides their own Braintrust API keys
- **Timeout**: 60 seconds per test
- **Example**:

```bash
# Run with real API (developer responsibility)
BRAINTRUST_API_KEY=your_key npm run test:integration:local
```

#### Tier 2: Staging Environment Tests

- **Purpose**: Pre-production validation
- **Environment**: Staging server with real API calls
- **Frequency**: Before releases, triggered manually
- **Requirements**: Shared staging API keys (budget-controlled)
- **Timeout**: 120 seconds per test
- **Scope**: Critical user journeys only (2-3 key scenarios)

#### Tier 3: Production Smoke Tests

- **Purpose**: Post-deployment health checks
- **Environment**: Production with real API
- **Frequency**: After deployments
- **Requirements**: Production API keys (minimal usage)
- **Timeout**: 30 seconds per test
- **Scope**: Simple "is it working" tests

### 4. Test Scenarios by Priority

#### High Priority (Must Test)

1. **Basic conversation flow**: User message → LLM response → tool calls → final response
2. **Error recovery**: API timeout → retry → eventual success
3. **Resource limits**: Max iterations reached gracefully
4. **Tool execution**: Simple tools (read/write operations) work correctly

#### Medium Priority (Should Test in Staging)

1. **Complex multi-step workflows**: Multiple tool calls across iterations
2. **Concurrent conversations**: Multiple users simultaneously
3. **Large context handling**: Long conversation histories
4. **Edge cases**: Malformed API responses, network issues

#### Low Priority (Monitor in Production)

1. **Performance under load**: Response times, resource usage
2. **Long-running conversations**: Memory usage over time
3. **API quota management**: Graceful degradation when limits approached

### 5. Mock Strategies for CI

#### Deterministic Mock Provider

```typescript
class DeterministicMockLLMProvider implements LLMProvider {
  private scenarios: Map<string, LLMResponse> = new Map()

  // Pre-define responses for specific inputs
  addScenario(inputHash: string, response: LLMResponse) {
    this.scenarios.set(inputHash, response)
  }

  async call(messages: LLMMessage[]): Promise<LLMResponse> {
    const hash = this.hashMessages(messages)
    const response = this.scenarios.get(hash)
    if (!response) {
      throw new Error(`No mock response defined for input: ${hash}`)
    }
    return response
  }
}
```

#### Record/Replay Testing

- **Record**: Capture real API interactions during development
- **Replay**: Use recorded responses in CI for consistent testing
- **Tools**: Consider libraries like Polly.js or VCR-style recording

### 6. Test Infrastructure

#### Test Database Setup

```typescript
// Use in-memory SQLite for fast test isolation
beforeEach(async () => {
  const testStore = createTestStore() // In-memory LiveStore
  const mockLLMProvider = new DeterministicMockLLMProvider()

  // Set up test scenario
  mockLLMProvider.addScenario('user_greeting', {
    message: 'Hello! How can I help you?',
    toolCalls: [],
  })

  agenticLoop = new AgenticLoop(testStore, mockLLMProvider)
})
```

#### Environment Configuration

```bash
# .env.test
NODE_ENV=test
LLM_PROVIDER=mock
LLM_MAX_ITERATIONS=3  # Lower for faster tests
STORE_DATA_PATH=:memory:
```

### 7. Monitoring and Observability

#### Test Metrics to Track

- **Test execution time**: Detect performance regressions
- **Mock vs real API accuracy**: Ensure mocks stay realistic
- **Integration test flakiness**: Track failure rates
- **Resource usage during tests**: Memory leaks, cleanup issues

#### Alerting

- **Staging test failures**: Immediate Slack notification
- **Production smoke test failures**: Page on-call engineer
- **High integration test flakiness**: Weekly engineering team alert

### 8. Implementation Plan

#### Phase 1: Foundation (Week 1)

1. Implement `DeterministicMockLLMProvider`
2. Create basic unit test coverage for agentic loop components
3. Set up test database isolation
4. Add `npm run test:integration:local` script

#### Phase 2: Core Integration (Week 2)

1. Implement 3 high-priority integration test scenarios
2. Add staging environment test pipeline
3. Create record/replay infrastructure
4. Document local testing setup for developers

#### Phase 3: Production Readiness (Week 3)

1. Add production smoke tests
2. Set up monitoring and alerting
3. Create runbook for test maintenance
4. Train team on testing strategy

### 9. Cost Management

#### API Usage Budgets

- **Development**: Unlimited (developer's own keys)
- **Staging**: $50/month budget (alerts at $40)
- **Production Smoke Tests**: $20/month budget (minimal calls)

#### Test Optimization

- **Cache successful responses**: Reuse for similar test scenarios
- **Minimize API calls**: Only test critical paths with real API
- **Smart test selection**: Only run integration tests when agentic loop code changes

### 10. Alternative Approaches Considered

#### Rejected: Full Mocking in CI

- **Pros**: Fast, reliable, no external dependencies
- **Cons**: Mocks drift from reality, miss integration issues
- **Decision**: Use for unit tests only

#### Rejected: Always Real API in CI

- **Pros**: Catches all integration issues
- **Cons**: Slow, flaky, expensive, difficult to parallelize
- **Decision**: Use for staging/production only

#### Rejected: Local API Server

- **Pros**: Full control, no external costs
- **Cons**: Significant maintenance overhead, doesn't test real API behavior
- **Decision**: Not worth the complexity

## Conclusion

This tiered approach balances test confidence with practical constraints:

- **Unit tests** provide fast feedback and high coverage
- **Contract tests** ensure our interfaces work correctly
- **Integration tests** are used judiciously where most valuable
- **Production monitoring** catches issues that tests miss

The key is having multiple layers of testing confidence while keeping CI fast and reliable.
