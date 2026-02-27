# Web Package (@lifebuild/web)

The React frontend application for LifeBuild, featuring real-time collaborative project management.

## Overview

This package contains the user-facing React application built with modern web technologies:

- **React 19** with TypeScript for the UI framework
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for styling with utility-first approach
- **LiveStore** for real-time state management and sync
- **React Router** for client-side navigation

## Development

### Prerequisites

Run from the monorepo root after `pnpm install`.

### Environment Setup

Copy and configure the environment file:

```bash
cp packages/web/.env.example packages/web/.env
```

Required environment variables:

```env
# WebSocket URL for LiveStore sync
VITE_LIVESTORE_SYNC_URL=ws://localhost:8787

# Authentication configuration
VITE_REQUIRE_AUTH=false  # Set to 'true' for production
VITE_AUTH_SERVICE_URL=http://localhost:8788

# Database ID (leave blank for local development)
D1_DATABASE_ID=

# Braintrust API key for LLM features
BRAINTRUST_API_KEY=your-key-here
```

**Authentication Modes**:

- `VITE_REQUIRE_AUTH=false` (default): Development mode, authentication optional
- `VITE_REQUIRE_AUTH=true`: Production mode, authentication required for all protected routes

### Development Commands

```bash
# Start development server (from root)
pnpm dev
# or run web package only
pnpm --filter @lifebuild/web dev

# Build for production
pnpm --filter @lifebuild/web build

# Run tests
pnpm --filter @lifebuild/web test
pnpm --filter @lifebuild/web test:watch
pnpm --filter @lifebuild/web test:coverage

# E2E tests
pnpm --filter @lifebuild/web test:e2e
# With authentication enforcement (production mode)
REQUIRE_AUTH=true pnpm --filter @lifebuild/web test:e2e

# Linting and formatting
pnpm --filter @lifebuild/web lint
pnpm --filter @lifebuild/web lint:fix
pnpm --filter @lifebuild/web format

# Type checking
pnpm --filter @lifebuild/web typecheck

# Storybook for component development
pnpm --filter @lifebuild/web storybook
pnpm --filter @lifebuild/web build-storybook

# Storybook tests (check for rendering failures)
pnpm --filter @lifebuild/web test:storybook
pnpm --filter @lifebuild/web test:storybook:ci
```

## Architecture

### Key Technologies

- **React 19**: Latest React with concurrent features
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool with HMR
- **Tailwind CSS**: Utility-first CSS framework
- **LiveStore**: Real-time state management with event sourcing
- **@dnd-kit**: Accessible drag-and-drop functionality

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── documents/      # Document management features
│   ├── layout/         # App layout components
│   ├── projects/       # Project and workspace views
│   ├── tasks/          # Task management components
│   ├── ui/            # Base UI components
│   ├── utils/         # Utility components
│   └── workers/       # AI worker management
├── constants/          # App constants and configuration
├── test-utils.tsx     # Testing utilities
└── Root.tsx          # App entry point with providers
```

### State Management

- **LiveStore**: Event-sourced state with real-time sync
- **React Context**: For app-level state (user, theme, etc.)
- **Local State**: Component-level state with hooks

### Testing Strategy

- **Unit Tests**: Individual component and utility testing with Vitest
- **Integration Tests**: Component interaction testing with React Testing Library
- **E2E Tests**: End-to-end authentication and user flow testing with Playwright
- **Storybook**: Visual component development and testing

#### E2E Testing

The project includes comprehensive E2E tests that validate authentication flows and user interactions:

**Development Mode (`REQUIRE_AUTH=false`)**:

- Tests UI components and basic functionality
- Validates app works without authentication
- Automatically skips auth enforcement tests

**Production Mode (`REQUIRE_AUTH=true`)**:

- Tests complete signup → login → project creation flow
- Validates protected route redirects and session management
- Tests authentication state in UI (login button vs user dropdown)

**Key E2E Test Coverage**:

- ✅ Login/signup page UI and form validation
- ✅ Authentication service API integration
- ✅ Protected route access control
- ✅ Post-login redirect handling
- ✅ Session cleanup on logout

**Running Specific Test Categories**:

```bash
# Test auth service integration
pnpm test:e2e --grep "auth service API"

# Test development mode behavior
pnpm test:e2e --grep "development mode"

# Test complete auth flow (requires REQUIRE_AUTH=true)
REQUIRE_AUTH=true pnpm test:e2e --grep "complete auth"

