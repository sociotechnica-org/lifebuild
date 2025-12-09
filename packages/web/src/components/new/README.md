# New UI Components

This directory contains the in-progress reimplementation of the LifeBuild interface. Pages and components that live here are intentionally minimal – their primary goal is to establish routing, data-fetching patterns, and baseline rendering for the new `/new` route hierarchy.

## Structure

- `projects/` – Foundations for the new Projects list and Project detail experiences.
- `layout/` – Lightweight shells used to keep new surfaces independent from the legacy navbar/chat chrome.

## Guidelines

- Follow the requirements outlined in `docs/plans/026-new-ui-foundation/plan.md`.
- Use real LiveStore data via `useQuery` hooks; avoid mock data outside of Storybook boot functions.
- Prefer small, focused components that can evolve into the future design system.
- Continue to preserve the `storeId` query parameter via `preserveStoreIdInUrl` when linking between routes.
- Route-level shells (e.g., `NewUiShell`) should not pull in legacy layout primitives; they are responsible for providing only the minimal spacing/background baseline the new UI needs.

These guidelines will evolve as additional plans land; keep this README up to date as new directories are added.
