# JWT Authentication Implementation Plan

## Overview

This plan implements JWT-based authentication for Work Squared using Cloudflare Workers and Durable Objects, as specified in [ADR-005](../../adrs/005-jwt-authentication-with-durable-objects.md).

**Goal**: Enable secure multi-user collaboration with proper authentication, user management, and instance-based access control.

## Key Architecture Decisions

- **JWT-based**: Stateless authentication with self-contained tokens
- **Dual-token strategy**: Short-lived access tokens (15 min) + long-lived refresh tokens (7 days)
- **Auth Service**: Separate Cloudflare Worker with User Store Durable Object
- **Instance Management**: Users can have multiple Work Squared instances
- **Offline Support**: Grace period for expired tokens during offline work

## Implementation Milestones

### Milestone 1: Auth Service Foundation

Create the core authentication service as a separate Cloudflare Worker.

**Tasks:**

1. Create new Auth Service Worker in `packages/auth-worker`
2. Implement User Store Durable Object with email → user mapping
3. Add password hashing with Argon2id
4. Create signup endpoint with email validation
5. Create login endpoint with credential verification
6. Implement JWT generation and signing
7. Add refresh token support

**Key Files:**
- `packages/auth-worker/src/index.ts` - Worker entry point
- `packages/auth-worker/src/durable-objects/UserStore.ts` - User management DO
- `packages/auth-worker/src/utils/jwt.ts` - JWT utilities
- `packages/auth-worker/src/utils/crypto.ts` - Password hashing

**Success Criteria:**
- Can create new user accounts via `/signup`
- Can login with email/password via `/login`
- Receive JWT + refresh token on successful auth
- Passwords properly hashed with Argon2id
- JWTs contain userId, email, exp claims

**Testing:**
```bash
# Test signup
curl -X POST http://localhost:8788/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "secure123"}'

# Test login
curl -X POST http://localhost:8788/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "secure123"}'
```

### Milestone 2: JWT Integration with WebSocket Sync

Integrate JWT authentication into the existing sync server.

**Tasks:**

1. Update WebSocket connection to accept JWT in syncPayload
2. Extract and verify JWT in Cloudflare Worker
3. Pass userId to LiveStore Sync Durable Object
4. Update all events to include userId from JWT
5. Add connection rejection for invalid/expired tokens
6. Implement offline grace period (accept tokens up to 24h old)
7. Update SharedWorker to handle auth state

**Key Changes:**
- `packages/worker/functions/_worker.ts` - JWT verification
- `packages/web/src/utils/sync.ts` - Include JWT in sync payload
- `packages/shared/src/events.ts` - Add userId to event metadata
- `packages/web/src/workers/shared-worker.ts` - Auth state management

**Success Criteria:**
- WebSocket connections require valid JWT
- All events tagged with userId from JWT
- Expired tokens rejected (unless within grace period)
- Multiple tabs share auth state via SharedWorker
- Offline work continues with expired tokens < 24h old

**Verification:**
```typescript
// Browser console
await store.mutate([{ type: 'task.create', title: 'Test' }])
// Event should include userId metadata

// Try with expired token
localStorage.setItem('authToken', expiredJWT)
// Should still work if < 24h old
```

### Milestone 3: Frontend Auth UI and Flow

Build the authentication UI and integrate auth flow into the React app.

**Tasks:**

1. Create login/signup pages with forms
2. Implement auth context provider
3. Add protected routes requiring authentication
4. Store JWT + refresh token securely (httpOnly cookies)
5. Implement automatic token refresh
6. Add logout functionality
7. Handle auth errors gracefully
8. Add user info display in header

**Key Components:**
- `packages/web/src/pages/Login.tsx` - Login page
- `packages/web/src/pages/Signup.tsx` - Signup page  
- `packages/web/src/contexts/AuthContext.tsx` - Auth state management
- `packages/web/src/components/ProtectedRoute.tsx` - Route protection
- `packages/web/src/utils/auth.ts` - Token management utilities

