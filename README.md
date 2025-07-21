# Work Squared

Work Squared is an AI-enabled work environment featuring real-time collaborative Kanban boards, built with a modern monorepo architecture.

## Monorepo Structure

This project is organized as a pnpm workspace with the following packages:

- **[`packages/web`](./packages/web/README.md)** - React frontend application
- **[`packages/worker`](./packages/worker/README.md)** - Cloudflare Worker backend 
- **[`packages/shared`](./packages/shared/README.md)** - Shared schemas and utilities

## Quick Start

1.  **Install dependencies:**

    ```bash
    pnpm install
    ```

2.  **Set up environment variables:**
    Copy the environment files:

    ```bash
    cp packages/web/.env.example packages/web/.env
    cp .dev.vars.example .dev.vars
    ```

    Update `packages/web/.env` with:

    ```
    VITE_LIVESTORE_SYNC_URL=ws://localhost:8787
    D1_DATABASE_ID=
    BRAINTRUST_API_KEY=
    ```

    Update `.dev.vars` with your LLM API credentials:

    ```
    BRAINTRUST_API_KEY="your-braintrust-api-key-here" 
    BRAINTRUST_PROJECT_ID="your-braintrust-project-id-here"
    ```

    _(Get Braintrust credentials from https://www.braintrust.dev/)_

3.  **Run the development server:**
    This will start the Vite frontend and Cloudflare Worker concurrently.

    ```bash
    pnpm dev
    ```

    To run on a custom port:

    ```bash
    PORT=3000 VITE_LIVESTORE_SYNC_URL='http://localhost:8787' pnpm dev
    ```

## Deployment

This project is deployed as a single Cloudflare Worker that serves both the static frontend assets and the backend WebSocket server.

### First-Time Setup

Before the first deployment, you need to create the production D1 database and configure its ID.

1.  Run the following command to create the database on Cloudflare:

    ```bash
    pnpm --filter @work-squared/worker wrangler d1 create work-squared-prod
    ```

2.  Copy the `database_id` from the command's output.

3.  Open `packages/worker/wrangler.jsonc` and paste the copied ID into the `database_id` field within the `d1_databases` section.

### Deployment Process

The application is automatically deployed to `app.worksquared.ai` upon every push to the `main` branch using GitHub Actions.

To run a manual deployment from your local machine (requires authentication with `wrangler`):

```bash
pnpm --filter @work-squared/worker deploy
```

## Features

- **Real-time Kanban Boards**: Collaborative task management with live updates
- **Multi-user Assignment**: Assign multiple team members to tasks with avatar indicators
- **Task Management**: Create, edit, and view detailed task information
- **Drag & Drop**: Move tasks between columns and reorder within columns
- **Responsive Design**: Works on desktop and mobile devices
- **Local-first Architecture**: Powered by LiveStore for offline-capable real-time sync
- **Type-safe**: Built with TypeScript for robust development

## Development Commands

### Workspace Commands (run from root)

```bash
# Run development server (Vite + Wrangler) 
pnpm dev

# Run development server on custom port
PORT=3000 VITE_LIVESTORE_SYNC_URL='http://localhost:8787' pnpm dev

# Run all linting and formatting checks
pnpm lint-all

# Run tests across all packages
pnpm test

# Run E2E tests  
pnpm test:e2e
CI=true pnpm test:e2e  # For verification

# Deploy to Cloudflare
pnpm --filter @work-squared/worker deploy
```

### Package-specific Commands

```bash
# Web package (frontend)
pnpm --filter @work-squared/web dev        # Start Vite dev server
pnpm --filter @work-squared/web build      # Build for production
pnpm --filter @work-squared/web test       # Run unit tests
pnpm --filter @work-squared/web storybook  # Start Storybook (port 6010)

# Worker package (backend) 
pnpm --filter @work-squared/worker dev      # Start Wrangler dev server
pnpm --filter @work-squared/worker deploy  # Deploy to Cloudflare

# Shared package
pnpm --filter @work-squared/shared typecheck  # Type check schemas
```

## Ports

- **Vite dev server**: 60001 (default), configurable via `PORT` environment variable
- **Wrangler dev server**: 8787
- **Storybook**: 6010 (configured to avoid conflicts with other Storybook instances)

## Testing

The project includes a comprehensive testing setup:

### Unit & Component Tests (Vitest + React Testing Library)

```bash
pnpm test              # Run all tests
pnpm test:watch        # Run tests in watch mode
pnpm test:coverage     # Generate coverage report
```

### Component Development (Storybook)

```bash
pnpm storybook         # Start Storybook dev server (port 6010)
pnpm build-storybook   # Build static Storybook
pnpm test:storybook    # Run Storybook tests
```

### CI/CD

- All tests run automatically on every PR via GitHub Actions
- Test results and coverage reports are uploaded as artifacts

## Architecture

Work Squared is built with a modern monorepo architecture featuring real-time collaboration and AI integration.

**📖 For detailed technical architecture, see [docs/architecture.md](./docs/architecture.md)**

### Key Technologies
- **Monorepo**: pnpm workspaces with TypeScript across all packages
- **Frontend**: React 19, Vite, Tailwind CSS, LiveStore for state management
- **Backend**: Cloudflare Worker with Durable Objects and WebSocket sync
- **AI Integration**: Client-side agentic loops with tool calling via LLM proxy
- **Testing**: Vitest, React Testing Library, Playwright E2E tests

### Package Structure
- **[`packages/web`](./packages/web/README.md)** - React frontend application
- **[`packages/worker`](./packages/worker/README.md)** - Cloudflare Worker backend 
- **[`packages/shared`](./packages/shared/README.md)** - Shared schemas and utilities
