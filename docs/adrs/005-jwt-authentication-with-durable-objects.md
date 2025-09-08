# JWT Authentication with Durable Objects

## Status

Implemented

## Last Updated

2025-09-04

## Context

Work Squared needs to support multiple users collaborating on projects, documents, and AI workers. Currently, the system has:

- A basic user table and user creation events
- No authentication or authorization mechanism
- No way to identify which user is performing actions
- No session management for maintaining login state
- WebSocket connections that don't verify user identity

Without authentication:

- Any client can connect and modify any data
- No attribution for who created or modified content
- No foundation for future permission models
- Security vulnerabilities in production environments

## Decision

Implement JWT-based authentication using Cloudflare Workers and Durable Objects for user management:

### Architecture Overview

```
┌─────────────────┐
│   React App     │
│                 │
│ 1. Login Form   │
│ 2. Store JWT    │
│ 3. Send w/sync  │
└────────┬────────┘
         │
         │ WebSocket + JWT
         ▼
┌──────────────────────────────────────┐
│    Cloudflare Worker (Sync)          │
│                                      │
│  1. Extract JWT from syncPayload     │
│  2. Verify JWT signature             │
│  3. Extract userId from JWT          │
│  4. Accept/Reject connection         │
│                                      │
│  Instantiates and manages:           │
│  ┌─────────────────────────────────┐ │
│  │    LiveStore Sync DO            │ │
│  │    (global, handles all stores) │ │
│  │                                 │ │
│  │  - Event storage per store      │ │
│  │  - Client connections tracking  │ │
│  │  - clientId/sessionId per conn  │ │
│  └─────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### Authentication Flow

```
┌──────┐     ┌──────────┐     ┌─────────────────────────┐
│Client│     │Auth      │     │Sync Worker + DO         │
└──┬───┘     │Service   │     └────────┬────────────────┘
   │         └─────┬────┘              │
   │               │                   │
   │  Login        │                   │
   ├──────────────>│                   │
   │               │                   │
   │  JWT + User   │                   │
   │<──────────────│                   │
   │               │                   │
   │  Connect w/JWT + instanceId       │
   ├──────────────────────────────────>│
   │               │                   │
   │               │  Verify JWT       │
   │               │  (self-contained) │
   │               │                   │
   │               │  Manage DO        │
   │               │  connections      │
   │               │                   │
   │  Connection Accepted              │
   │<──────────────────────────────────│
   │               │                   │
```

### Auth Service Architecture

The Auth Service will be a separate Cloudflare Worker with its own Durable Objects:

```
┌─────────────────────────────────────────────┐
│            Auth Service Worker              │
│                                             │
│  Endpoints:                                 │
│  - POST /signup                             │
│  - POST /login                              │
│  - POST /refresh                            │
│  - POST /logout                             │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│          User Store Durable Object          │
│                                             │
│  Data:                                      │
│  - email → userId mapping                   │
│  - userId → {                               │
│      email,                                 │
│      hashedPassword,                        │
│      createdAt,                             │
│      metadata,                              │
│      instances: [{                          │
│        id: string,                          │
│        name: string,                        │
│        createdAt: Date,                     │
│        lastAccessedAt: Date                 │
│      }]                                     │
│    }                                        │
│                                             │
│  Password: Argon2id hashing                 │
└─────────────────────────────────────────────┘
```

**Signup Flow:**

1. Client sends email/password to `/signup`
2. Auth Service validates email uniqueness
3. Hashes password with Argon2id
4. Stores in User Store DO
5. Creates default instance with new id
6. Creates user event in LiveStore
7. Returns JWT + refresh token + instance info

**Login Flow:**

1. Client sends email/password to `/login`
2. Auth Service verifies credentials
3. Fetches user's instances list
4. Generates JWT with user info
5. Returns JWT + refresh token + instances

**Instance Management:**

- `GET /instances` - List all user's instances
- `POST /instances` - Create new instance
- `DELETE /instances/:id` - Remove instance from list
- `PATCH /instances/:id` - Rename or update instance

### Offline State and Token Expiry

To handle offline work and expired tokens, implement a **dual-token strategy**:

```
┌─────────────────────────────────────────────┐
│              Token Strategy                 │
│                                             │
│  Access Token (JWT):                        │
│  - Short-lived: 15 minutes                  │
│  - Used for API calls                       │
│  - Contains userId, email                   │
│                                             │
│  Refresh Token:                             │
│  - Long-lived: 7 days                       │
│  - Stored in httpOnly cookie                │
│  - Used to get new access tokens            │
│                                             │
│  Offline Grace Period:                      │
│  - Accept expired JWTs up to 24 hours old   │
│  - Queue events with expired tokens         │
│  - Validate on reconnection with refresh    │
└─────────────────────────────────────────────┘
```

**Offline Event Handling:**

```
Client Offline (2-3 hours)
    │
    ▼
