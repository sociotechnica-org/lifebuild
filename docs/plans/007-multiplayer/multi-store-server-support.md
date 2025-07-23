# Multi-Store Server Support Plan

## Overview

This document outlines the plan to extend the Node.js server to support multiple LiveStore instances (storeIds) instead of the current single-store limitation. This addresses the multi-tenant nature of Work Squared where users can have multiple workspace instances.

## Current State

The server currently supports only one LiveStore instance:
- Single `storeId` configured via environment variable
- One store per server process
- Manual deployment required for each workspace

## Architecture Goal

Enable a single Node.js server to handle multiple Work Squared instances dynamically:

```
┌─────────────────────────────────┐
│     Node.js Server              │
│                                 │
│  Map<storeId, LiveStore> {      │
│    "workspace-123": store1,     │
│    "workspace-456": store2,     │
│    "workspace-789": store3,     │
│    ...                          │
│  }                              │
│                                 │
│  - Dynamic store creation       │
│  - Per-store event monitoring   │
│  - Isolated agentic processing  │
└─────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Manual Multi-Store Support (Immediate)

**Goal**: Support multiple predefined stores without dynamic discovery

**Implementation**:
- Environment variable for comma-separated store IDs: `STORE_IDS=workspace-123,workspace-456`
- Create LiveStore instance for each configured ID
- Monitor events across all stores independently
- Isolate agentic processing per workspace

**Files to modify**:
- `packages/server/src/index.ts` - Main server logic
- `packages/server/src/store.ts` - Store factory functions
- `packages/server/.env.example` - Configuration examples

**Benefits**:
- Immediate support for multiple workspaces
- No external dependencies
- Simple configuration model

**Limitations**:
- Manual configuration required
- No dynamic instance discovery
- Resource usage grows with number of stores

### Phase 2: Instance Registry Integration (Medium-term)

**Goal**: Dynamic store discovery via instance registry

**Prerequisites**:
- Auth service implementation (ADR-005)
- Instance registry endpoint: `GET /api/instances`

**Implementation**:
- Server queries instance registry on startup
- Periodic polling for new/removed instances
- Dynamic store lifecycle management
- Health checks per instance

**API Integration**:
```typescript
interface InstanceRegistry {
  listActiveInstances(): Promise<Instance[]>
  onInstanceCreated(callback: (instance: Instance) => void): void
  onInstanceDeleted(callback: (instanceId: string) => void): void
}
```

**Benefits**:
- Automatic instance discovery
- Dynamic scaling based on active workspaces
- Centralized instance management

### Phase 3: Advanced Multi-Tenancy (Long-term)

**Goal**: Production-ready multi-tenant server

**Features**:
- Resource isolation per tenant
- Instance cleanup policies
- Performance monitoring per workspace
- Rate limiting per instance
- Backup/restore per workspace

## Technical Considerations

### Memory Management
- Each LiveStore instance requires SQLite connection
- File system storage per instance (./data/{storeId}/)
- Consider memory limits with many instances

### Event Processing Isolation
- Separate agentic loops per workspace
- No cross-contamination between instances
- Independent error handling per store

### Configuration Strategy
```env
# Phase 1: Manual list
STORE_IDS=workspace-123,workspace-456,workspace-789

# Phase 2: Registry integration
INSTANCE_REGISTRY_URL=https://auth.work-squared.com/api/instances
REGISTRY_POLL_INTERVAL=60000

# Phase 3: Advanced config
MAX_INSTANCES_PER_SERVER=50
INSTANCE_CLEANUP_TIMEOUT=86400000
ENABLE_PER_INSTANCE_METRICS=true
```

### File System Structure
```
data/
├── workspace-123/
│   ├── events.db
│   └── materialized.db
├── workspace-456/
│   ├── events.db
│   └── materialized.db
└── workspace-789/
    ├── events.db
    └── materialized.db
```

## Migration Path

### Step 1: Current → Phase 1
1. Update environment configuration
2. Modify store initialization logic
3. Add multi-store monitoring
4. Test with 2-3 instances

### Step 2: Phase 1 → Phase 2
1. Implement instance registry client
2. Add dynamic store creation/removal
3. Handle instance lifecycle events
4. Gradual rollout with fallback

### Step 3: Phase 2 → Phase 3
1. Add resource management
2. Implement monitoring/metrics
3. Production hardening
4. Performance optimization

## Deployment Considerations

### Phase 1 Deployment
- Single server per set of workspaces
- Manual configuration updates
- Restart required for new instances

### Phase 2+ Deployment
- Zero-downtime instance addition
- Graceful instance removal
- Auto-scaling based on load

## Testing Strategy

### Phase 1 Testing
- Multiple stores in development
- Event isolation verification
- Resource usage monitoring

### Phase 2 Testing
- Dynamic instance management
- Registry integration tests
- Failure recovery scenarios

## Success Metrics

### Phase 1
- ✅ Support 3+ instances simultaneously
- ✅ Isolated event processing per instance
- ✅ No cross-instance data leakage

### Phase 2
- ✅ Automatic instance discovery
- ✅ Dynamic store lifecycle management
- ✅ Registry integration working

### Phase 3
- ✅ Production deployment with 10+ instances
- ✅ Resource efficiency optimization
- ✅ Comprehensive monitoring/alerting

## Implementation Priority

**Immediate (Milestone 3)**:
- Phase 1 implementation
- Support 2-3 manually configured instances
- Verify deployment to Render.com

**Next Quarter**:
- Phase 2 implementation
- Auth service integration
- Dynamic instance management

**Future**:
- Phase 3 production hardening
- Advanced multi-tenancy features
- Performance optimization