# Plan: Remove legacy UI outside `src/components/new`

## Goal

Remove legacy UI components (and related tests/helpers/stories/assets) outside `packages/web/src/components/new`, leaving only the new UI implementation and its direct dependencies.

## Scope

- **In scope**: React components, hooks, styles, utilities, stories, tests, and fixtures that exist outside `packages/web/src/components/new` and are exclusively used by the legacy UI.
- **Out of scope (for now)**: Non-UI packages (server/worker/shared), build tooling, and any shared utilities still required by the new UI.

## Proposed removal strategy

1. **Inventory legacy UI entry points**
   - Enumerate current UI entry points (routes/pages/layouts) under `packages/web/src` and identify which ones are legacy vs. new.
   - Confirm that the app is wired to the new UI shell/layout and that no legacy pages are still active.

2. **Create a dependency map for legacy UI**
   - Use `rg` to trace imports from legacy routes/pages/components to find dependent helpers, hooks, styles, assets, and test utilities.
   - Build a list of candidate files for removal grouped by folder (e.g., `components/`, `hooks/`, `styles/`, `pages/`, `stories/`, `test-utils/`).

3. **Identify shared utilities still needed by the new UI**
   - For each candidate file, check whether it’s imported from `src/components/new` or new UI routes/pages.
   - Tag any shared utilities (e.g., generic hooks, formatting helpers) that should be retained or moved into a `new`-scoped folder.

4. **Plan folder-level deletions**
   - Prefer deleting entire legacy-only directories when feasible to avoid stragglers.
   - For mixed folders, remove only legacy files and re-run dependency checks.

5. **Storybook cleanup**
   - Remove legacy stories and story-only helpers.
   - Ensure Storybook index still targets the new UI stories.

6. **Test cleanup**
   - Remove legacy unit tests and fixtures tied to deleted components.
   - Update or remove any test utilities only used by legacy UI.

7. **CSS/assets cleanup**
   - Remove legacy CSS/modules and assets (images/icons) no longer referenced.
   - Verify new UI still references required assets.

8. **Validation passes**
   - Run `pnpm lint-all`, `pnpm test`, and `CI=true pnpm test:e2e` to confirm removals.
   - If failures arise, restore or refactor shared utilities as needed.

## Deliverables

- A removal list (per directory) reviewed/approved before execution.
- A single PR removing legacy UI files and associated tests/helpers/assets.

## Open questions

- Are there any legacy UI routes/pages that must remain temporarily (e.g., admin/debug)?
- Should we preserve any legacy components for reference/migration notes (e.g., move to an archive folder), or is full deletion desired?
- Is there a specific cutover point/feature set that defines “new UI complete,” to guide what must be retained?
