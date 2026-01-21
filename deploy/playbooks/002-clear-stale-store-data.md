# Playbook 002: Clear Stale Store Data on Render

## Symptoms

- Server logs show: `During boot the backend head (X) should never be greater than the local head (Y)`
- A specific store fails to initialize with `LiveStore.UnknownError`
- Server runs in degraded mode (other stores work, one store is skipped)
- The error persists across restarts

## Root Cause

The local SQLite database on Render's persistent disk (`/var/data`) has fallen behind the sync backend. This can happen when:

- The sync worker received events that weren't persisted locally before a crash
- Render's disk was restored from an older snapshot
- Network issues during sync caused data divergence

## Prerequisites

```bash
# Ensure Render CLI is authenticated
render whoami

# Note the service ID
# Agentic server: srv-d281c9p5pdvs7382v5g0
```

## Phase 1: Identify the Affected Store

### 1.1 Check Recent Logs

```bash
render logs --resources srv-d281c9p5pdvs7382v5g0 --output text --limit 100 | grep -E "(backend head|Failed to create store|storeId)"
```

Look for:
- Which `storeId` is failing
- The head mismatch numbers (e.g., backend: 454, local: 453)

### 1.2 Verify Store is in Degraded State

```bash
curl -s https://work-squared.onrender.com/health | jq '.stores[] | {storeId, status}'
```

The affected store may not appear (failed to initialize) or show errors.

## Phase 2: Clear the Stale Data

### Option A: SSH and Delete Store Directory (Preferred)

This option preserves other stores' data.

```bash
# SSH into the service (REQUIRES APPROVAL)
render ssh srv-d281c9p5pdvs7382v5g0
```

Once connected:
```bash
# List the data directory
ls -la /var/data/

# Identify the store directory (named after storeId)
# e.g., /var/data/danvers-personal-lb/

# Remove ONLY the affected store's data
rm -rf /var/data/<storeId>/

# Exit SSH
exit
```

Then restart the service:
```bash
# REQUIRES APPROVAL
render restart srv-d281c9p5pdvs7382v5g0 --confirm
```

### Option B: Clear Entire Data Directory via SSH

Use this if multiple stores are corrupted.

```bash
render ssh srv-d281c9p5pdvs7382v5g0
```

Once connected:
```bash
# Remove all store data (will re-sync from backend)
rm -rf /var/data/*

exit
```

Then restart:
```bash
render restart srv-d281c9p5pdvs7382v5g0 --confirm
```

### Option C: Recreate the Disk (Nuclear Option)

If SSH isn't working or disk is severely corrupted:

1. Go to Render Dashboard > Service > Disks
2. Delete the existing disk
3. Create a new disk with same mount path (`/var/data`)
4. Redeploy the service

**Warning**: This deletes ALL local data. Stores will re-sync from the backend.

## Phase 3: Verify Recovery

### 3.1 Check Logs After Restart

```bash
render logs --resources srv-d281c9p5pdvs7382v5g0 --output text --limit 50
```

Look for:
- `Store created successfully` for the affected store
- `Event monitoring started` with correct counts
- No more `backend head > local head` errors

### 3.2 Verify Health Endpoint

```bash
curl -s https://work-squared.onrender.com/health | jq '{status, storeCount, stores: [.stores[].storeId]}'
```

The previously failing store should now appear.

## Escalation

Escalate if:
- SSH access is denied or unavailable
- The store keeps failing after clearing data
- Multiple stores are affected simultaneously
- Data on the sync backend appears corrupted

## Prevention

To reduce likelihood of this issue:

1. **Graceful shutdowns**: Ensure the server has time to flush data before termination
2. **Monitoring**: Alert on `LiveStore.UnknownError` in Sentry
3. **Backup strategy**: Consider periodic snapshots of the Render disk

## Related

- [001-server-down](./001-server-down.md) - General server debugging
- LiveStore sync architecture in `docs/architecture.md`
