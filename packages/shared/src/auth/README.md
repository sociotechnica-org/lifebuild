# LifeBuild Authentication

This directory contains shared authentication utilities for LifeBuild, implementing JWT-based authentication with WebSocket sync integration.

## Overview

The auth system provides:

- JWT token generation and verification
- Event metadata attribution with user IDs
- Offline support with grace periods
- Development mode fallbacks
- Token refresh and error handling

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Auth Service  │    │  Sync Server    │    │   Frontend      │
│  (auth-worker)  │    │   (worker)      │    │    (web)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. Login/Signup       │                       │
         │◄──────────────────────┼───────────────────────┤
         │                       │                       │
         │ 2. JWT Tokens         │                       │
         ├──────────────────────►│                       │
         │                       │                       │
         │                       │ 3. WebSocket + JWT   │
         │                       │◄──────────────────────┤
         │                       │                       │
         │                       │ 4. Events + Metadata │
         │                       ├──────────────────────►│
```

## Usage

### Frontend (React)

```typescript
import { useAuth } from './contexts/AuthContext.js'

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />
  }

  return <div>Welcome, {user?.email}</div>
}
```

### Worker (Sync Server)

```typescript
import { verifyJWT, isWithinGracePeriod } from '@lifebuild/shared/auth'

// JWT verification happens automatically in validatePayload
const payload = await verifyJWT(token, secret)
if (payload && isWithinGracePeriod(payload, gracePeriod)) {
  // Allow connection and inject userId into events
}
```

### Event Metadata

All events automatically include metadata:

```typescript
{
  type: 'v1.TaskCreated',
  id: 'task-123',
  title: 'My Task',
  metadata: {
    userId: 'user-456',     // From JWT
    timestamp: 1625097600000 // When event was created
  }
}
```

## Configuration

### Environment Variables

- `REQUIRE_AUTH` - Enable/disable authentication (default: false in dev, true in prod)
- `JWT_SECRET` - Secret for JWT signing/verification
- `GRACE_PERIOD_SECONDS` - How long to accept expired tokens (default: 86400 = 24h)
- `AUTH_SERVICE_URL` - URL of authentication service

### Development Mode

When `REQUIRE_AUTH=false` or `ENVIRONMENT=development`:

- Unauthenticated connections allowed
- Events attributed to default user ID
- Legacy insecure tokens accepted

## Testing

```bash
# Unit tests
pnpm test

# Integration tests (requires auth service)
pnpm test:jwt-integration

# E2E tests
pnpm test:e2e
```

## Security Features

- **JWT-based**: Stateless authentication
- **Short-lived tokens**: 15-minute access tokens
- **Token rotation**: Refresh tokens rotated on use
- **Grace period**: 24-hour grace for offline work
- **Rate limiting**: Protection against brute force
- **CORS protection**: Configurable origins

## Offline Support

The system handles offline scenarios:

1. **Token expires while offline**: Events stored locally
2. **Come back online**: Automatic token refresh
3. **Grace period**: Expired tokens accepted if < 24h old
4. **Sync resume**: Queued events sync with new token

## Error Handling

Auth errors are handled gracefully:

- Connection failures trigger token refresh
- Multiple retry attempts with backoff
- Fallback to development mode if configured
- User-friendly error messages

## Migration

The system supports gradual rollout:

1. Deploy with `REQUIRE_AUTH=false`
2. Test with early users
3. Enable `REQUIRE_AUTH=true` in production
4. All new events include user attribution