Local events created with expired JWT
    │
    ▼
Reconnection attempt
    │
    ├─── JWT expired but < 24 hours old
    │         │
    │         ▼
    │    Use refresh token to get new JWT
    │         │
    │         ▼
    │    Replay queued events with new JWT
    │
    └─── JWT expired > 24 hours
              │
              ▼
         Force re-login
              │
              ▼
         Events marked as anonymous
         or rejected based on config
```

### Clarification: Auth Sessions vs Work Squared Instances

**Important distinction:**

- **Auth Sessions**: User login state, managed via JWTs (stateless)
  - No Durable Object needed
  - JWT contains user identity
  - Expires after inactivity (15 min access, 7 day refresh)
- **Work Squared Instances**: Separate LiveStore spaces (existing system)
  - Uses instance id in URL (e.g., `/project/abc123`)
  - Each instance has its own Durable Object
  - Stores all events for that instance
  - Never expires - events persist indefinitely
  - Now enhanced to track userId per connection
  - Users can have multiple instances

The existing LiveStore Sync Durable Objects remain unchanged except for adding userId tracking from the JWT. The Auth Service maintains the mapping of which instances belong to which user.

### Implementation Details

1. **JWT Structure**
   - Contains: userId, email, issuedAt, expiresAt
   - Signed with secret stored in Worker environment
   - Short-lived (15 minutes) for security
   - Paired with long-lived refresh token (7 days)

2. **No Session Durable Object Needed**
   - JWTs are self-contained and stateless
   - Session validity determined by JWT expiration
   - Refresh tokens stored in httpOnly cookies client-side
   - Token revocation handled by Auth Service if needed

3. **LiveStore Integration**

   ```
   User Context Flow:

   LiveStore ──syncPayload──> Worker ──userId──> Event
      │                         │                  │
      └── { authToken: jwt } ───┘                  │
                                                   ▼
                                            All events tagged
                                            with userId
   ```

4. **Event Attribution**
   - Modify all event handlers to include userId
   - Update event types to require user context
   - Store userId with every database mutation

## Consequences

### Positive

- **Security**: Only authenticated users can access the system
- **Attribution**: Every action is traceable to a specific user
- **Foundation**: Enables future permission models and access control
- **Scalability**: Durable Objects handle session state efficiently
- **Simplicity**: JWT validation is straightforward and well-understood
- **Stateless**: Workers remain stateless; only DOs maintain session state
- **Offline Support**: Grace period allows productive offline work without data loss
- **Separate Auth Service**: Clean separation of concerns, reusable for other projects
- **Multi-Instance**: Users can maintain multiple Work Squared instances for different contexts
- **Instance Isolation**: Each instance is completely separate, enabling different projects/teams

### Negative

- **Complexity**: Adds authentication layer to every request
- **Migration**: Existing events need userId retroactively added
- **Development**: Local development needs mock authentication
- **Two Services**: Requires deploying and maintaining separate auth service
- **Token Management**: Clients must handle dual-token refresh logic
- **Testing**: E2E tests need authentication setup
- **Offline Complexity**: Grace period logic adds edge cases to handle
- **Infrastructure**: Additional Cloudflare Workers and Durable Objects to manage

### Implementation Considerations

1. **Gradual Rollout**
   - Phase 1: Optional auth (development mode)
   - Phase 2: Required auth with default user
   - Phase 3: Full multi-user auth

2. **Backward Compatibility**
   - Support anonymous events during transition
   - Migrate existing data to include system userId

3. **External Auth Service**
   - Initially use simple email/password
   - Later support SSO providers (Google, GitHub)
   - Consider managed services (Clerk, Auth0) vs custom
