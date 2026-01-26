# Plan 038: LiveStore Recovery, Prevention, and Client Resync

Date: 2026-01-26
Owner: Jess Martin

## Overview

This plan restores production access for jess-personal-lb, establishes a repeatable recovery runbook for backend head > local head failures, identifies root causes, and ensures web clients can re-sync cleanly after recovery. It also defines upstream investigation and contribution to LiveStore.

## Current Symptoms (2026-01-25 to 2026-01-26)

- Server boot failure for stores jess-personal-lb and danvers-personal-lb.
- Error: backend head greater than local head during boot (example: backend 695, local 683).
- Manual update of local \_\_livestore_sync_status.head to 683 did not resolve because backend head advanced further before boot.
- Web client out of sync, showing stale or partial project data.

## Hypotheses (Root Cause Candidates)

1. Materializer crash during sync advanced backend head but local eventlog did not commit.
2. Materializer or schema change caused deterministic failure during boot replay.
3. Concurrent writers or mismatched schemaHash causing divergence.
4. Client-side persistence or worker failures causing stale local state in the browser.

## Immediate Actions (24 hours)

1. Recover server store jess-personal-lb so production can boot.
2. Restore data visibility in web client.
3. Capture evidence for root-cause analysis.

## Immediate Recovery (Server)

### Strategy

- The backend sync server is the source of truth.
- Local state must be allowed to catch up when backend head > local head.
- Short-term recovery can be a controlled bypass of the boot assertion so the store can sync.

### Manual Recovery Steps (Render)

1. Backup local store directory:
   - /var/data/jess-personal-lb
2. Inspect eventlog head:
   - eventlog@6.db -> max(seqNumGlobal)
3. Inspect \_\_livestore_sync_status:
   - eventlog@6.db -> head
4. If backend head > local head:
   - Temporarily bypass the boot guard and allow the store to sync from backend.
   - This requires a controlled patch or a hotfix build in our service (see below).

### Hotfix Patch (Short-Term)

- Implement a server-side boot override to treat backend > local as recoverable.
- Retry createStore with a "recovery mode" that permits initial sync.
- After catch-up, revert or disable the override.

## Official Fix (Server)

### Proposed Implementation

- Add a recovery path in server boot when the specific LiveStore error appears.
- Behavior:
  - Log warning with storeId, backend head, local head.
  - Trigger recovery mode:
    - Option A: patch LiveStore dependency in the app build to allow backend > local head.
    - Option B: add a recoverable mode in createStore that skips the guard (requires upstream change).
  - Once sync completes, continue with normal operation.

### Recovery Mode Switch

- Environment variable guard, e.g. LIVESTORE_ALLOW_BACKEND_AHEAD=true
- If enabled only for recovery, this reduces risk of masking other failures.

## Runbook (Production Operations)

### Detection

- Alert on the specific error message in logs:
  "During boot the backend head (...) should never be greater than the local head (...)"
- Send notifications to Discord (Sentry) when this occurs.

### Containment

- Quarantine the store directory with a timestamped backup.
- Record current heads (backend head from error log, local head from eventlog).

### Recovery

- Use the recovery mode or patched build to boot and sync.
- Validate store creation success in logs.
- Verify key data in web UI.

### Post-Recovery

- Capture materializer error logs around the original crash time.
- File an upstream issue or add data to existing LiveStore issues.

## Upstream Investigation (LiveStore)

### Questions to Resolve

- Official recovery mechanism for backend head > local head mismatch.
- Whether backend head should advance before materializer commit.
- Safe boot behavior for recovery scenarios.
- Any planned official fixes (issue #409 and #730 context).

### Actions

- Add detailed reproduction info and logs to LiveStore issue #409.
- Ask for guidance or supported recovery path.
- Track issue #730 for auto-rematerialization and assess if it mitigates this scenario.

## Web Client Out-of-Sync Plan

### Hypotheses

- Local persisted adapter state is behind backend and does not recover.
- SharedWorker or OPFS caching stale eventlog and no recovery path exists.
- Client stuck due to same backend head > local head issue, but surfaced differently.

### Recovery Options

- Provide a client-side "reset local store" action with clear UX.
- Add detection for sync mismatch and prompt user to reset local cache.
- Ensure reconnection and resync is attempted on startup after recovery.

## Observability Improvements

- Log the following on store boot:
  - storeId, backend head, local head, schemaHash, adapter version.
- Add Sentry breadcrumbs for materializer failures.
- Add structured warning when recovery mode is used.

## Action Checklist

- [ ] Implement recovery mode in server (temporary override) and deploy.
- [ ] Write and publish a runbook in docs/plans and internal ops notes.
- [ ] Add Sentry alert for backend head mismatch errors.
- [ ] Investigate materializer crash source in server logs.
- [ ] Investigate web client storage and sync status; add reset flow.
- [ ] File upstream issue comment with logs and reproduction steps.

## Recovery Notes (Experiment Log)

### 2026-01-26: Minimal wipe test for jess-personal-lb

- Goal: validate whether deleting only /var/data/jess-personal-lb allows clean rehydrate from backend.
- Steps:
  - Stop service or scale to zero.
  - Backup /var/data/jess-personal-lb (tarball).
  - Delete only /var/data/jess-personal-lb.
  - Restart service and observe boot logs.
- Results:
  - Server booted without backend head mismatch.
  - Eventlog contains only 1 ProjectCreated event (v2.ProjectCreated).
  - Materialized state contains 1 project (matches eventlog).
- Observations:
  - Missing projects are not in local eventlog after rehydrate, indicating backend history is truncated
    or stored under a previous persistence format version (PERSISTENCE_FORMAT_VERSION) not being read.
  - Web client mismatch is downstream of backend history, not purely a client cache issue.

### 2026-01-26: Current state (freeze)

- Front-end, server, and sync backend are now aligned and showing the same dataset.
- Project is frozen at this state by request.

## Recovery Patch (Server)

### Backend head repair at boot

- Added a pre-boot check in `packages/server/src/factories/store-factory.ts` that:
  - Locates the local eventlog database for a store.
  - Reads `__livestore_sync_status.head` and compares it to `max(seqNumGlobal)` from `eventlog`.
  - If backend head is ahead, updates it to the local head and logs a recovery warning.
- This is intended to prevent boot failure when backend head > local head.

## Open Questions

- What caused the original materializer crash or state divergence?
- Are there schema/materializer changes deployed recently that would trigger this?
- Can we detect and reconcile mismatched schemaHash across server and web?
- Should we implement a periodic integrity check or snapshotting strategy?