# Test form validation
pnpm test:e2e --grep "validate.*form"
```

## Features

### Core Functionality

- **JWT Authentication**: Secure user authentication with signup/login flows
- **Task Lists**: Status-based task management with click-to-cycle workflow
- **Multi-user Collaboration**: Live updates across users with user attribution
- **Project Workspaces**: Organized task and document management
- **AI Workers**: Configurable AI assistants for tasks
- **Document Management**: Create and edit rich text documents
- **Protected Routing**: Environment-controlled access to authenticated features

### UI/UX Features

- **Responsive Design**: Mobile-first approach
- **Dark/Light Mode**: Theme switching support
- **Accessibility**: ARIA compliant with keyboard navigation
- **Loading States**: Smooth user experience during data loading
- **Error Boundaries**: Graceful error handling

## Configuration

### Vite Configuration

- **React Plugin**: Fast refresh and JSX support
- **TypeScript**: Type checking and compilation
- **Tailwind CSS**: JIT compilation and optimization
- **Path Aliases**: Clean import statements
- **Build Optimization**: Code splitting and tree shaking

### LiveStore Integration

- **Schema Import**: Shared types from `@lifebuild/shared`
- **Web Worker**: Background processing for sync operations
- **Shared Worker**: Multi-tab synchronization
- **OPFS Storage**: Persistent local storage

### Testing Configuration

- **Vitest**: Fast unit test runner
- **React Testing Library**: Component testing utilities
- **jsdom**: DOM environment for testing
- **MSW**: API mocking for integration tests

## Product Analytics (PostHog)

Events are sent to PostHog via the `usePostHog` hook from `posthog-js/react` (re-exported from `src/lib/analytics.ts`).

### Page Views

| Event                  | Trigger                     | Properties  | Source                  |
| ---------------------- | --------------------------- | ----------- | ----------------------- |
| `life_map_viewed`      | Life Map page mounted       | —           | `LifeMap.tsx`           |
| `drafting_room_viewed` | Drafting Room page mounted  | —           | `DraftingRoom.tsx`      |
| `sorting_room_viewed`  | Sorting Room page mounted   | —           | `SortingRoom.tsx`       |
| `project_viewed`       | Project detail page mounted | `projectId` | `ProjectDetailPage.tsx` |

### Project Lifecycle

| Event                     | Trigger                               | Properties                        | Source                                               |
| ------------------------- | ------------------------------------- | --------------------------------- | ---------------------------------------------------- |
| `project_created`         | New project created in Stage 1        | `category`, `projectId`           | `Stage1Form.tsx`                                     |
| `project_stage_completed` | User advances through drafting stages | `stage` (1, 2, or 3), `projectId` | `Stage1Form.tsx`, `Stage2Form.tsx`, `Stage3Form.tsx` |
| `project_completed`       | Project marked as complete            | `projectId`                       | `ProjectHeader.tsx`                                  |
| `project_archived`        | Project archived from project room    | `projectId`                       | `ProjectHeader.tsx`                                  |
| `project_abandoned`       | Project abandoned from drafting room  | `projectId`, `stage`              | `DraftingRoom.tsx`                                   |

### Sorting Room

| Event                          | Trigger                                             | Properties            | Source                |
| ------------------------------ | --------------------------------------------------- | --------------------- | --------------------- |
| `sorting_room_stream_switched` | User switches between Gold/Silver/Bronze streams    | `stream`              | `SortingRoom.tsx`     |
| `queue_reordered`              | Gold/Silver queue drag-and-drop reorder             | `stream`              | `GoldSilverPanel.tsx` |
| `project_tabled`               | Project activated to the table                      | `stream`, `projectId` | `GoldSilverPanel.tsx` |
| `project_released`             | Project released from table                         | `stream`              | `GoldSilverPanel.tsx` |
| `bronze_project_added`         | Bronze project added to table (drag-drop or button) | —                     | `BronzePanel.tsx`     |
| `bronze_stack_reordered`       | Bronze stack drag-and-drop reorder                  | —                     | `BronzePanel.tsx`     |

### Tasks

| Event                 | Trigger                         | Properties                | Source                  |
| --------------------- | ------------------------------- | ------------------------- | ----------------------- |
| `task_created`        | New task created via task list  | `projectId`               | `TaskList.tsx`          |
| `task_status_changed` | Task status cycled in task list | `from`, `to`, `projectId` | `TaskList.tsx`          |
| `task_detail_opened`  | Task detail modal opened        | `taskId`, `projectId`     | `ProjectDetailPage.tsx` |
| `task_detail_edited`  | Task detail saved after editing | `projectId`               | `TaskDetailModal.tsx`   |

### Life Map

| Event                       | Trigger               | Properties | Source             |
| --------------------------- | --------------------- | ---------- | ------------------ |
| `life_map_category_clicked` | Category card clicked | `category` | `CategoryCard.tsx` |

### Room Chat

| Event                          | Trigger                      | Properties                        | Source                   |
| ------------------------------ | ---------------------------- | --------------------------------- | ------------------------ |
| `room_chat_opened`             | Chat panel opened            | `roomId`, `roomKind`              | `RoomLayout.tsx`         |
| `room_chat_closed`             | Chat panel closed            | `roomId`, `roomKind`              | `RoomLayout.tsx`         |
| `room_chat_conversation_ready` | Conversation data loaded     | `roomId`, `roomKind`, timing data | `useRoomConversation.ts` |
| `room_chat_worker_created`     | AI worker created for a room | `workerId`, `roomId`, `roomKind`  | `useRoomAgent.ts`        |

### Adding New Events

Use the `usePostHog` hook and call `posthog?.capture()`:

```typescript
import { usePostHog } from '../lib/analytics.js'

const posthog = usePostHog()
posthog?.capture('event_name', { property: 'value' })
```

## Deployment

As of September 2025, the web package is deployed to **Cloudflare Pages** as a separate service from the backend worker.

### Production Deployment

The web app is deployed to **Cloudflare Pages** with the custom domain `app.lifebuild.me`:

```bash
# Build with production environment variables
VITE_REQUIRE_AUTH=true \
VITE_AUTH_SERVICE_URL=https://auth.lifebuild.me \
VITE_LIVESTORE_SYNC_URL=wss://sync.lifebuild.me \
pnpm build

# Deploy to Cloudflare Pages
pnpm run deploy
```

### Deployment Configuration

- **Project Name**: `lifebuild-web`
- **Custom Domain**: `app.lifebuild.me`
- **Build Output**: `dist/` directory
- **Deployment Method**: Wrangler CLI (`wrangler pages deploy`)

### Environment Variables for Production

Production builds require these environment variables:

```bash
VITE_REQUIRE_AUTH=true
VITE_AUTH_SERVICE_URL=https://auth.lifebuild.me
VITE_LIVESTORE_SYNC_URL=wss://sync.lifebuild.me
```

### Automated Deployment

GitHub Actions automatically deploys the web app when changes are pushed to the `main` branch. The workflow:

1. Installs dependencies
2. Builds with production environment variables
3. Deploys to Cloudflare Pages using `pnpm run deploy`
