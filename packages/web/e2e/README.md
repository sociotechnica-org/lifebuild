# E2E Authentication Testing

This directory contains comprehensive E2E tests for the authentication system, including tests that validate the complete signup → login → create content flow.

## Running Auth Tests

### Development Mode (REQUIRE_AUTH=false)

```bash
# Standard E2E tests - tests UI components and basic flows
pnpm test:e2e
```

### Production Mode (REQUIRE_AUTH=true)

```bash
# Run with authentication enforcement enabled
REQUIRE_AUTH=true pnpm test:e2e
```

The tests will automatically:

- **Skip auth enforcement tests** when `REQUIRE_AUTH=false` (development mode)
- **Run full authentication flow tests** when `REQUIRE_AUTH=true` (production mode)
- **Always test UI components and form validation** regardless of auth mode

## Test Coverage

### Always Run (Both Modes)

- ✅ Login/signup page UI components
- ✅ Form validation (client-side)
- ✅ Error handling for invalid credentials
- ✅ Navigation between auth pages
- ✅ Dev mode indicators

### Only When REQUIRE_AUTH=true

- ✅ Complete signup → login → project creation flow
- ✅ Protected route redirects
- ✅ Post-login redirect to intended destination
- ✅ Logout functionality and session cleanup
- ✅ Authentication state in header (sign in button vs user dropdown)

## Authentication Flow Tested

1. **User tries to access protected route** → redirected to `/login`
2. **User clicks "Sign up"** → navigates to `/signup`
3. **User creates account** → redirected to `/login` with success message
4. **User logs in** → redirected to intended destination
5. **User sees authenticated header** → user initials dropdown visible
6. **User creates project** → authenticated functionality works
7. **User logs out** → redirected to login, session cleared
8. **User tries protected route again** → redirected to login

## Environment Setup

The tests automatically detect the auth mode:

```typescript
const REQUIRE_AUTH = process.env.REQUIRE_AUTH === 'true'

test('full auth flow', async ({ page }) => {
  test.skip(!REQUIRE_AUTH, 'This test requires REQUIRE_AUTH=true environment')
  // ... test implementation
})
```

## Running Individual Test Categories

```bash
# Test auth service API integration (works in both modes)
CI=true pnpm test:e2e --grep "should successfully create user via auth service API"

# Test development mode behavior
CI=true pnpm test:e2e --grep "should work in development mode without auth tokens"

# Test full auth flow (requires REQUIRE_AUTH=true and auth-worker running)
REQUIRE_AUTH=true CI=true pnpm test:e2e --grep "should demonstrate complete auth-enabled workflow"

# Test form validation (UI dependent)
CI=true pnpm test:e2e --grep "should validate form inputs correctly"
```

## Test Status

### ✅ Working Tests

- **Auth Service API Integration**: Tests user creation via direct API calls
- **Development Mode**: Tests app functionality with REQUIRE_AUTH=false
- **Basic App Loading**: Tests fundamental app loading and functionality

### 🚧 UI-Dependent Tests

- **Login/Signup Page Loading**: Currently affected by LiveStore loading states in test environment
- **Form Validation**: Depends on auth pages loading correctly
- **Complete Auth Flow UI**: Requires UI elements to be fully loaded

### 💡 Recommendations

For reliable E2E testing of the authentication system:

1. **Use API integration tests** for core auth functionality validation
2. **Test development mode** to ensure the app works without auth
3. **For production testing**, consider using token injection rather than UI flows:

```typescript
// Inject tokens directly for faster, more reliable tests
await page.addInitScript(
  ({ accessToken, refreshToken, user }) => {
    localStorage.setItem('work-squared-access-token', accessToken)
    localStorage.setItem('work-squared-refresh-token', refreshToken)
    localStorage.setItem('work-squared-user-info', JSON.stringify(user))
  },
  { accessToken, refreshToken, user }
)
```

## Production Testing Setup

To test the complete auth flow with REQUIRE_AUTH=true:

1. Start the auth service: `pnpm --filter @work-squared/auth-worker dev`
2. Start the main app with auth required: `REQUIRE_AUTH=true pnpm dev`
3. Run the comprehensive test: `REQUIRE_AUTH=true CI=true pnpm test:e2e --grep "auth-enabled workflow"`
