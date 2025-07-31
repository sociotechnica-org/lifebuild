# JWT Authentication Implementation Plan

## Overview

JWT-based authentication for Work Squared using Cloudflare Workers, implemented in focused milestones.

## Implementation Status

✅ **Milestone 1**: Auth Service Foundation - **COMPLETED**  
✅ **Milestone 2**: WebSocket JWT Validation - **COMPLETED**  
🔄 **Milestone 3**: Frontend Auth UI - **NEXT**  
🔄 **Milestone 4**: Event Metadata Attribution - **FUTURE**

## Architecture

- **JWT-based**: Stateless authentication with self-contained tokens
- **Dual-token**: Short access tokens (15min) + long refresh tokens (7d)
- **Separate Service**: Auth runs as independent Cloudflare Worker
- **Environment Control**: `REQUIRE_AUTH=true/false` for dev/prod
- **Offline Support**: 24-hour grace period for expired tokens

## Milestone 1: Auth Service Foundation ✅ COMPLETED

### What was built:

- Separate Cloudflare Worker at `packages/auth-worker`
- User Store Durable Object with email → user mapping
- JWT generation and signing with proper expiration
- Core endpoints: `/signup`, `/login`, `/refresh`, `/logout`
- Password hashing with PBKDF2-SHA256

### Testing:

```bash
# Test signup
curl -X POST http://localhost:8788/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123!"}'

# Test login
curl -X POST http://localhost:8788/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123!"}'
```

## Milestone 2: WebSocket JWT Validation ✅ COMPLETED

### What was built:

- JWT verification in sync worker's `validatePayload` function
- Environment flag support (`REQUIRE_AUTH=true/false`)
- Server bypass mechanism for internal connections (`SERVER_BYPASS_TOKEN`)
- Grace period handling for expired tokens (24-hour configurable window)
- Connection rejection for invalid/missing tokens

### Key files:

- `packages/worker/functions/_worker.ts` - JWT validation implementation
- `packages/shared/src/auth/config.ts` - Added SERVER_BYPASS_TOKEN
- `packages/web/src/hooks/useSyncPayload.ts` - JWT integration ready

### Authentication flow:

1. Client sends sync payload: `{ instanceId, authToken }`
2. Worker validates JWT using shared JWT_SECRET
3. Invalid tokens → WebSocket connection rejected
4. Valid tokens → Connection accepted, events sync normally

## Milestone 3: Frontend Auth UI 🔄 NEXT

### Planned tasks:

- Login/signup pages with forms
- Auth context provider for token management
- Protected routes requiring authentication
- Automatic token refresh
- User info display in header
- Integration with real JWTs (replace dev tokens)

### Key components to build:

- `packages/web/src/pages/Login.tsx`
- `packages/web/src/pages/Signup.tsx`
- `packages/web/src/contexts/AuthContext.tsx` (expand existing)
- `packages/web/src/components/ProtectedRoute.tsx`

## Milestone 4: Event Metadata Attribution 🔄 FUTURE

### Planned tasks:

- Add metadata to all LiveStore events with userId attribution
- Event structure: `{ type: 'task.create', args: {...}, metadata: { userId, timestamp } }`
- Multi-tab auth state synchronization via SharedWorker
- Migration strategy for existing events

### Event attribution example:

```typescript
// Before
{ type: 'task.create', title: 'New Task' }

// After
{
  type: 'task.create',
  title: 'New Task',
  metadata: {
    userId: 'user_abc123',
    timestamp: Date.now()
  }
}
```

## Environment Configuration

### Development (.dev.vars):

```bash
ENVIRONMENT=development
REQUIRE_AUTH=false  # Allows dev tokens
JWT_SECRET=dev-jwt-secret-change-me-in-production
GRACE_PERIOD_SECONDS=86400
SERVER_BYPASS_TOKEN=dev-server-bypass-token-change-me
```

### Production:

```bash
ENVIRONMENT=production
REQUIRE_AUTH=true   # Enforces JWT validation
JWT_SECRET=<secure-production-secret>
GRACE_PERIOD_SECONDS=86400
SERVER_BYPASS_TOKEN=<secure-production-token>
```

## JWT Structure

```json
{
  "userId": "user_abc123",
  "email": "user@example.com",
  "iat": 1710000000,
  "exp": 1710000900,
  "iss": "work-squared-auth"
}
```

## Security Features

- Password hashing with PBKDF2-SHA256
- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days)
- Server bypass for internal connections
- Environment-based auth enforcement
- Grace period for offline scenarios
- Rate limiting on auth endpoints

## Testing Strategy

### Current testing:

- Auth service unit tests ✅
- JWT verification unit tests ✅
- Integration test for auth flow ✅

### Planned testing:

- E2E tests for login flow
- Token refresh testing
- Multi-tab synchronization tests
- Offline/online transition tests

## Migration Strategy

1. **Phase 1**: Optional auth (current) - `REQUIRE_AUTH=false`
2. **Phase 2**: Required auth - `REQUIRE_AUTH=true` with frontend UI
3. **Phase 3**: Full attribution - All events include metadata

## Future Enhancements

- SSO providers (Google, GitHub)
- Email verification
- Password reset flow
- Two-factor authentication
- Team/organization support
- Fine-grained permissions
