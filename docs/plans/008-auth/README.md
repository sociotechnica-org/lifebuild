# JWT Authentication for Work Squared

JWT-based authentication implementation as specified in [ADR-005](../../adrs/005-jwt-authentication-with-durable-objects.md).

## Status

✅ **Milestone 1**: Auth Service Foundation - **COMPLETED**  
✅ **Milestone 2**: WebSocket JWT Validation - **COMPLETED**  
✅ **Milestone 3**: Frontend Auth UI - **COMPLETED**  
🔄 **Milestone 4**: Event Metadata Attribution - **FUTURE**

## Documents

- **[Implementation Plan](./implementation-plan.md)** - Complete technical plan and progress
- **[Milestone 1 Results](./milestone-1-auth-service-todo.md)** - Auth service foundation (completed)
- **[Milestone 2 Results](./milestone-2-jwt-websocket-validation.md)** - WebSocket JWT validation (completed)
- **[Milestone 3 Results](./milestone-3-frontend-auth-ui.md)** - Frontend auth UI (completed)

## Quick Summary

**What's working now:**

- ✅ Auth service with JWT generation (`packages/auth-worker`)
- ✅ WebSocket authentication validation (`packages/worker`)
- ✅ Complete frontend auth UI with login/signup pages (`packages/web`)
- ✅ Protected routing with redirect handling
- ✅ JWT tokens integrated with WebSocket connections
- ✅ Multi-tab authentication synchronization
- ✅ Environment-based auth control (`REQUIRE_AUTH=true/false`)
- ✅ Grace period for offline scenarios (24-hour window)
- ✅ Production deployment configuration
- ✅ Comprehensive E2E testing and Storybook documentation

**What's next:**

- Event metadata attribution (Milestone 4)

## Architecture

- **Separate auth service** - `packages/auth-worker` handles user management
- **JWT validation** - `packages/worker` validates tokens for WebSocket connections
- **Environment control** - Development mode allows bypass, production enforces auth
- **Offline support** - Grace period for expired tokens during offline work

## Testing

### Development Workflow

```bash
# Start complete development environment (includes auth service)
pnpm dev

# Run comprehensive test suite
pnpm lint-all    # Lint, format, typecheck
pnpm test        # Unit tests
CI=true pnpm test:e2e  # E2E tests

# Test auth service API directly
curl -X POST http://localhost:8787/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### Production Testing

```bash
# Test production auth enforcement
REQUIRE_AUTH=true pnpm dev
# Visit localhost:5173 - should redirect to login

# Test E2E with authentication required
REQUIRE_AUTH=true CI=true pnpm test:e2e
```

See [implementation-plan.md](./implementation-plan.md) for complete technical details.
