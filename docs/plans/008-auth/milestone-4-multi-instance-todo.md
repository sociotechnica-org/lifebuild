# Milestone 4: Multi-Instance User Management - TODO

## Overview
Enable users to create and manage multiple Work Squared instances, with seamless switching between different workspaces.

## Prerequisites
- [ ] Milestones 1-3 complete (Full auth system working)
- [ ] Understanding of instance-based architecture
- [ ] Familiarity with Durable Object patterns

## Implementation Tasks

### 1. Update User Data Model
- [ ] Extend User interface in Auth Service:
  ```typescript
  interface Instance {
    id: string
    name: string
    createdAt: Date
    lastAccessedAt: Date
    isDefault?: boolean
  }
  
  interface User {
    // existing fields...
    instances: Instance[]
    defaultInstanceId?: string
  }
  ```
- [ ] Add instance management methods to UserStore DO
- [ ] Ensure instance IDs are globally unique

### 2. Instance Management Endpoints

#### GET /instances
- [ ] Require valid JWT
- [ ] Return user's instance list
- [ ] Include metadata (name, dates)
- [ ] Sort by last accessed
- [ ] Include default flag

#### POST /instances
- [ ] Create new instance with unique ID
- [ ] Set instance name (required)
- [ ] Add to user's instance list
- [ ] Initialize LiveStore for instance
- [ ] Return new instance details

#### PATCH /instances/:id
- [ ] Update instance name
- [ ] Update last accessed time
- [ ] Set as default instance
- [ ] Validate user owns instance

#### DELETE /instances/:id
- [ ] Soft delete (mark as deleted)
- [ ] Prevent deleting last instance
- [ ] Handle default instance deletion
- [ ] Consider data retention policy

### 3. Frontend Instance Context
- [ ] Create `packages/web/src/contexts/InstanceContext.tsx`:
  ```typescript
  interface InstanceContextValue {
    instances: Instance[]
    currentInstance: Instance | null
    isLoading: boolean
    createInstance: (name: string) => Promise<Instance>
    switchInstance: (id: string) => Promise<void>
    renameInstance: (id: string, name: string) => Promise<void>
    deleteInstance: (id: string) => Promise<void>
  }
  ```
- [ ] Load instances on auth
- [ ] Persist current instance selection
- [ ] Handle instance switching

### 4. Instance Selector UI
- [ ] Create instance selector dropdown:
  - [ ] Show current instance name
  - [ ] List all instances on click
  - [ ] Show last accessed time
  - [ ] Highlight current instance
- [ ] Add "Create new instance" option
- [ ] Add instance settings menu
- [ ] Integrate into header component

### 5. Instance Creation Flow
- [ ] Create new instance modal:
  - [ ] Instance name input
  - [ ] Optional description
  - [ ] Create button
- [ ] Show loading during creation
- [ ] Auto-switch to new instance
- [ ] Update instance list
- [ ] Show success notification

### 6. Instance Switching Logic
- [ ] Save current instance work
- [ ] Disconnect from current sync
- [ ] Update URL to reflect instance
- [ ] Connect to new instance sync
- [ ] Load new instance data
- [ ] Update UI accordingly
- [ ] Preserve auth state

### 7. Update Routing Structure
- [ ] Add instance to route structure:
  - [ ] `/i/:instanceId/projects`
  - [ ] `/i/:instanceId/tasks`
  - [ ] `/i/:instanceId/documents`
  - [ ] `/i/:instanceId/workers`
- [ ] Handle missing instance ID
- [ ] Validate user has access
- [ ] Redirect to default instance

### 8. Instance Management Page
- [ ] Create `/settings/instances` page:
  - [ ] List all user instances
  - [ ] Show instance details
  - [ ] Rename instances inline
  - [ ] Delete with confirmation
  - [ ] Set default instance
- [ ] Add usage statistics
- [ ] Show creation date

### 9. First-Time User Experience
- [ ] On signup:
  - [ ] Create default instance ("Personal Workspace")
  - [ ] Set as default
  - [ ] Auto-navigate to instance
- [ ] Add onboarding tooltips
- [ ] Explain instance concept

### 10. Multi-Tab Instance Sync
- [ ] Update SharedWorker to:
  - [ ] Track current instance per tab
  - [ ] Handle instance switches
  - [ ] Sync instance list updates
  - [ ] Coordinate instance deletion
- [ ] Prevent conflicts between tabs

### 11. Instance-Specific Storage
- [ ] Separate LiveStore per instance
- [ ] Update sync connection to use instance ID
- [ ] Clear local cache on switch
- [ ] Handle storage quota limits
- [ ] Add instance data export

### 12. Access Control
- [ ] Verify user owns instance on every request
- [ ] Handle revoked access gracefully
- [ ] Add instance sharing preparation (future)
- [ ] Log access attempts
- [ ] Rate limit instance operations

### 13. Testing

#### Unit Tests
- [ ] Instance CRUD operations
- [ ] Access control validation
- [ ] Instance context logic
- [ ] Route parameter handling

#### Integration Tests
- [ ] Create multiple instances
- [ ] Switch between instances
- [ ] Delete instance flow
- [ ] Multi-tab instance sync
- [ ] First-time user flow

#### E2E Tests
- [ ] Complete instance lifecycle
- [ ] Data isolation between instances
- [ ] URL-based instance access
- [ ] Instance selector UI
- [ ] Settings page functionality

### 14. Performance Considerations
- [ ] Lazy load instance data
- [ ] Cache instance metadata
- [ ] Optimize instance switching
- [ ] Handle many instances (10+)
- [ ] Monitor switching latency

### 15. Migration and Compatibility
- [ ] Migrate existing single-instance users
- [ ] Handle old URLs gracefully
- [ ] Preserve bookmarks if possible
- [ ] Document breaking changes
- [ ] Provide migration guide

## Verification Checklist

### Core Functionality
- [ ] Can create multiple instances
- [ ] Can switch between instances
- [ ] Data properly isolated
- [ ] Can rename instances
- [ ] Can delete instances (except last)

### User Experience
- [ ] Smooth instance switching
- [ ] Clear instance indicator
- [ ] Intuitive creation flow
- [ ] No data loss on switch
- [ ] Responsive UI

### Technical Verification
- [ ] Instances have unique IDs
- [ ] Access control enforced
- [ ] Multi-tab sync works
- [ ] URLs reflect current instance
- [ ] Performance acceptable

### Edge Cases
- [ ] Deleting current instance
- [ ] Switching with unsaved changes
- [ ] Invalid instance ID in URL
- [ ] Network failure during switch
- [ ] Storage quota exceeded

## Definition of Done
- [ ] Instance CRUD operations working
- [ ] UI for instance management complete
- [ ] Instance switching seamless
- [ ] Data isolation verified
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Documentation updated

## Future Enhancements
After multi-instance support:
1. Instance sharing/collaboration
2. Instance templates
3. Instance backup/restore
4. Usage analytics per instance
5. Instance-level settings
6. Team instances

## Notes
- Start with simple implementation
- Focus on single-user instances first
- Prepare for future sharing features
- Keep instance switching fast
- Consider mobile experience