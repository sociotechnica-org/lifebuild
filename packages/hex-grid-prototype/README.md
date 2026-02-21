# Hex Grid Prototype

An interactive 3D hexagonal grid map built with React, Three.js, and custom GLSL shaders. Features a fantasy-style world with draggable sprites, unit pathfinding, and two procedural texture modes (parchment and Kubelka-Munk watercolor).

## Getting Started

```bash
pnpm install
pnpm dev        # Starts dev server on http://localhost:3001
```

## Controls

- **Click hex** — select hex and move unit via pathfinding
- **Click sprite** — pick up sprite; click another hex to drop (swaps on collision)
- **Arrow keys** — pan camera
- **Scroll wheel** — zoom in/out
- **Tab** — toggle shader mode (Parchment / Kubelka-Munk)
- **Escape** — cancel held sprite
- **Elevation slider** — adjust camera angle (5-90 degrees)

## Tech Stack

- React 19 + TypeScript
- Three.js via @react-three/fiber and @react-three/drei
- Zustand for state management
- Custom GLSL shaders (parchment texture, Kubelka-Munk paint simulation)
- Vite for bundling

## Scripts

```bash
pnpm dev          # Dev server (port 3001)
pnpm build        # TypeScript check + Vite build
pnpm preview      # Preview production build
pnpm test         # Run unit tests
pnpm lint-all     # Lint, format, and typecheck
pnpm deploy       # Deploy to Cloudflare Pages
```

## Live Demo

https://hex-grid-prototype.pages.dev/

## Deploy

Deploys as a static site to Cloudflare Pages:

```bash
pnpm build
pnpm deploy
```
