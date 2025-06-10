# Work Squared

Work Squared is an AI-enabled work environment.

## Running locally

1.  **Install dependencies:**

    ```bash
    pnpm install
    ```

2.  **Set up environment variables:**
    Copy the `.env.example` file to `.env`:

    ```bash
    cp .env.example .env
    ```

    Update `.env` with the following for local development:

    ```
    VITE_LIVESTORE_SYNC_URL=ws://localhost:8787
    D1_DATABASE_ID=
    ```

    _(Note: `D1_DATABASE_ID` can be left blank for local development as Wrangler will use a local SQLite file.)_

3.  **Run the development server:**
    This will start the Vite frontend and the local Cloudflare Worker concurrently.
    ```bash
    pnpm dev
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

## Development Commands

```bash
# Run development server (Vite + Wrangler)
pnpm dev

# Run Storybook (port 6010)
pnpm storybook

# Run tests
pnpm test

# Build for production
pnpm build

# Deploy to Cloudflare
pnpm wrangler:deploy
```

## Ports

- **Vite dev server**: 5173
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
