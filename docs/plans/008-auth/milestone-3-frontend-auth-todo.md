# Milestone 3: Frontend Auth UI and Flow - TODO

## Overview
Build the authentication UI components and integrate the complete auth flow into the React application.

## Prerequisites
- [ ] Milestone 1 complete (Auth Service running)
- [ ] Milestone 2 complete (JWT integration in sync)
- [ ] Understanding of React Router and Context API
- [ ] Familiarity with existing UI patterns

## Implementation Tasks

### 1. Auth Context Setup
- [ ] Create `packages/web/src/contexts/AuthContext.tsx`:
  ```typescript
  interface AuthContextValue {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (email: string, password: string) => Promise<void>
    signup: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
    refreshToken: () => Promise<void>
  }
  ```
- [ ] Implement AuthProvider component
- [ ] Add token storage utilities
- [ ] Set up automatic token refresh
- [ ] Handle auth state persistence

### 2. Token Management
- [ ] Create `packages/web/src/utils/auth.ts`:
  - [ ] Store access token in memory/localStorage
  - [ ] Store refresh token in httpOnly cookie
  - [ ] Parse JWT to extract user info
  - [ ] Check token expiration
  - [ ] Implement token refresh logic
- [ ] Add auth headers to API calls
- [ ] Handle 401 responses globally

### 3. Login Page Component
- [ ] Create `packages/web/src/pages/Login.tsx`
- [ ] Design login form matching existing UI:
  - [ ] Email input with validation
  - [ ] Password input with show/hide toggle
  - [ ] Remember me checkbox
  - [ ] Submit button with loading state
- [ ] Add "Sign up" link
- [ ] Handle login errors gracefully
- [ ] Redirect to intended page after login

### 4. Signup Page Component
- [ ] Create `packages/web/src/pages/Signup.tsx`
- [ ] Design signup form:
  - [ ] Email input with validation
  - [ ] Password input with strength indicator
  - [ ] Confirm password field
  - [ ] Terms acceptance checkbox
- [ ] Add "Already have account?" link
- [ ] Show success message
- [ ] Auto-login after signup

### 5. Protected Routes
- [ ] Create `packages/web/src/components/ProtectedRoute.tsx`
- [ ] Check authentication status
- [ ] Redirect to login if not authenticated
- [ ] Save intended destination for post-login redirect
- [ ] Show loading state during auth check
- [ ] Handle auth context errors

### 6. Update App Routing
- [ ] Add auth routes to router:
  - [ ] `/login` - Login page
  - [ ] `/signup` - Signup page
  - [ ] `/logout` - Logout handler
- [ ] Wrap existing routes in ProtectedRoute
- [ ] Handle public vs private routes
- [ ] Add route transitions

### 7. Header User Info
- [ ] Update header component to show:
  - [ ] User email when logged in
  - [ ] User avatar/initial
  - [ ] Dropdown with:
    - [ ] Account settings
    - [ ] Instance switcher
    - [ ] Logout option
- [ ] Hide user info when logged out
- [ ] Add login/signup buttons for guests

### 8. Auto Token Refresh
- [ ] Set up refresh timer on login
- [ ] Refresh before expiration (e.g., at 80% of lifetime)
- [ ] Handle refresh failures:
  - [ ] Retry with backoff
  - [ ] Force re-login if refresh fails
- [ ] Cancel timer on logout
- [ ] Coordinate across tabs via SharedWorker

### 9. Auth Error Handling
- [ ] Create consistent error messages:
  - [ ] Invalid credentials
  - [ ] Email already exists
  - [ ] Network errors
  - [ ] Server errors
- [ ] Show errors in UI appropriately
- [ ] Add error recovery actions
- [ ] Log errors for debugging

### 10. Loading States
- [ ] Add loading skeletons during auth check
- [ ] Show spinner during login/signup
- [ ] Disable forms during submission
- [ ] Prevent multiple submissions
- [ ] Handle slow network gracefully

### 11. Form Validation
- [ ] Email validation:
  - [ ] Valid format
  - [ ] Required field
- [ ] Password validation:
  - [ ] Minimum length (8 chars)
  - [ ] Complexity requirements
  - [ ] Match confirmation
- [ ] Real-time validation feedback
- [ ] Clear error messages

### 12. Styling and UX
- [ ] Match existing design system:
  - [ ] Use existing color palette
  - [ ] Consistent spacing
  - [ ] Matching typography
  - [ ] Responsive layout
- [ ] Add smooth transitions
- [ ] Focus management for accessibility
- [ ] Keyboard navigation support

### 13. Testing

#### Unit Tests
- [ ] AuthContext provider logic
- [ ] Token management utilities
- [ ] Form validation functions
- [ ] Protected route behavior

#### Integration Tests
- [ ] Complete login flow
- [ ] Complete signup flow
- [ ] Token refresh cycle
- [ ] Logout across tabs
- [ ] Route protection

#### E2E Tests
- [ ] User journey: Signup → Login → Use app → Logout
- [ ] Token expiration handling
- [ ] Form validation errors
- [ ] Network error recovery
- [ ] Multi-tab scenarios

### 14. Development Experience
- [ ] Add Storybook stories for:
  - [ ] Login form states
  - [ ] Signup form states
  - [ ] User header dropdown
- [ ] Create mock auth provider for testing
- [ ] Document auth flow
- [ ] Add debug logging

## Verification Checklist

### User Experience
- [ ] Smooth login/signup flow
- [ ] Clear error messages
- [ ] No auth flicker on page load
- [ ] Seamless token refresh
- [ ] Responsive on all devices

### Security
- [ ] Tokens stored securely
- [ ] No sensitive data in localStorage
- [ ] HTTPS enforced in production
- [ ] XSS protection in place
- [ ] CSRF protection for forms

### Functionality
- [ ] Can create new account
- [ ] Can login with credentials
- [ ] Stays logged in across sessions
- [ ] Can logout successfully
- [ ] Protected routes enforced

### Visual Testing
- [ ] Login page matches design
- [ ] Signup page matches design
- [ ] Error states look correct
- [ ] Loading states smooth
- [ ] Mobile layout works

## Definition of Done
- [ ] All auth UI components built
- [ ] Auth flow fully integrated
- [ ] Protected routes working
- [ ] Token refresh automatic
- [ ] All tests passing
- [ ] Responsive design complete
- [ ] No console errors/warnings

## Common Issues to Avoid
- Double token refresh in multi-tab
- Auth state flicker on reload
- Infinite redirect loops
- Token leakage in logs
- Poor error messages

## Next Steps
Once complete, proceed to Milestone 4: Multi-Instance User Management