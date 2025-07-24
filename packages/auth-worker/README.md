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
cp .env.example .env

# Start development server
pnpm dev
```

The service will be available at `http://localhost:8788`.

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

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT signing | `dev-secret-please-change-in-production` |
| `ENVIRONMENT` | Environment setting | `development` |

⚠️ **Important**: Always use a strong, random `JWT_SECRET` in production!

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Invalid email or password |
| `EMAIL_ALREADY_EXISTS` | Email already registered |
| `INVALID_TOKEN` | Token is invalid or malformed |
| `TOKEN_EXPIRED` | Token has expired |
| `INVALID_REQUEST` | Request format or data is invalid |
| `WEAK_PASSWORD` | Password doesn't meet requirements |
| `USER_NOT_FOUND` | User does not exist |
| `INTERNAL_ERROR` | Server error occurred |