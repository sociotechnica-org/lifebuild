# New UI Components

This directory contains the in-progress reimplementation of the Work Squared interface. Pages and components that live here are intentionally minimal – their primary goal is to establish routing, data-fetching patterns, and baseline rendering for the new `/new` route hierarchy.

## Structure

- `projects/` – Pages and stories for the new Projects list and Project detail experiences.
- `layout/` – Lightweight shells used to keep new surfaces independent from the legacy navbar/chat chrome.

## Guidelines

- Follow the requirements outlined in `docs/plans/026-new-ui-foundation/plan.md`.
- Use real LiveStore data via `useQuery` hooks; avoid mock data outside of Storybook boot functions.
- Prefer small, focused components that can evolve into the future design system.
- Continue to preserve the `storeId` query parameter via `preserveStoreIdInUrl` when linking between routes.
- Route-level shells (e.g., `NewUiShell`) should not pull in legacy layout primitives; they are responsible for providing only the minimal spacing/background baseline the new UI needs.

## Projects surfaces

- `ProjectsListPage.tsx` – `/new/projects` route showing a simple list of projects.
- `ProjectsListPage.stories.tsx` – Default, empty, and single-project stories seeded with LiveStore events.
- `ProjectDetailPage.tsx` – `/new/projects/:projectId` route listing project details and tasks.
- `ProjectDetailPage.stories.tsx` – Default, empty, single-task, and many-task stories seeded with LiveStore events.

Refer back to `docs/plans/026-new-ui-foundation/plan.md` for the expected Storybook hierarchy and data scenarios.

These guidelines will evolve as additional plans land; keep this README up to date as new directories are added.
