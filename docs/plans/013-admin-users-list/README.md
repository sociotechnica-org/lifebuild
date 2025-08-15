# Admin Users List Feature

## Overview

Add administrative functionality to Work Squared that allows admin users to view and manage all users in the system. This includes viewing user information, instance counts, and manually managing Work Squared instance IDs (storeIds) for debugging purposes.

## Implementation Status

🔄 **Milestone 1**: Basic Users List - **PLANNED**
🔄 **Milestone 2**: Admin Protection & Bootstrap - **PLANNED**  
🔄 **Milestone 3**: User Management Features - **PLANNED**

## Architecture

- **Simple Bootstrap**: Users with email matching `BOOTSTRAP_ADMIN_EMAIL` env var are admins
- **Admin Flag**: Optional `isAdmin: boolean` field in User model for granular control
- **Integrated UI**: Admin panel accessible via `/admin` route in main Work Squared app
- **REST Endpoints**: Admin functionality exposed through auth-worker endpoints
- **Progressive Protection**: Start unprotected, add protection in milestone 2

## Current State

- JWT authentication system exists in `packages/auth-worker`
- User Store Durable Object manages user data
- Frontend has protected routing system
- No admin functionality currently exists

## Feature Requirements

### Admin User Management

- View list of all users with email, registration date, and instance count
- See which Work Squared instances (storeIds) each user has access to
- Manually add/remove storeIds from users for debugging
- Basic user information display

### Access Control

- Only users with `isAdmin: true` can access admin functionality
- Bootstrap admin user created automatically if no admins exist
- Admin login uses same JWT flow as regular users

### UI Integration

- Admin panel accessible at `/admin` route in main app
- Integrated with existing authentication system
- Consistent with current Work Squared UI patterns

## Milestone 1: Basic Users List (End-to-End)

**Goal**: Create a working `/admin` route that displays all users from auth-worker

### Tasks:

1. **List Users API** - Add `GET /admin/users` endpoint to auth-worker
2. **Admin Users Page** - Create `/admin` route in web app
3. **Basic User Display** - Show email, registration date, instance count

### Features:

- **No Protection**: Anyone can access `/admin` route (safe since no production usage)
- **Simple List**: Table showing all users with basic information
- **Read-Only**: Just viewing, no editing capabilities yet

### API Endpoint:

```typescript
// GET /admin/users (unprotected)
{
  users: [
    {
      email: 'user@example.com',
      createdAt: '2025-01-15T10:00:00Z',
      storeIds: ['store_abc123', 'store_def456'],
      instanceCount: 2,
    },
  ]
}
```

### Frontend:

- Simple table at `/admin` route
- No authentication check required
- Basic styling matching existing Work Squared UI

## Milestone 2: Admin Protection & Bootstrap (End-to-End)

**Goal**: Add admin user concept and protect the `/admin` route

### Tasks:

1. **Bootstrap Admin Logic** - Check `BOOTSTRAP_ADMIN_EMAIL` env var
2. **Admin Check Function** - Determine if user is admin (env var OR isAdmin flag)
3. **Protect Admin Route** - Require admin status to access `/admin`
4. **Admin Navigation** - Show admin link only for admin users

### Admin Logic:

```typescript
// Simple bootstrap check
function isUserAdmin(userEmail: string, env: Env): boolean {
  const bootstrapAdmin = env.BOOTSTRAP_ADMIN_EMAIL
  if (bootstrapAdmin && userEmail === bootstrapAdmin) {
    return true
  }

  // Later: check user.isAdmin flag
  return false
}
```

### Environment Variables:

```bash
# .dev.vars
BOOTSTRAP_ADMIN_EMAIL=admin@localhost.dev

# Production
BOOTSTRAP_ADMIN_EMAIL=admin@company.com
```

### Features:

- **Protected Route**: `/admin` requires admin authentication
- **Bootstrap Admin**: User with matching email gets admin access
- **Admin Navigation**: Admin link appears in header for admin users
- **JWT Integration**: Admin status included in auth context

## Milestone 3: User Management Features (End-to-End)

**Goal**: Add ability to modify users and their storeIds

### Tasks:

1. **User Editing API** - Add endpoints for updating users
2. **StoreId Management** - Add/remove storeIds from users
3. **Admin Flag Management** - Toggle admin status for users
4. **User Detail Modal** - Interface for editing user details

### API Endpoints:

```typescript
// POST /admin/users/:email/store-ids
{
  action: "add" | "remove",
  storeId: "store_xyz789"
}

// POST /admin/users/:email/admin-status
{
  isAdmin: boolean
}
```

### Features:

- **StoreId Management**: Add/remove Work Squared instance IDs
- **Admin Management**: Toggle admin flag for any user
- **User Detail Modal**: Click user to open editing interface
- **Real-time Updates**: Changes reflect immediately in the list

## Progressive Implementation Benefits

### Milestone 1 Benefits:

- **Quick Win**: Get basic admin visibility immediately
- **No Risk**: Unprotected route safe since no production usage
- **Foundation**: Establishes API patterns and UI structure

### Milestone 2 Benefits:

- **Security**: Adds proper admin protection
- **Simple Bootstrap**: Just one env var to create admin access
- **Production Ready**: Can be safely deployed to production

### Milestone 3 Benefits:

- **Full Functionality**: Complete user management capabilities
- **Debugging Support**: Manual storeId management for troubleshooting
- **Flexible Admin**: Both bootstrap and flag-based admin users

## Technical Considerations

### Data Consistency

- StoreIds are strings that should match actual Work Squared instances
- No validation of storeId existence (manual debugging tool)
- Changes to storeIds take effect immediately

### Performance

- User list paginated to handle large user bases
- Basic search functionality (email filtering)
- No complex querying needed initially

### Security

- Admin status determined by email match OR isAdmin flag
- All protected admin endpoints require valid admin JWT (from Milestone 2+)
- Bootstrap admin uses simple email comparison

## Files to Create/Modify

### Milestone 1 Files:

**Auth Worker:**

- `functions/_worker.ts` - Add unprotected `/admin/users` endpoint

**Web App:**

- `src/components/admin/AdminUsersPage.tsx` - Basic users list page
- `src/App.tsx` - Add `/admin` route

### Milestone 2 Files:

**Auth Worker:**

- `src/admin.ts` - Admin check functions using BOOTSTRAP_ADMIN_EMAIL
- `functions/_worker.ts` - Add admin protection middleware

**Web App:**

- `src/components/admin/AdminRoute.tsx` - Protected route component
- `src/contexts/AuthContext.tsx` - Include admin status
- `src/components/layout/Navigation.tsx` - Admin navigation link

### Milestone 3 Files:

**Auth Worker:**

- `src/user-store.ts` - Add isAdmin field and update methods
- `functions/_worker.ts` - Add user modification endpoints

**Web App:**

- `src/components/admin/UserDetailModal.tsx` - User editing interface
- `src/components/admin/StoreIdManager.tsx` - StoreId add/remove UI

## Success Criteria

### Milestone 1:

1. ✅ `/admin` route displays list of all users
2. ✅ Shows email, registration date, and instance count
3. ✅ Basic API endpoint retrieves user data from auth-worker

### Milestone 2:

4. ✅ Bootstrap admin works via `BOOTSTRAP_ADMIN_EMAIL` env var
5. ✅ Admin routes are protected from non-admin users
6. ✅ Admin navigation appears only for admin users
7. ✅ JWT includes admin status for authorization

### Milestone 3:

8. ✅ Admin can manually add/remove storeIds from users
9. ✅ Admin can toggle admin status for other users
10. ✅ User detail modal provides editing interface
11. ✅ All changes update immediately in the UI

## Future Enhancements

- **User Activity Logs**: Track when users last accessed instances
- **Instance Health**: Show status of Work Squared instances
- **Bulk Operations**: Add/remove storeIds for multiple users
- **User Search**: Advanced filtering and sorting options
- **Admin Audit Log**: Track all admin actions for security
- **Instance Analytics**: Usage statistics per storeId

## Questions for Implementation

1. **Milestone 1 Scope**: Should the initial users list include search/filtering, or keep it minimal?
2. **StoreId Display**: How should we format/display the storeIds array in the users list?
3. **Error Handling**: What should happen if auth-worker is unreachable from the admin page?
4. **Future Admin Levels**: Should we design the isAdmin flag to support multiple admin levels later?
