# Cloudflare Deployment TODO

This document outlines the steps required to deploy the Work Squared application to Cloudflare. The goal is to deploy the Vite-based frontend and the Cloudflare Worker backend together, while preserving the local development workflow.

## Running Modes

### Local Development

For local development, we will continue to use the existing setup that runs a Vite dev server for the frontend and a local Wrangler instance for the worker.

- **Command:** `pnpm dev`
- **Frontend:** Runs on `http://localhost:5173` (or another port if configured).
- **Backend:** Wrangler runs a local server for the worker on `http://localhost:8787`.
- **Environment:** The `VITE_LIVESTORE_SYNC_URL` must be set to the local worker URL (e.g., `export VITE_LIVESTORE_SYNC_URL='http://localhost:8787'`).

This setup allows for hot-reloading and rapid development of both the frontend and the worker.

### Production Deployment

For production, we will use a single command to build the frontend, and deploy both the static assets and the worker to Cloudflare.

- **Command:** `pnpm wrangler:deploy`
- **Frontend:** The Vite application will be built into a static `dist` folder and deployed to Cloudflare Pages.
- **Backend:** The worker will be deployed to Cloudflare's global network.
- **Environment:** The `VITE_LIVESTORE_SYNC_URL` will be set to the production URL. Since the frontend and worker will be served from the same domain, we can use a relative path for the WebSocket URL (e.g., '/'). This will be configured in Cloudflare.

## Status: Completed

All tasks have been completed. The application is configured for both local development and production deployment on Cloudflare.

## Tasks

### 1. Configure `
