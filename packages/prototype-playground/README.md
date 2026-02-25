# Prototype Playground

Shared prototype host for `prototypes.lifebuild.me`.

## Included Prototypes

- `/hex-grid` - Existing hex-grid terrain prototype
- `/state-signals` - Visual language state and marker sandbox
- `/stream-arena` - Gold/Silver/Bronze assignment simulator
- `/signal-garden` - Interactive hex field for category-state scanning

## Run Locally

```bash
pnpm --filter @lifebuild/prototype-playground dev
```

## Deploy to Cloudflare Pages

```bash
pnpm --filter @lifebuild/prototype-playground build
pnpm --filter @lifebuild/prototype-playground deploy
```

`public/_redirects` is included so route paths like `/hex-grid` and `/stream-arena` resolve to the SPA entrypoint in Cloudflare Pages.
