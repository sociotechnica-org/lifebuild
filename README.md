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

## Deployment to Cloudflare

This project is configured for a unified deployment to Cloudflare Pages (for the frontend) and Cloudflare Workers (for the backend).

1.  **First-time setup:**

    - Create the D1 database: `pnpm wrangler d1 create work-squared-prod`
    - Copy the `database_id` from the output.
    - Create a Cloudflare secret for the database ID: `echo "<paste-your-database-id>" | pnpm wrangler secret put D1_DATABASE_ID`

2.  **Deploy:**
    Commit your changes and merge them to the `main` branch. The Cloudflare Pages project is configured to automatically deploy on every push to `main`.

    To run a manual deployment from the `main` branch, use:

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
