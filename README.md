<div align="center">
  <img src="https://worksquared.ai/worksquared-logo.png" alt="Work Squared Logo" style="max-width: 64px; max-height: 64px;" />
  
 <h1>Work Squared</h1>
</div>

[Work Squared](https://worksquared.ai) (W²) is an AI-enabled work environment where users and AI agents can collaborate on projects and documents.

## Why Work Squared?

W² reimagines project management with:

- **Real-time collaboration** - See changes instantly across all users
- **AI-powered workflows** - Integrated LLM capabilities
- **Local-first architecture** - Works offline with automatic sync when reconnected
- **Event-driven architecture** - Built on [LiveStore](https://livestore.dev)

Read some of [the thinking behind the technical foundations underpinnign Work Squared](https://sociotechnica.org/notebook/ws-tech-foundations/).

## Building in Public

Check out our [development plans](/docs/plans) to see what we're working on and where we're headed. I've been using AI to build this as well, and the plans are an interesting artifact of that process.

## Monorepo Structure

This project is organized as a pnpm workspace with the following packages:

- **[`packages/web`](./packages/web/README.md)** - React frontend application
- **[`packages/worker`](./packages/worker/README.md)** - Cloudflare Worker backend for WebSocket sync
- **[`packages/server`](./packages/server/README.md)** - Node.js server for LLM processing
- **[`packages/auth-worker`](./packages/auth-worker/README.md)** - JWT authentication service
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
    cp packages/worker/.dev.vars.example packages/worker/.dev.vars
    cp packages/auth-worker/.dev.vars.example packages/auth-worker/.dev.vars
    ```

    Update `packages/web/.env` with:

    ```
    VITE_LIVESTORE_SYNC_URL=ws://localhost:8787
    VITE_ENVIRONMENT=development
    VITE_REQUIRE_AUTH=false
    VITE_AUTH_SERVICE_URL=http://localhost:8788
    ```

    Update `packages/worker/.dev.vars` with:

    ```
    ENVIRONMENT=development
    REQUIRE_AUTH=false
    JWT_SECRET=dev-jwt-secret-change-me-in-production
    GRACE_PERIOD_SECONDS=86400
    SERVER_BYPASS_TOKEN=dev-server-bypass-token-change-me
    BRAINTRUST_API_KEY="your-braintrust-api-key-here"
    BRAINTRUST_PROJECT_ID="your-braintrust-project-id-here"
    ```

    Update `packages/auth-worker/.dev.vars` with:

    ```
    ENVIRONMENT=development
    JWT_SECRET=dev-jwt-secret-change-me-in-production
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
# Development
pnpm dev              # Start all services (web + worker + server)
pnpm dev:web          # Start only frontend
pnpm dev:worker       # Start only sync worker
pnpm dev:server       # Start only Node.js server
pnpm dev:auth         # Start only auth service

# Quality Checks (all packages)
pnpm lint-all         # Run linting, formatting, and type checking
pnpm typecheck        # Type check all packages
pnpm lint:fix         # Auto-fix linting issues
pnpm format           # Format code

# Testing
pnpm test                  # Run unit tests (web + auth)
pnpm test:watch            # Run tests in watch mode
pnpm test:e2e              # Run E2E tests
pnpm test:e2e:ui           # Run E2E tests with UI
pnpm test:integration:auth # Run auth service integration tests

# Building & Deployment
pnpm build            # Build all packages
pnpm deploy:worker    # Deploy sync worker to Cloudflare
pnpm deploy:auth      # Deploy auth service to Cloudflare
```

### Package-specific Commands

All packages support a consistent set of scripts where applicable:

```bash
# Quality checks (available in packages with source code)
pnpm --filter <package> lint-all    # Complete quality check
pnpm --filter <package> typecheck   # TypeScript type checking
pnpm --filter <package> lint        # Run linter
pnpm --filter <package> lint:fix    # Auto-fix linting issues
pnpm --filter <package> format      # Format code

# Testing (available in packages with tests)
pnpm --filter <package> test        # Run tests once
pnpm --filter <package> test:watch  # Run tests in watch mode

# Development
pnpm --filter <package> dev         # Start development server
pnpm --filter <package> build       # Build for production
```

### Script Standards

Each package follows consistent naming conventions:

| Script       | Purpose             | Available In                     |
| ------------ | ------------------- | -------------------------------- |
| `dev`        | Development server  | web, worker, server, auth-worker |
| `build`      | Production build    | web, server                      |
| `test`       | Run tests once      | web, auth-worker                 |
| `test:watch` | Watch mode tests    | web, auth-worker                 |
| `lint-all`   | All quality checks  | All packages                     |
| `typecheck`  | TypeScript checking | All packages                     |
| `lint`       | Linting only        | web, server                      |
| `lint:fix`   | Auto-fix linting    | web, server                      |
| `format`     | Code formatting     | web, server                      |

## Ports

- **Vite dev server**: 60001 (default), configurable via `PORT` environment variable
- **Cloudflare Worker**: 8787 (WebSocket sync server)
- **Auth Worker**: 8788 (JWT authentication service)
- **Node.js Server**: 3001 (LLM processing server)
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
- **[`packages/worker`](./packages/worker/README.md)** - Cloudflare Worker for WebSocket sync
- **[`packages/server`](./packages/server/README.md)** - Node.js server for LLM processing
- **[`packages/auth-worker`](./packages/auth-worker/README.md)** - JWT authentication service
- **[`packages/shared`](./packages/shared/README.md)** - Shared schemas and utilities
