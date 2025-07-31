# JWT Authentication for Work Squared

JWT-based authentication implementation as specified in [ADR-005](../../adrs/005-jwt-authentication-with-durable-objects.md).

## Status

✅ **Milestone 1**: Auth Service Foundation - **COMPLETED**  
✅ **Milestone 2**: WebSocket JWT Validation - **COMPLETED**  
🔄 **Milestone 3**: Frontend Auth UI - **NEXT**  
🔄 **Milestone 4**: Event Metadata Attribution - **FUTURE**

## Documents

- **[Implementation Plan](./implementation-plan.md)** - Complete technical plan and progress
- **[Milestone 1 Results](./milestone-1-auth-service-todo.md)** - Auth service foundation (completed)
- **[Milestone 2 Results](./milestone-2-jwt-websocket-validation.md)** - WebSocket JWT validation (completed)

## Quick Summary

**What's working now:**
- Auth service with JWT generation (`packages/auth-worker`)
- WebSocket authentication validation (`packages/worker`)
- Environment-based auth control (`REQUIRE_AUTH=true/false`)
- Grace period for offline scenarios (24-hour window)

**What's next:**
- Frontend login/signup UI
- Replace dev tokens with real JWTs
- Event metadata attribution

## Architecture

- **Separate auth service** - `packages/auth-worker` handles user management
- **JWT validation** - `packages/worker` validates tokens for WebSocket connections
- **Environment control** - Development mode allows bypass, production enforces auth
- **Offline support** - Grace period for expired tokens during offline work

## Testing

```bash
# Test auth service
curl -X POST http://localhost:8788/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Test with REQUIRE_AUTH=true to see WebSocket rejection
# (Edit packages/worker/.dev.vars, restart pnpm dev, try to use app)
```

See [implementation-plan.md](./implementation-plan.md) for complete technical details.
