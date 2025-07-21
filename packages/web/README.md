# Web Package (@work-squared/web)

The React frontend application for Work Squared, featuring real-time collaborative Kanban boards.

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

# Database ID (leave blank for local development)
D1_DATABASE_ID=

# Braintrust API key for LLM features
BRAINTRUST_API_KEY=your-key-here
```

### Development Commands

```bash
# Start development server (from root)
pnpm dev
# or run web package only
pnpm --filter @work-squared/web dev

# Build for production
pnpm --filter @work-squared/web build

# Run tests
pnpm --filter @work-squared/web test
pnpm --filter @work-squared/web test:watch
pnpm --filter @work-squared/web test:coverage

# Linting and formatting
pnpm --filter @work-squared/web lint
pnpm --filter @work-squared/web lint:fix
pnpm --filter @work-squared/web format

# Type checking
pnpm --filter @work-squared/web typecheck

# Storybook for component development
pnpm --filter @work-squared/web storybook
pnpm --filter @work-squared/web build-storybook
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
- **Unit Tests**: Individual component and utility testing
- **Integration Tests**: Component interaction testing
- **Storybook**: Visual component development and testing

## Features

### Core Functionality
- **Real-time Kanban Boards**: Drag-and-drop task management
- **Multi-user Collaboration**: Live updates across users
- **Project Workspaces**: Organized task and document management
- **AI Workers**: Configurable AI assistants for tasks
- **Document Management**: Create and edit rich text documents

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
- **Schema Import**: Shared types from `@work-squared/shared`
- **Web Worker**: Background processing for sync operations
- **Shared Worker**: Multi-tab synchronization
- **OPFS Storage**: Persistent local storage

### Testing Configuration
- **Vitest**: Fast unit test runner
- **React Testing Library**: Component testing utilities
- **jsdom**: DOM environment for testing
- **MSW**: API mocking for integration tests

## Deployment

The web package is built and deployed as static assets served by the Cloudflare Worker.

Build artifacts are placed in `dist/` and referenced by the worker package's `wrangler.jsonc` configuration.