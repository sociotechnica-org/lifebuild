# Work Squared Auth Service

JWT-based authentication service for Work Squared, built as a Cloudflare Worker with Durable Objects.

## Features

- **User Management**: Secure user registration and authentication
- **JWT Tokens**: Stateless authentication with access and refresh tokens
- **Password Security**: PBKDF2-SHA256 password hashing
- **Rate Limiting**: Built-in protection against brute force attacks
- **Durable Objects**: Persistent user data storage
- **CORS Support**: Cross-origin request handling

## API Endpoints

### POST /signup

Create a new user account.

```bash
curl -X POST http://localhost:8788/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123!"}'
```

### POST /login

Login with email and password.

```bash
curl -X POST http://localhost:8788/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123!"}'
```

### POST /refresh

Refresh access token using refresh token.

```bash
curl -X POST http://localhost:8788/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "your-refresh-token"}'
```

### POST /logout

Logout user (invalidate tokens).

```bash
curl -X POST http://localhost:8788/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "your-refresh-token"}'
```

### Authenticated Workspace APIs

All workspace endpoints require an `Authorization: Bearer <accessToken>` header. Responses include the updated `instances` array and a `defaultInstanceId` so clients can persist the server-selected workspace.

#### GET /workspaces

List all workspaces for the current user.

```bash
curl http://localhost:8788/workspaces \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### POST /workspaces

Create a workspace (names are optional; defaults are auto-generated and deduplicated).

```bash
curl -X POST http://localhost:8788/workspaces \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Team Space"}'
```

#### POST /workspaces/:id/rename

Rename a workspace. Names are trimmed and must be unique per user.

```bash
curl -X POST http://localhost:8788/workspaces/$WORKSPACE_ID/rename \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Client Hub"}'
```

#### POST /workspaces/:id/set-default

Set the default workspace; all others are cleared.

```bash
curl -X POST http://localhost:8788/workspaces/$WORKSPACE_ID/set-default \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### POST /workspaces/:id/access

Touch a workspace to refresh its `lastAccessedAt` timestamp (used when switching in the UI).

```bash
curl -X POST http://localhost:8788/workspaces/$WORKSPACE_ID/access \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### DELETE /workspaces/:id

Delete a non-default workspace. Attempting to delete the default or last workspace returns `400`.

```bash
curl -X DELETE http://localhost:8788/workspaces/$WORKSPACE_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Workspace Claims in JWTs

Access tokens now embed a `workspaces` claim so the sync worker can validate ownership without making per-connection API calls. Each token contains:

- `workspaces`: Array of `{ id, role }` entries for every workspace the user belongs to
- `defaultInstanceId`: The server-selected default workspace
- `workspaceClaimsVersion`: Monotonic counter that increments whenever membership or roles change
- `workspaceClaimsIssuedAt`: Timestamp indicating when claims were generated

When a workspace membership update occurs (invite acceptance, role change, removal, etc.), the Auth Worker increments the user's `workspaceClaimsVersion` and writes it to the `WORKSPACE_CLAIMS_VERSION` KV namespace. The sync worker compares the version embedded in incoming JWTs with the authoritative value in KV and rejects stale tokens, forcing the client to refresh credentials.

### GET /health

Health check endpoint.

```bash
curl http://localhost:8788/health
```

## Development

### Prerequisites

- Node.js 18+
- pnpm
- Cloudflare account with Workers enabled

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .dev.vars.example .dev.vars

# Start development server (local Miniflare with persisted DO/KV state)
pnpm dev
```

The service will be available at `http://localhost:8788`.

### Local KV & Durable Object persistence

`pnpm dev` runs Wrangler/Miniflare locally and uses `--persist-to .wrangler/state/auth`, so both Durable Objects and KV survive restarts. Remove that directory if you need a clean slate.

### Workspace Claims KV Namespace

Workspace membership versions are stored in the `WORKSPACE_CLAIMS_VERSION` KV namespace so other services can quickly invalidate stale tokens.

- **Local development:** nothing extra to do—Miniflare provides a local KV store automatically and persists it under `.wrangler/state/auth`.
- **Remote/production:** create real namespaces and copy the IDs into `packages/auth-worker/wrangler.toml`:

