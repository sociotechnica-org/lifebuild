# Backup, Export & Restore

## Status
Paused – re-evaluate once we settle on the persistence architecture for message processing and event compatibility.

## Why This Is Paused
- **Processed message ledger lives outside LiveStore** (`packages/server/src/services/processed-message-tracker.ts`). Until we either fold that state into the LiveStore event stream or design a reliable way to snapshot it alongside workspace data, every backup concept is incomplete.
- **Event compatibility concerns.** We want the event log to remain the canonical history, but a single “bad” event or a breaking materializer change could prevent replay during restore. We need guardrails (schema versioning, event detox, or contractual backwards compatibility) before betting on log-only recovery.
- **Plan detail outpaced confidence.** The previous draft listed concrete tasks (cron jobs, UI flows, specific bucket layouts) without agreement on the core strategy. We are rolling the plan back to the essentials so future work starts from shared assumptions.

## Current Thinking
### Recovery Sources
1. **LiveStore event log remains the source of truth.** Any strategy must preserve the full log so we can rehydrate state or audit changes later.
2. **Fast-path snapshot for materialized state.** To minimize downtime, we still plan to capture the current state database for each store in addition to the log. Restoring from snapshots avoids replaying the entire history when minutes matter.
3. **Auxiliary server data.** Today the processed-message tracker is a separate SQLite database. Long term we should emit LiveStore events for message processing (or another replicated mechanism) so a backup is self-contained.

### Proposed Backup Package (when resumed)
- Per workspace:  
  - `state.db` – exported via `store.sqliteDbWrapper.export()`.  
  - `eventlog.db` – via `store.clientSession.leaderThread.getEventlogData`.  
  - `manifest.json` – includes schema hash, LiveStore storage format, sync heads, app/version metadata, checksums, and optional pointers to additional artifacts (e.g. R2 assets).  
- Global extras: any non-LiveStore persistence (currently `processed-messages.db`) until it is migrated into the event stream.
- Storage backend: still leaning toward Cloudflare R2 (ADR-003) with lifecycle policies, but final details stay TBD.

### Restore Strategy (high level)
1. Validate manifest compatibility (schema hash, storage format version, app version gates). Abort if mismatched.
2. Pause event processing, detach the workspace store(s), and stage restored files.
3. Atomically swap in the snapshot, rehydrate auxiliary databases, resume the store, and verify sync heads.
4. Keep a replay path from `eventlog.db` for cases where a snapshot cannot be trusted.

## Open Questions
- Should message-processing state move fully into LiveStore events, or is there another replicated store that lets us delete the bespoke SQLite ledger?
- What policy do we adopt for “bad” events? (e.g., soft deletes, quarantine queues, semantic versioning of event payloads.)
- How do we give operators confidence that code changes haven’t invalidated the event log (automated replay tests in CI, schema linting, etc.)?
- Do we need secondary exports for user-uploaded assets in R2, or are pointers in the manifest sufficient?

## Next Steps When Work Resumes
1. Decide on the message-processing persistence strategy so backups cover 100% of critical data.
2. Define the manifest schema, validation rules, and compatibility policies for event replay vs. snapshot restore.
3. Prototype a minimal export/restore loop for a single store to validate LiveStore APIs and surface performance constraints.
4. Re-introduce automation (cron, UI, operator tooling) once the core architecture is agreed upon.

## Historical Notes
The previous version of this plan proposed detailed task breakdowns (R2 bucket setup, cron jobs, UI flows, etc.). Those ideas remain relevant but are intentionally omitted until the architectural questions above are answered.