**Success Criteria:**
- Clean login/signup UI matching existing design
- Automatic redirect to login for unauthenticated users
- Token refresh happens transparently
- User email displayed in header when logged in
- Logout clears tokens and redirects to login

**User Flow:**
1. Visit app → Redirected to login
2. Sign up → Auto-login → Redirect to app
3. Token expires → Auto-refresh → Continue working
4. Refresh fails → Redirect to login
5. Work offline → Sync when back online

### Milestone 4: Multi-Instance User Management  

Enable users to create and manage multiple Work Squared instances.

**Tasks:**

1. Add instance management endpoints to Auth Service
2. Create instance during user signup
3. Add instance selector UI
4. Update routing to include instance context
5. Implement instance switching
6. Add instance creation/deletion UI
7. Update sync to use selected instance

**Key Features:**
- `GET /instances` - List user's instances
- `POST /instances` - Create new instance
- `DELETE /instances/:id` - Remove instance
- `PATCH /instances/:id` - Rename instance

**UI Components:**
- Instance selector dropdown in header
- Instance management modal
- New instance creation dialog

**Success Criteria:**
- Users start with one default instance
- Can create additional instances
- Can switch between instances seamlessly
- Each instance has isolated data
- Instance list persists in User Store DO

## Technical Implementation Details

### JWT Structure

```json
{
  "userId": "user_abc123",
  "email": "user@example.com", 
  "iat": 1710000000,
  "exp": 1710000900,
  "iss": "work-squared-auth"
}
```

### Token Storage Strategy

- **Access Token**: localStorage (for easy access)
- **Refresh Token**: httpOnly cookie (for security)
- **Instance Selection**: localStorage

### Event Attribution

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

### Development Mode

Support optional auth during development:

```typescript
const requireAuth = process.env.NODE_ENV === 'production' || 
                   process.env.REQUIRE_AUTH === 'true'
```

## Deployment Considerations

### Auth Service Deployment

```toml
# wrangler.toml for auth-worker
name = "work-squared-auth"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[durable_objects.bindings]]
name = "USER_STORE"
class_name = "UserStore"

[vars]
JWT_SECRET = "your-secret-here"
```

### Environment Variables

- `JWT_SECRET` - For signing JWTs (Auth Service)
- `AUTH_SERVICE_URL` - Auth service endpoint (Web + Worker)
- `REQUIRE_AUTH` - Enable/disable auth requirement

## Migration Strategy

### Phase 1: Development Mode (Optional Auth)
- Deploy auth service
- Add auth UI but make it optional
- Test with early users

### Phase 2: Required Auth  
- Enable auth requirement
- Migrate existing data with system user
- All new events require auth

### Phase 3: Full Multi-User
- Enable instance management
- Add collaboration features
- Implement permissions (future)

## Testing Approach

### Unit Tests
- JWT generation/verification
- Password hashing
- Token refresh logic

### Integration Tests  
- Full auth flow (signup → login → use app)
- Token expiry and refresh
- Multi-tab auth state sync
- Offline/online transitions

### E2E Tests
- Login flow
- Protected routes
- Instance switching
- Logout behavior

## Security Considerations

- Argon2id for password hashing
- Short-lived access tokens (15 min)
- Secure httpOnly cookies for refresh tokens
- CORS configuration for Auth Service
- Rate limiting on auth endpoints
- No sensitive data in JWTs

## Success Metrics

- ✅ Users can sign up and log in
- ✅ All events attributed to correct user
- ✅ Tokens refresh automatically
- ✅ Offline work with grace period
- ✅ Multiple instances per user
- ✅ No regression in existing features

## Future Enhancements

After core auth is working:

1. SSO providers (Google, GitHub)
2. Email verification
3. Password reset flow
4. Two-factor authentication
5. Team/organization support
6. Fine-grained permissions
7. Audit logs

## Implementation Order

1. **Auth Service Foundation** - Core authentication functionality
2. **JWT Integration** - Secure the existing system
3. **Frontend UI** - User-facing auth experience
4. **Multi-Instance** - Advanced user management

Each milestone builds on the previous. Complete and test thoroughly before proceeding.