```bash
wrangler kv:namespace create WORKSPACE_CLAIMS_VERSION
wrangler kv:namespace create WORKSPACE_CLAIMS_VERSION --preview
```

This ensures staging/production deployments share the same binding names as local dev.

### Testing

```bash
# Unit tests
pnpm test                    # Run unit tests once
pnpm test:watch              # Run unit tests in watch mode

# Integration tests
pnpm test:integration        # Run end-to-end auth service tests

# Quality checks
pnpm lint-all               # Run all quality checks
pnpm typecheck              # TypeScript type checking
```

#### Integration Testing

The auth service includes comprehensive integration tests that validate all Milestone 1 features:

**Features Tested:**

- ✅ Service health check
- ✅ User signup with validation
- ✅ Email uniqueness enforcement
- ✅ User login and authentication
- ✅ Invalid credentials rejection
- ✅ JWT token refresh with rotation
- ✅ User logout
- ✅ Password strength validation
- ✅ Email format validation
- ✅ Invalid token rejection
- ✅ CORS headers configuration
- ✅ Response time performance

**Running Integration Tests:**

```bash
# Make sure auth service is running
pnpm dev

# Run integration tests (in another terminal)
pnpm test:integration

# Or test against a different URL
AUTH_SERVICE_URL=https://your-auth-service.com pnpm test:integration
```

### Deployment

```bash
# Deploy to Cloudflare
pnpm deploy
```

## Security Features

### Password Requirements

- Minimum 8 characters
- Maximum 128 characters
- Must contain at least 3 of: uppercase, lowercase, numbers, special characters
- Rejects common weak passwords

### Token Security

- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Tokens are signed with HMAC-SHA256
- Refresh token rotation on each use

### Rate Limiting

- 10 requests per minute per IP address
- Prevents brute force attacks

## Architecture

### Components

- **Worker**: Main HTTP handler and routing
- **UserStore DO**: Durable Object for user data persistence
- **JWT Utils**: Token creation and verification
- **Crypto Utils**: Password hashing and validation
- **Auth Handlers**: Endpoint implementations

### Data Storage

User data is stored in Durable Objects with the following structure:

- `user:{email}` - User lookup by email
- `user:id:{userId}` - User lookup by ID

Auth success responses now include the user’s instances and the server-selected default workspace:

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "instances": [
      {
        "id": "workspace-id",
        "name": "Personal Workspace",
        "createdAt": "2024-10-22T17:00:00.000Z",
        "lastAccessedAt": "2024-10-22T17:05:00.000Z",
        "isDefault": true
      }
    ],
    "defaultInstanceId": "workspace-id",
    "isAdmin": false
  },
  "accessToken": "...",
  "refreshToken": "..."
}
```

### Token Structure

```json
{
  "userId": "user-id",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234567890,
  "iss": "work-squared-auth"
}
```

## Environment Variables

| Variable                 | Description                                     | Default                                  |
| ------------------------ | ----------------------------------------------- | ---------------------------------------- |
| `JWT_SECRET`             | Secret key for JWT signing                      | `dev-secret-please-change-in-production` |
| `ENVIRONMENT`            | Environment setting                             | `development`                            |
| `DISCORD_WEBHOOK_URL`    | Webhook URL for signup notifications (optional) | -                                        |
| `SERVER_BYPASS_TOKEN`    | Shared secret for internal workspace lookups    | _none (required for `/internal`)_        |
| `MAX_INSTANCES_PER_USER` | Override per-user workspace quota               | `10`                                     |

⚠️ **Important**: Always use a strong, random `JWT_SECRET` in production!

## Error Codes

| Code                   | Description                        |
| ---------------------- | ---------------------------------- |
| `INVALID_CREDENTIALS`  | Invalid email or password          |
| `EMAIL_ALREADY_EXISTS` | Email already registered           |
| `INVALID_TOKEN`        | Token is invalid or malformed      |
| `TOKEN_EXPIRED`        | Token has expired                  |
| `INVALID_REQUEST`      | Request format or data is invalid  |
| `WEAK_PASSWORD`        | Password doesn't meet requirements |
| `USER_NOT_FOUND`       | User does not exist                |
| `INTERNAL_ERROR`       | Server error occurred              |
