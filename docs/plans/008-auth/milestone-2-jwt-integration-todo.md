# Milestone 2: JWT Integration with WebSocket Sync - TODO

## Overview
Integrate JWT authentication into the existing WebSocket sync server to secure all real-time connections and attribute events to users.

## Prerequisites
- [ ] Milestone 1 complete (Auth Service deployed)
- [ ] Understanding of current WebSocket sync implementation
- [ ] Access to both web and worker packages

## Implementation Tasks

### 1. Update Sync Payload Structure
- [ ] Modify sync payload type to include auth token:
  ```typescript
  interface SyncPayload {
    instanceId: string
    authToken?: string
    // existing fields...
  }
  ```
- [ ] Update `packages/shared/src/types.ts` with new structure
- [ ] Ensure backward compatibility for development mode

### 2. Worker JWT Verification
- [ ] Add JWT verification utility to worker package
- [ ] Import JWT secret from environment
- [ ] Modify WebSocket upgrade handler to:
  - [ ] Extract JWT from sync payload
  - [ ] Verify JWT signature
  - [ ] Check token expiration
  - [ ] Extract userId from claims
- [ ] Add grace period logic (accept tokens up to 24h old)
- [ ] Pass userId to Durable Object context

### 3. Connection Authorization
- [ ] Update connection acceptance logic:
  - [ ] Valid token → Accept connection
  - [ ] Expired token within grace period → Accept with warning
  - [ ] Invalid/missing token → Reject connection (unless dev mode)
- [ ] Add connection metadata to track userId
- [ ] Log authentication attempts for debugging

### 4. Event Attribution
- [ ] Update event structure to include metadata:
  ```typescript
  interface EventWithMetadata<T> {
    ...event: T
    metadata: {
      userId: string
      timestamp: number
      connectionId: string
    }
  }
  ```
- [ ] Modify event emission to inject userId
- [ ] Update all event handlers to preserve metadata
- [ ] Ensure metadata flows through LiveStore

### 5. Update Client Sync Utils
- [ ] Modify `packages/web/src/utils/sync.ts`:
  - [ ] Get auth token from storage
  - [ ] Include token in sync payload
  - [ ] Handle auth errors from server
- [ ] Add token refresh on connection failure
- [ ] Implement reconnection with new token

### 6. SharedWorker Auth State
- [ ] Update `packages/web/src/workers/shared-worker.ts`:
  - [ ] Share auth state across tabs
  - [ ] Coordinate token refresh
  - [ ] Handle logout across all tabs
  - [ ] Sync auth failures
- [ ] Test multi-tab scenarios

### 7. Offline Support Implementation
- [ ] Create offline event queue in client
- [ ] Tag events with local timestamp
- [ ] On reconnection:
  - [ ] Check if token expired during offline
  - [ ] Refresh token if needed
  - [ ] Replay queued events with new token
- [ ] Handle grace period expiration

### 8. Development Mode Support
- [ ] Add REQUIRE_AUTH environment variable
- [ ] Allow anonymous connections in dev mode
- [ ] Use default userId for dev events
- [ ] Clear separation between dev/prod behavior

### 9. Error Handling
- [ ] Define auth-specific error codes:
  - [ ] `AUTH_REQUIRED` - No token provided
  - [ ] `TOKEN_INVALID` - Bad signature or format
  - [ ] `TOKEN_EXPIRED` - Beyond grace period
  - [ ] `USER_NOT_FOUND` - Valid token, deleted user
- [ ] Propagate errors to client appropriately
- [ ] Add retry logic with backoff

### 10. Testing

#### Unit Tests
- [ ] JWT verification logic
- [ ] Grace period calculations
- [ ] Event metadata injection
- [ ] Connection authorization

#### Integration Tests
- [ ] Valid token → Successful connection
- [ ] Expired token within grace → Warning but connected
- [ ] Invalid token → Connection rejected
- [ ] Token refresh during active connection
- [ ] Multi-tab auth synchronization

#### E2E Tests
- [ ] Login → Use app → Events have userId
- [ ] Work offline → Come back → Events sync
- [ ] Token expires → Auto refresh → Continue working
- [ ] Logout → All connections terminated

### 11. Migration Considerations
- [ ] Support both authenticated and anonymous events during transition
- [ ] Add migration script to tag historical events
- [ ] Plan rollback strategy if issues arise
- [ ] Document breaking changes

### 12. Monitoring and Logging
- [ ] Log authentication attempts
- [ ] Track grace period usage
- [ ] Monitor connection failures due to auth
- [ ] Add metrics for token refresh rate

## Verification Checklist

### Security Verification
- [ ] Only valid JWTs accepted (production)
- [ ] UserId correctly extracted from token
- [ ] All events tagged with correct userId
- [ ] No token leakage in logs
- [ ] Grace period working as expected

### Functionality Testing
- [ ] Existing features work with auth
- [ ] Multi-tab sync still works
- [ ] Offline/online transitions smooth
- [ ] Performance not degraded
- [ ] Dev mode works without auth

### WebSocket Connection Tests
```javascript
// Test authenticated connection
const ws = new WebSocket('ws://localhost:8787/sync')
ws.send(JSON.stringify({
  type: 'init',
  instanceId: 'test-123',
  authToken: validJWT
}))

// Should receive connection accepted

// Test with expired token
ws.send(JSON.stringify({
  type: 'init', 
  instanceId: 'test-123',
  authToken: expiredJWT
}))

// Should work if < 24h old
```

## Definition of Done
- [ ] JWT verification working in Worker
- [ ] All events include userId metadata
- [ ] Offline support with grace period
- [ ] Multi-tab auth state synchronized
- [ ] All tests passing
- [ ] No regression in existing features
- [ ] Performance benchmarks acceptable

## Rollback Plan
If issues arise:
1. Toggle REQUIRE_AUTH to false
2. Deploy worker without auth checks
3. Fix issues in staging environment
4. Re-enable when stable

## Next Steps
Once complete, proceed to Milestone 3: Frontend Auth UI and Flow