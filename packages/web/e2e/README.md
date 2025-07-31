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
# Test only UI components (works in dev mode)
npx playwright test --grep "should display auth UI components"

# Test only full auth flow (requires REQUIRE_AUTH=true)
REQUIRE_AUTH=true npx playwright test --grep "should complete full authentication flow"

# Test form validation
npx playwright test --grep "should validate signup form"
```