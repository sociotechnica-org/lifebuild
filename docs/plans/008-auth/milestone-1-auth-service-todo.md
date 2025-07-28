# Milestone 1: Auth Service Foundation - TODO

## Overview
Create the core authentication service as a separate Cloudflare Worker with User Store Durable Object.

## Prerequisites
- [ ] Monorepo structure in place (from multiplayer work)
- [ ] Understanding of Cloudflare Workers and Durable Objects
- [ ] Cloudflare account with Workers enabled

## Implementation Tasks

### 1. Project Setup
- [ ] Create `packages/auth-worker` directory
- [ ] Initialize package.json with Cloudflare Worker dependencies
- [ ] Set up TypeScript configuration
- [ ] Create wrangler.toml with Durable Object binding
- [ ] Add to pnpm workspace

### 2. Core Infrastructure
- [ ] Create Worker entry point (`src/index.ts`)
- [ ] Set up request routing for auth endpoints
- [ ] Configure CORS headers for cross-origin requests
- [ ] Add error handling middleware
- [ ] Set up environment variable bindings

### 3. User Store Durable Object
- [ ] Create `UserStore` Durable Object class
- [ ] Implement email → userId mapping storage
- [ ] Add user data structure:
  ```typescript
  interface User {
    id: string
    email: string
    hashedPassword: string
    createdAt: Date
    instances: Instance[]
  }
  ```
- [ ] Implement user CRUD operations
- [ ] Add email uniqueness validation

### 4. Password Security
- [ ] Install Argon2id library compatible with Workers
- [ ] Create password hashing utility
- [ ] Create password verification utility
- [ ] Add password strength validation
- [ ] Test hashing performance in Workers environment

### 5. JWT Implementation
- [ ] Create JWT signing utility using Web Crypto API
- [ ] Create JWT verification utility
- [ ] Define token payload structure
- [ ] Set up JWT_SECRET environment variable
- [ ] Add token expiration logic (15 min access, 7 day refresh)

### 6. Auth Endpoints

#### POST /signup
- [ ] Parse and validate email/password from request
- [ ] Check email uniqueness via User Store
- [ ] Hash password with Argon2id
- [ ] Create user in User Store
- [ ] Create default instance for user
- [ ] Generate JWT + refresh token
- [ ] Return tokens and user data

#### POST /login
- [ ] Parse email/password from request
- [ ] Fetch user by email from User Store
- [ ] Verify password against hash
- [ ] Generate new JWT + refresh token
- [ ] Return tokens and user instances

#### POST /refresh
- [ ] Parse refresh token from request
- [ ] Verify refresh token validity
- [ ] Generate new access token
- [ ] Optionally rotate refresh token
- [ ] Return new tokens

#### POST /logout
- [ ] Parse refresh token
- [ ] Invalidate refresh token (if tracking)
- [ ] Return success response

### 7. Testing Infrastructure
- [ ] Set up Miniflare for local testing
- [ ] Create test utilities for auth flows
- [ ] Write unit tests for:
  - [ ] Password hashing/verification
  - [ ] JWT generation/verification
  - [ ] User Store operations
- [ ] Write integration tests for:
  - [ ] Complete signup flow
  - [ ] Complete login flow
  - [ ] Token refresh flow

### 8. Development Experience
- [ ] Add npm scripts for local development
- [ ] Create example .env file
- [ ] Add development logging
- [ ] Create curl examples for testing
- [ ] Document API endpoints

### 9. Error Handling
- [ ] Define error response format
- [ ] Add specific error codes for:
  - [ ] Invalid credentials
  - [ ] Email already exists
  - [ ] Invalid token
  - [ ] Token expired
- [ ] Add rate limiting for auth endpoints
- [ ] Log errors appropriately

### 10. Deployment Preparation
- [ ] Configure production wrangler.toml
- [ ] Set up GitHub Actions for deployment
- [ ] Add production secrets to Cloudflare
- [ ] Test deployment process
- [ ] Verify Durable Object migration

## Verification Checklist

### Local Testing
- [ ] Can create new user with unique email
- [ ] Cannot create user with duplicate email
- [ ] Can login with correct credentials
- [ ] Cannot login with incorrect password
- [ ] JWT contains correct claims
- [ ] Tokens expire at correct times
- [ ] Refresh token generates new access token

### Security Verification
- [ ] Passwords are properly hashed (not plaintext)
- [ ] JWTs are signed with secret
- [ ] CORS headers restrict origins appropriately
- [ ] Rate limiting prevents brute force
- [ ] No sensitive data in error messages

### API Testing Commands
```bash
# Test signup
curl -X POST http://localhost:8788/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePass123!"}'

# Test login
curl -X POST http://localhost:8788/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePass123!"}'

# Test refresh
curl -X POST http://localhost:8788/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "..."}'
```

## Definition of Done
- [ ] All endpoints working locally
- [ ] All tests passing
- [ ] Security best practices followed
- [ ] Deployment successful to Cloudflare
- [ ] Documentation complete
- [ ] Code reviewed and approved

## Next Steps
Once this milestone is complete, proceed to Milestone 2: JWT Integration with WebSocket Sync