# Auth Implementation Plan

This directory contains the implementation plan for JWT-based authentication in Work Squared, as specified in [ADR-005](../../adrs/005-jwt-authentication-with-durable-objects.md).

## Overview

The auth implementation is broken down into 4 discrete milestones that can be implemented and tested independently:

### [Main Plan Document](./auth-implementation-plan.md)
Complete implementation plan with architecture, technical details, and migration strategy.

### Milestone TODO Lists

1. **[Milestone 1: Auth Service Foundation](./milestone-1-auth-service-todo.md)**
   - Separate Cloudflare Worker for authentication
   - User Store Durable Object
   - JWT generation and password hashing
   - Core auth endpoints (signup, login, refresh)

2. **[Milestone 2: JWT Integration with WebSocket Sync](./milestone-2-jwt-integration-todo.md)**
   - JWT verification in sync server
   - Event attribution with userId
   - Offline grace period support
   - Multi-tab auth state synchronization

3. **[Milestone 3: Frontend Auth UI and Flow](./milestone-3-frontend-auth-todo.md)**
   - Login and signup pages
   - Auth context and protected routes
   - Automatic token refresh
   - User info display in header

4. **[Milestone 4: Multi-Instance User Management](./milestone-4-multi-instance-todo.md)**
   - Multiple instances per user
   - Instance switching UI
   - Instance management endpoints
   - Data isolation between instances

## Implementation Order

The milestones should be implemented in sequence as each builds on the previous:

1. Start with Auth Service Foundation to establish core authentication
2. Integrate JWT into existing sync system for security
3. Add frontend UI for user-facing auth experience  
4. Enable multi-instance support for advanced usage

## Key Architecture Decisions

- **JWT-based**: Stateless authentication with self-contained tokens
- **Dual-token**: Short access tokens (15min) + long refresh tokens (7d)
- **Separate Service**: Auth runs as independent Cloudflare Worker
- **Offline Support**: 24-hour grace period for expired tokens
- **Multi-Instance**: Users can maintain multiple isolated workspaces

## Getting Started

1. Review the [main implementation plan](./auth-implementation-plan.md)
2. Start with [Milestone 1 TODO](./milestone-1-auth-service-todo.md)
3. Use the TODO lists to track progress
4. Test thoroughly before moving to next milestone

## Testing Strategy

Each milestone includes:
- Unit tests for core logic
- Integration tests for flows
- E2E tests for user journeys
- Security verification steps
- Performance benchmarks

## Security Considerations

- Argon2id for password hashing
- httpOnly cookies for refresh tokens
- Short-lived access tokens
- CORS configuration
- Rate limiting on auth endpoints

## Future Enhancements

After core auth is complete:
- SSO providers (Google, GitHub)
- Email verification
- Two-factor authentication
- Team/organization support
- Fine-grained permissions