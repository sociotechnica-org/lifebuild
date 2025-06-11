# Work Squared

Work Squared is an AI-enabled work environment featuring real-time collaborative Kanban boards.

## Running locally

1.  **Install dependencies:**

    ```bash
    pnpm install
    ```

2.  **Set up environment variables:**
    Copy the environment files:

    ```bash
    cp .env.example .env
    cp .dev.vars.example .dev.vars
    ```

    Update `.env` with the following for local development:

    ```
    VITE_LIVESTORE_SYNC_URL=ws://localhost:8787
    D1_DATABASE_ID=
    ```

    Update `.dev.vars` with your LLM API credentials:

    ```
    BRAINTRUST_API_KEY="your-braintrust-api-key-here"
    BRAINTRUST_PROJECT_ID="your-braintrust-project-id-here"
    ```

    _(Note: `D1_DATABASE_ID` can be left blank for local development as Wrangler will use a local SQLite file. Get Braintrust credentials from https://www.braintrust.dev/)_

3.  **Run the development server:**
    This will start the Vite frontend and the local Cloudflare Worker concurrently.
    ```bash
    pnpm dev
    ```
    
    To run on a custom port:
    ```bash
    PORT=3000 pnpm dev
    ```

## Deployment

This project is deployed as a single Cloudflare Worker that serves both the static frontend assets and the backend WebSocket server.

### First-Time Setup

Before the first deployment, you need to create the production D1 database and configure its ID.

1.  Run the following command to create the database on Cloudflare:

    ```bash
    pnpm wrangler d1 create work-squared-prod
    ```

2.  Copy the `database_id` from the command's output.

3.  Open `wrangler.jsonc` and paste the copied ID into the `database_id` field within the `d1_databases` section.

### Deployment Process

The application is automatically deployed to `app.worksquared.ai` upon every push to the `main` branch using GitHub Actions.

To run a manual deployment from your local machine (requires authentication with `wrangler`):

```bash
pnpm wrangler:deploy
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

```bash
# Run development server (Vite + Wrangler)
pnpm dev

# Run development server on custom port
PORT=3000 pnpm dev

# Run Storybook (port 6010)
pnpm storybook

# Run tests
pnpm test

# Lint and format code
pnpm lint
pnpm format

# Type checking
pnpm typecheck

# Build for production
pnpm build

# Deploy to Cloudflare
pnpm wrangler:deploy
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

Work Squared is built with a modern, real-time architecture:

- **Frontend**: React 19 with TypeScript, Vite for development, Tailwind CSS for styling
- **State Management**: LiveStore with event sourcing and SQLite materialized views
- **Real-time Sync**: WebSocket server on Cloudflare Workers with Durable Objects
- **Testing**: Vitest for unit tests, React Testing Library for components, Storybook for UI development
- **Drag & Drop**: @dnd-kit for accessible, performant drag-and-drop interactions

### Key Design Decisions

- **Local-first**: Data is stored locally and synced to the cloud, ensuring fast interactions
- **Event Sourcing**: All changes are events, enabling reliable real-time collaboration
- **Card-only Drop Targets**: Simplified drag-and-drop UX with Add Card buttons for end-of-column drops
- **Comprehensive Testing**: Unit, component, and visual regression tests for reliability
