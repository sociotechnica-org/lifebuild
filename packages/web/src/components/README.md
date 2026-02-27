# UI Components

This directory contains the LifeBuild user-facing components. Sub-directories are organised by feature area:

- `drafting-room/` – Project creation wizard (stages 1–3).
- `layout/` – App shell, room layout, table bar, and LiveStore status indicator.
- `life-map/` – Life Map view and category cards.
- `project-room/` – Project detail view with task list and task modals.
- `projects/` – Project cards and detail page wrapper.
- `sorting-room/` – Gold/silver/bronze stream sorting UI.
- `room-chat/` – Per-room chat panel.
- `ui/` – Shared primitives (modals, error boundaries, tooltips, loading states).
- `utils/` – Helper functions shared across components.
- `admin/` – Admin user management pages.
- `markdown/` – Markdown renderer.

## Guidelines

- Use real LiveStore data via `useQuery` hooks; avoid mock data outside of Storybook boot functions.
- Prefer small, focused components that can evolve into the design system.
- Preserve the `storeId` query parameter via `preserveStoreIdInUrl` when linking between routes.
