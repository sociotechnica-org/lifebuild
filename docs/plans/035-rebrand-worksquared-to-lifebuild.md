# Rebranding Plan: WorkSquared → LifeBuild

**New Domain:** lifebuild.me
**Status:** In Progress (Phase 1 Complete)
**Last Updated:** 2025-12-08

## Executive Summary

This document outlines a comprehensive plan to rebrand WorkSquared to LifeBuild. The rebrand affects **200+ files** across the monorepo, including package names, domain references, Cloudflare infrastructure, documentation, and source code imports.

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Critical Infrastructure](#phase-1-critical-infrastructure-affects-deployment)
3. [Phase 2: Package Names & Monorepo Structure](#phase-2-package-names--monorepo-structure)
4. [Phase 3: Domain & URL References](#phase-3-domain--url-references)
5. [Phase 4: Configuration & Environment Files](#phase-4-configuration--environment-files)
6. [Phase 5: Documentation & Branding](#phase-5-documentation--branding-50-files)
7. [Phase 6: Branding Assets](#phase-6-branding-assets)
8. [Phase 7: Cloudflare Infrastructure Migration](#phase-7-cloudflare-infrastructure-migration)
9. [Execution Order](#recommended-execution-order)
10. [Quick Reference](#quick-reference-find--replace-patterns)

---

## Overview

### Scope of Changes

- **Files to modify:** 200+
- **Package imports to update:** 146+ files
- **Documentation files:** 50+ files
- **Infrastructure resources:** 8 (workers, databases, buckets) including the PostHog proxy worker
- **Domain changes:** 5+ URLs (app, auth, sync, analytics/proxy, marketing)

### Key Changes

| Category                   | Old                                                  | New                                                |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------- |
| **Product Name**           | Work Squared                                         | LifeBuild                                          |
| **Package Scope**          | @work-squared/\*                                     | @lifebuild/\*                                      |
| **Primary Domain**         | worksquared.ai                                       | lifebuild.me                                       |
| **App Domain**             | app.worksquared.ai                                   | app.lifebuild.me                                   |
| **Sync Worker**            | work-squared.jessmartin.workers.dev                  | sync.lifebuild.me ✅                               |
| **Auth Worker**            | work-squared-auth.jessmartin.workers.dev             | auth.lifebuild.me ✅                               |
| **Analytics Proxy Worker** | coconut.worksquared.ai (work-squared-posthog[-prod]) | coconut.lifebuild.me (lifebuild-posthog[-prod]) ✅ |
| **D1 Database**            | work-squared-prod                                    | lifebuild-prod ✅                                  |
| **R2 Bucket (prod)**       | work-squared-images                                  | lifebuild-images ✅                                |
| **R2 Bucket (dev)**        | work-squared-images-preview                          | lifebuild-images-preview ✅                        |

---

## Phase 1: Critical Infrastructure (Affects Deployment)

### 1.1 Cloudflare Workers Configuration

#### packages/worker/wrangler.jsonc ✅ DONE

**Changes implemented:**

```jsonc
{
  "name": "lifebuild-sync",
  "routes": [
    {
      "pattern": "sync.lifebuild.me/*",
      "zone_name": "lifebuild.me",
    },
  ],
  "database_name": "lifebuild-prod",
  "database_id": "dd699f4f-45d8-4152-9427-4067883a4382",
  "bucket_name": "lifebuild-images",
  "preview_bucket_name": "lifebuild-images-preview",
}
```

**Impact:** Worker deployed to sync.lifebuild.me with LifeBuild D1/R2 bindings

---

#### packages/auth-worker/wrangler.toml ✅ DONE

**Changes implemented:**

```toml
name = "lifebuild-auth"

[[routes]]
pattern = "auth.lifebuild.me/*"
zone_name = "lifebuild.me"

[vars]
ENVIRONMENT = "production"

script_name = "lifebuild-auth"
```

**Impact:** Auth worker deployed to auth.lifebuild.me

---

#### packages/posthog-worker/wrangler.toml ✅ DONE

**Changes implemented:**

```toml
name = "lifebuild-posthog"

[[routes]]
pattern = "coconut.lifebuild.me/*"
zone_name = "lifebuild.me"

[env.production]
name = "lifebuild-posthog-prod"

[[env.production.routes]]
pattern = "coconut.lifebuild.me/*"
zone_name = "lifebuild.me"
```

**Impact:** PostHog proxy deployed to coconut.lifebuild.me

---

### 1.2 Server Deployment Configuration

#### packages/server/render.yaml ✅ DONE

**Changes implemented:**

```yaml
# Service name
name: lifebuild-server

# Start command
startCommand: pnpm --filter @lifebuild/server start

# Environment variables
LIVESTORE_SYNC_URL: wss://sync.lifebuild.me
AUTH_WORKER_INTERNAL_URL: https://auth.lifebuild.me

# Disk name
name: lifebuild-data
```

**Impact:** Changes Render.com service and database names

---

#### packages/server/scripts/build.sh ✅ DONE

**Changes implemented:**

```bash
pnpm --filter @lifebuild/server build
```

**Impact:** Server build script uses correct package filter

---

### 1.3 GitHub Workflows

#### .github/workflows/deploy.yml ✅ DONE (URLs only)

**Changes implemented:**

- **Environment variables updated to LifeBuild URLs:**

  ```yaml
  VITE_AUTH_SERVICE_URL: https://auth.lifebuild.me
  VITE_LIVESTORE_SYNC_URL: wss://sync.lifebuild.me
  VITE_PUBLIC_POSTHOG_HOST: https://coconut.lifebuild.me
  ```

- **Success notification URLs updated**

- **Package filter commands** - NOT changed yet (Phase 2):
  - Still using `@work-squared/*` filters which work because package.json names haven't changed
  - Wrangler deploys use wrangler config names, not package.json names

**Impact:** Web app builds with LifeBuild URLs, workers deploy to LifeBuild domains

---

#### .github/workflows/ci.yml

**Changes required:**

- Update package filter: `@work-squared/web` → `@lifebuild/web`

---

#### .github/workflows/test.yml

**Review:** Check for any package name references

---

#### .github/workflows/playwright.yml

**Review:** Check for any package name references

---

## Phase 2: Package Names & Monorepo Structure

### 2.1 Root Package Configuration

#### package.json (root)

#### pnpm-workspace.yaml

#### pnpm-lock.yaml

**Changes required:**

```json
{
  "name": "work-squared-monorepo" → "lifebuild-monorepo",
  "scripts": {
    // Update all @work-squared/* references to @lifebuild/*
    "dev": "... --filter @lifebuild/web --filter @lifebuild/worker ...",
    "dev:web": "pnpm --filter @lifebuild/web dev",
    "dev:worker": "pnpm --filter @lifebuild/worker dev",
    "dev:server": "pnpm --filter @lifebuild/server dev",
    "dev:auth": "pnpm --filter @lifebuild/auth-worker dev",
    "test": "... @lifebuild/shared ... @lifebuild/web ...",
    // ... etc (32 script references total)
  }
}
```

**Impact:** Changes workspace root and all script commands

**Note:** Update `pnpm-workspace.yaml` scope entries and regenerate `pnpm-lock.yaml` after renaming packages to avoid stale lockfile entries.

**Tooling configs to update:**

- `turbo.json` / task runner filters referencing `@work-squared/*`
- Changesets/release config if present (`.changeset/config.json`)

---

### 2.2 Individual Package Names

**Strategy:** Update all package.json files to use `@lifebuild/*` scope and update cross-package dependencies.

#### packages/web/package.json

```json
{
  "name": "@work-squared/web" → "@lifebuild/web",
  "dependencies": {
    "@work-squared/shared": "workspace:*" → "@lifebuild/shared": "workspace:*"
  }
}
```

---

#### packages/worker/package.json

```json
{
  "name": "@work-squared/worker" → "@lifebuild/worker",
  "dependencies": {
    "@work-squared/shared": "workspace:*" → "@lifebuild/shared": "workspace:*"
  }
}
```

---

#### packages/auth-worker/package.json

```json
{
  "name": "@work-squared/auth-worker" → "@lifebuild/auth-worker",
  "dependencies": {
    "@work-squared/shared": "workspace:*" → "@lifebuild/shared": "workspace:*"
  }
}
```

---

#### packages/shared/package.json

```json
{
  "name": "@work-squared/shared" → "@lifebuild/shared"
}
```

---

#### packages/server/package.json

```json
{
  "name": "@work-squared/server" → "@lifebuild/server",
  "dependencies": {
    "@work-squared/shared": "workspace:*" → "@lifebuild/shared": "workspace:*"
  }
}
```

---

#### packages/posthog-worker/package.json

```json
{
  "name": "@work-squared/posthog-worker" → "@lifebuild/posthog-worker"
}
```

**Total:** 7 package.json files

---

### 2.3 Source Code Imports (146+ files)

**Pattern to replace globally:**

```typescript
// From:
import { ... } from '@work-squared/shared/...'

// To:
import { ... } from '@lifebuild/shared/...'
```

**Affected directories:**

- `packages/web/src/**/*.tsx` (100+ files)
- `packages/web/src/**/*.ts` (20+ files)
- `packages/server/src/**/*.ts` (20+ files)
- `packages/*/test/**/*.test.ts` (30+ test files)
- `packages/*/**/*.stories.tsx` (Storybook files)

**Implementation strategy:**

Use global find-and-replace:

```bash
# macOS-safe in-place replace for TS/TSX/JS/JSON files
find packages -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.json" \) -exec sed -i '' 's/@work-squared\\//@lifebuild\\//g' {} +
```

---

## Phase 3: Domain & URL References

### 3.1 Production Domain Updates

**Old domains:**

- `worksquared.ai`
- `app.worksquared.ai`
- `work-squared.jessmartin.workers.dev`
- `work-squared-auth.jessmartin.workers.dev`
- `coconut.worksquared.ai` (PostHog proxy)

**New domains:**

- `lifebuild.me`
- `app.lifebuild.me`
- `lifebuild.jessmartin.workers.dev` (or custom domain)
- `lifebuild-auth.jessmartin.workers.dev` (or custom domain)
- `coconut.lifebuild.me` (or another lifebuild.me subdomain for PostHog proxy)

---

### 3.2 Files with Domain References

#### README.md

**Changes required:**

- **Line 2:** Logo URL
  - `https://worksquared.ai/worksquared-logo.png` → Update with new logo
- **Line 7:** Product link
  - `[Work Squared](https://worksquared.ai)` → `[LifeBuild](https://lifebuild.me)`
- **Line 96:** App URL
  - `app.worksquared.ai` → `app.lifebuild.me`
- **Line 97:** Sync worker URL
  - `work-squared.jessmartin.workers.dev` → `lifebuild.jessmartin.workers.dev`
- **Line 98:** Auth worker URL
  - `work-squared-auth.jessmartin.workers.dev` → `lifebuild-auth.jessmartin.workers.dev`

**Total:** 10+ references in README

---

#### docs/architecture.md

**Changes required:**

- **Line 62:** `https://app.worksquared.ai` → `https://app.lifebuild.me`
- **Line 63:** `https://work-squared.jessmartin.workers.dev` → `https://lifebuild.jessmartin.workers.dev`
- **Line 64:** `https://work-squared-auth.jessmartin.workers.dev` → `https://lifebuild-auth.jessmartin.workers.dev`
- Plus ~20+ product name references throughout

---

#### docs/deployment.md

**Changes required:**

- Multiple references to worker URLs
- Deployment instructions with package names

---

#### packages/web/public/\_headers

**Changes required:**

```
# Line 2: CORS allowed origins
Access-Control-Allow-Origin: https://app.worksquared.ai → https://app.lifebuild.me
Access-Control-Allow-Origin: https://work-squared-auth.jessmartin.workers.dev → https://lifebuild-auth.jessmartin.workers.dev
```

---

#### packages/web/src/pages/SignupPage.tsx

**Review:** Check for hardcoded auth URLs

---

#### packages/web/src/utils/auth.ts

**Review:** Check for auth configuration URLs

---

#### packages/server/render.yaml

**Already covered in Phase 1.2**

---

### 3.3 SEO, Sitemaps, and Canonical Tags

- Update canonical URLs, OpenGraph/Twitter meta tags, and titles in `packages/web/index.html`, layout components, and any marketing pages.
- Regenerate or update `sitemap.xml` and `robots.txt` to reflect `lifebuild.me`.
- Update hreflang tags if present; ensure OG images point to LifeBuild assets.

---

### 3.4 Git Configuration

#### .gitignore

**Changes required:**

```
# Line 19
work-squared-default/ → lifebuild-default/
```

---

#### .git/config

**Note:** Repository URL may need updating if GitHub repo is renamed

```
# Line 9
url = https://github.com/sociotechnica-org/work-squared → lifebuild
```

**Decision:** Yes, rename repo to `lifebuild`; existing clones impact is negligible (single fork) and GitHub will auto-redirect.

---

### 3.5 Auth Flows & Communications

- Update OAuth redirect URIs in provider consoles (Google, GitHub, etc.) to use `lifebuild.me` domains.
- Update email templates (magic links, password reset, invites) to LifeBuild branding and URLs.
- Ensure new sending domain has DKIM/SPF configured; adjust From/Reply-To addresses.
- Update in-app copy and error messages that mention WorkSquared.

---

### 3.6 Analytics Proxy (PostHog) References

- Update `VITE_PUBLIC_POSTHOG_HOST` wherever defined (e.g., `packages/web/.env.example`, `packages/web/src/main.tsx`, `packages/web/src/ambient.d.ts`) to `https://coconut.lifebuild.me` (or chosen lifebuild subdomain).
- Update CSP `connect-src` / `script-src` in `_headers` or meta tags to allow the new PostHog host.
- Update docs mentioning `coconut.worksquared.ai` (e.g., `packages/posthog-worker/README.md`, `docs/adrs/007-analytics-implementation-approach.md`, `docs/plans/025-posthog-first-party-proxy-worker.md`).

---

## Phase 4: Configuration & Environment Files

### 4.1 Environment Example Files

#### packages/web/.env.example

**Review and update:**

- Any URL references to local or production domains
- Comments mentioning WorkSquared
- `VITE_PUBLIC_POSTHOG_HOST` → `https://coconut.lifebuild.me` (or chosen lifebuild subdomain)

---

#### packages/worker/.dev.vars.example

**Review and update:** Variable names or comments if needed

---

#### packages/auth-worker/.dev.vars.example

**Review and update:** Variable names or comments if needed

---

#### packages/server/.env.example

**Review and update:** Store configurations and comments

---

#### packages/server/.env.production

**Review and update:** Production configurations (handle carefully)

---

### 4.2 Tooling & Build Configs

- `tsconfig.json` (root and package-level): Update path aliases from `@work-squared/*` → `@lifebuild/*`.
- ESLint/Prettier configs: Update import resolvers or alias settings referencing old scope.
- Vite config, Storybook config, Jest/Vitest config, Playwright config: adjust base URLs, aliases, or project names.
- Cache keys in CI pipelines that include project names to avoid cache misses or collisions.

---

### 4.3 Other Configuration Files

#### packages/web/index.html

**Changes required:**

```html
<!-- Line 9: Page title -->
<title>Work Squared</title> → <title>LifeBuild</title>
```

**Also check for:**

- Meta description tags
- OpenGraph tags (og:title, og:site_name)
- Twitter card tags

---

#### TypeScript Configuration Files

**Review these files for any package name references:**

- `tsconfig.json` (root)
- `packages/*/tsconfig.json`

---

## Phase 5: Documentation & Branding (50+ files)

### 5.1 Primary Documentation

#### README.md

**Changes required:**

- **Product name:** "Work Squared" → "LifeBuild" (10+ occurrences)
- **Logo URL:** Update image reference
- **Description:** Update all feature descriptions
- **URLs:** Update all domain references (see Phase 3)
- **Commands:** Review examples with package names

---

#### CONTRIBUTING.md

**Changes required:**

- Project name references throughout

---

#### CLAUDE.md

**Changes required:**

- **Commands section:** Update all `@work-squared/*` → `@lifebuild/*`
- **Architecture section:** Update package references
- **Key Files section:** Update package paths
- Throughout: "Work Squared" → "LifeBuild"

---

#### docs/architecture.md

**Changes required:**

- **Title and headers:** "Work Squared" → "LifeBuild"
- **Package references:** `@work-squared/*` → `@lifebuild/*`
- **URLs:** Update production URLs (see Phase 3)
- **Descriptions:** Update throughout (~20+ references)

---

#### docs/deployment.md

**Changes required:**

- **Worker URLs:** Update deployment URLs
- **Commands:** Update package filter commands
- **Configuration:** Update service names

---

#### docs/README.md

**Review and update:** Documentation index references

---

### 5.2 Package README Files

Update all package-specific README files:

1. `packages/web/README.md`
2. `packages/worker/README.md`
3. `packages/auth-worker/README.md`
4. `packages/server/README.md`
5. `packages/shared/README.md`
6. `packages/shared/src/auth/README.md`

**Changes:** Package names, project references, commands

---

### 5.3 Planning & Design Documents

**Note:** Historical planning documents may not need updates, but current/active plans should be updated.

**Files to review:**

- `docs/plans/000-demo-build/todo.md`
- `docs/plans/000-demo-build/work-squared-demo-design.md`
- `docs/plans/002-kanban/kanban-todo.md`
- `docs/plans/004-projects-and-workers/work-squared-production-plan.md`
- `docs/plans/005-law-firm-demo/law-firm-demo-plan.md`
- `docs/plans/012-going-public/going-public-plan.md`
- `docs/plans/017-deployment-separation-migration.md`
- `docs/plans/023-life-squared-epic/*.md` (multiple files)

**Decision:** Defer updating any files under `/docs` for now; a separate PR will handle planning docs/archival.

---

### 5.4 Legal & User Communication

- Update Terms of Service, Privacy Policy, and any in-app legal links to LifeBuild.
- Update support email addresses and FAQ/Help content.
- User communication: not required for this launch.

---

## Phase 6: Branding Assets

### 6.1 Logo & Images

**Current:**

- Logo URL: `https://worksquared.ai/worksquared-logo.png` (external)

**Action items:**

1. Create new LifeBuild logo
2. Danvers will create the new logo; use a fill-in/placeholder logo until final asset is ready.
3. Decide logo location:
   - Host on lifebuild.me domain
   - Store in repo: `docs/images/lifebuild-logo.png`
4. Update README.md reference

---

### 6.2 Favicons & App Icons

**Files to check and update:**

- `packages/web/public/favicon.ico`
- `packages/web/public/favicon-*.png` (if exists)
- `packages/web/public/manifest.json` (PWA manifest)
- Any app icon files in `public/`

**Action items:**

1. Generate new favicon set with LifeBuild branding
2. Update manifest.json with new app name

---

### 6.3 Social Media Images

**Check for:**

- OpenGraph images (og:image)
- Twitter card images
- Any social preview images in `public/`

### 6.4 App-Theming & Client Storage

- CSS variables/theme tokens that embed the brand name.
- PWA manifest `name` and `short_name` to avoid cache/key collisions.
- Service worker cache names, localStorage keys, and cookies that include `work-squared`—rename to avoid stale state crossing the rebrand boundary.

---

## Phase 7: Cloudflare Infrastructure Migration

### 7.1 Cloudflare Resources to Create

#### D1 Database

**Action items:**

1. Create new database: `lifebuild-prod`
2. Run migrations on new database
3. **Data migration:** Optional; no data needs to be migrated for launch. Default to start fresh.
   - If migrating later, rewrite stored URLs (shared links, invites) to `lifebuild.me` during import.
4. Update wrangler.jsonc binding

**Commands:**

```bash
# Create new database
wrangler d1 create lifebuild-prod

# Export data from old database
wrangler d1 export work-squared-prod --output=backup.sql

# Import to new database
wrangler d1 execute lifebuild-prod --file=backup.sql
```

---

#### R2 Buckets

**Action items:**

1. Create bucket: `lifebuild-images` (production)
2. Create bucket: `lifebuild-images-preview` (development)
3. **Data migration:** Optional; no images need to be migrated for launch. Skip unless required later.
4. Update wrangler.jsonc bindings

**Commands:**

```bash
# Create new buckets
wrangler r2 bucket create lifebuild-images
wrangler r2 bucket create lifebuild-images-preview

# Copy objects (may need to use rclone or similar tool)
# This is a manual process - coordinate with ops team
```

---

#### Workers

**Action items:**

1. Deploy new workers with new names:
   - `lifebuild` (sync worker)
   - `lifebuild-auth` (auth worker)
   - `lifebuild-posthog` / `lifebuild-posthog-prod` (analytics proxy)
2. Update custom domains/routes:
   - `sync.lifebuild.me` (or workers.dev)
   - `auth.lifebuild.me` (or workers.dev)
   - `coconut.lifebuild.me` (or unique lifebuild subdomain for analytics)
3. Test new workers before switching traffic

**Commands:**

```bash
# Deploy auth worker
pnpm --filter @lifebuild/auth-worker deploy

# Deploy sync worker
pnpm --filter @lifebuild/worker deploy

# Deploy PostHog proxy worker
pnpm --filter @lifebuild/posthog-worker deploy
```

---

### 7.2 DNS Configuration

**New domains to configure:**

1. **lifebuild.me** - Main marketing site
   - Type: A/CNAME records
   - Points to: new marketing site (repo: sociotechnica-org/life-build-site)

2. **app.lifebuild.me** - Web application
   - Type: CNAME
   - Points to: Cloudflare Pages domain

3. **Preferred:** Custom worker subdomains (avoid \*.workers.dev)
   - `sync.lifebuild.me` → sync worker
   - `auth.lifebuild.me` → auth worker
   - `coconut.lifebuild.me` (or similar unique name) → PostHog proxy worker

**Action items:**

1. Purchase/configure lifebuild.me domain
2. Set up DNS records in Cloudflare
3. Configure SSL certificates
4. Set up redirects from worksquared.ai → lifebuild.me (marketing and app)

---

### 7.3 Cloudflare Pages

**Action items:**

1. Update Pages project configuration:
   - Project name (if renaming)
   - Custom domain: app.lifebuild.me
   - Build configuration (already uses monorepo)

2. Update environment variables:
   - `VITE_AUTH_WORKER_URL`
   - `VITE_LIVESTORE_SYNC_URL`
   - `VITE_BASE_URL`

---

### 7.4 Observability & Monitoring

- Update Sentry/PostHog/LogRocket project names and DSNs/environment tags to LifeBuild.
- Update alert routing channels, uptime checks, and dashboards to new domains.
- Keep old projects temporarily for comparison; ensure env vars in Pages/Workers point to the new DSNs.

---

### 7.5 Migration Timeline

**Recommended approach:**

1. **Fast path (no users / disposable data):** Stand up new infra, deploy, switch DNS, retire old infra—skip data migration.
2. **Parallel deployment (if keeping data):** Deploy new infra alongside old, migrate data, then switch DNS.
3. **Testing phase:** Smoke-test auth, WebSockets, uploads on new stack.
4. **Traffic switch:** Update DNS to point to new infrastructure.
5. **Monitoring:** Watch for errors after switch.
6. **Cleanup:** Deprecate old infrastructure after stable period.

---

## Recommended Execution Order (speed-first, downtime acceptable)

**Prep (same day)**

- Purchase/configure `lifebuild.me` in Cloudflare; set `app.lifebuild.me` (Pages) and `lifebuild`/`lifebuild-auth` worker domains (or workers.dev).
- Stand up fresh resources: D1 `lifebuild-prod`, R2 `lifebuild-images` + `lifebuild-images-preview`, new workers. Skip data migration if no live users; treat WorkSquared data as disposable.
- Produce/choose LifeBuild logo + favicon/OG image set.
- Point `worksquared.ai` marketing domain to redirect to `lifebuild.me` once new site (sociotechnica-org/life-build-site) is live.

**Code changes (fast path)**

1. Rename packages/tooling: root & package `package.json`, `pnpm-workspace.yaml`, regenerate `pnpm-lock.yaml`, update `tsconfig` path aliases, ESLint/Vite/Storybook/Jest/Playwright configs, turbo/changesets, CI cache keys.
2. Replace imports: mac-safe find/replace `@work-squared/` → `@lifebuild/` (includes posthog worker package).
3. Configs: wrangler files (worker, auth-worker, posthog-worker), render.yaml, GitHub workflows (filters/env/caches), `_headers`, manifests, PWA names/cache keys/localStorage keys/cookies.
4. Domains/branding: README/docs, marketing/meta tags (canonical/OG/Twitter), sitemap/robots, titles, Storybook branding.
5. Auth/comms: OAuth redirect URIs, email templates/senders (SPF/DKIM), in-app copy.
6. Analytics/monitoring: Sentry/PostHog project names, DSNs, alert routes, uptime checks.

**Verification (minimal viable to ship)**

- Run `pnpm install` (regens lockfile), `pnpm lint-all`, `pnpm test`.
- Smoke locally/staging: login/signup, WebSocket sync, file upload.

**Deploy & cutover**

- Deploy auth worker, sync worker, web (Pages) pointing at new URLs.
- Deploy PostHog proxy worker with new lifebuild subdomain and update `VITE_PUBLIC_POSTHOG_HOST` env in web/Pages.
- Update DNS to new stack; set redirects from worksquared.ai → lifebuild.me (and app subdomain).
- Monitor logs/alerts; if issues arise, revert DNS or redeploy.

**Post-cutover**

- Optionally migrate or delete old WorkSquared resources after a short stable window.
- Publish updated sitemap, verify search console (if used), and keep monitoring.

---

## Quick Reference: Find & Replace Patterns

### Global Find & Replace

Use these patterns for bulk updates:

```bash
# Package scope (in TypeScript/TSX files)
@work-squared/ → @lifebuild/

# Worker names (in config files)
work-squared-auth → lifebuild-auth
work-squared → lifebuild
work-squared-posthog → lifebuild-posthog

# Database/bucket names (in wrangler files)
work-squared-prod → lifebuild-prod
work-squared-images → lifebuild-images
work-squared-default → lifebuild-default

# Domains (in docs and config)
worksquared.ai → lifebuild.me
app.worksquared.ai → app.lifebuild.me
work-squared.jessmartin.workers.dev → lifebuild.jessmartin.workers.dev
work-squared-auth.jessmartin.workers.dev → lifebuild-auth.jessmartin.workers.dev
coconut.worksquared.ai → coconut.lifebuild.me

# Display names (in docs and UI)
Work Squared → LifeBuild
WorkSquared → LifeBuild
```

---

### Search Commands

Find remaining references:

```bash
# Find package references
grep -r "@work-squared" . --include="*.ts" --include="*.tsx" --include="*.json"

# Find domain references
grep -r "worksquared.ai" . --include="*.md" --include="*.ts" --include="*.tsx" --include="*.yml" --include="*.yaml"

# Find worker references
grep -r "work-squared" . --include="*.jsonc" --include="*.toml" --include="*.yml"

# Find display name references
grep -r "Work Squared\|WorkSquared" . --include="*.md" --include="*.tsx" --include="*.html"
```

---

## Risk Assessment

### High Risk Changes

**Infrastructure naming changes:**

- **Risk:** Deploying with new names before infrastructure is created
- **Mitigation:** Create all new Cloudflare resources before deploying code changes
- **Rollback:** Keep old infrastructure running in parallel during transition

**Database and storage bindings:**

- **Risk:** Application fails if bindings don't match deployed resources
- **Mitigation:** Verify binding names match in wrangler configs before deployment
- **Rollback:** Quick revert to old worker deployments

**Domain changes:**

- **Risk:** Breaking links, SEO impact, user confusion
- **Mitigation:** Set up redirects, communicate changes to users
- **Rollback:** DNS can be reverted, but causes downtime

**Auth flows & communications:**

- **Risk:** OAuth redirect URIs and email links pointing to old domains will block sign-in or send users to dead pages
- **Mitigation:** Update provider consoles, email templates, DKIM/SPF, and in-app copy; verify magic-link flows on staging
- **Rollback:** Temporarily re-enable old redirect URIs and sender domain while finishing cutover

---

### Medium Risk Changes

**Package name changes:**

- **Risk:** Build failures if imports are missed
- **Mitigation:** Global find-replace, automated testing
- **Rollback:** Git revert (no deployment needed)

**Environment variables:**

- **Risk:** Application misconfiguration
- **Mitigation:** Update all .env.example files, document required changes
- **Rollback:** Update environment variables in Cloudflare Pages

**Analytics/monitoring:**

- **Risk:** Losing observability if DSNs/keys not updated
- **Mitigation:** Update DSNs and alert routes with the rebrand; keep old projects for fallback
- **Rollback:** Point env vars back to previous project keys

**Client storage/caches:**

- **Risk:** Stale localStorage/cookies/service-worker caches keyed to WorkSquared causing mixed sessions
- **Mitigation:** Rename keys/cache names and bump versions; prompt logout/login if needed
- **Rollback:** Clear client storage via versioned cache names or forced logout

### Low Risk Changes

**Documentation updates:**

- **Risk:** Minimal, doesn't affect functionality
- **Mitigation:** Review for accuracy
- **Rollback:** Not needed, or simple content updates

**Display names and branding:**

- **Risk:** User-facing only, no functional impact
- **Mitigation:** Consistent naming
- **Rollback:** Not needed

---

## Success Criteria

- [ ] All package names updated to `@lifebuild/*`
- [ ] All domain references updated to `lifebuild.me`
- [ ] All Cloudflare resources deployed with new names
- [ ] Application runs successfully at `app.lifebuild.me`
- [ ] PostHog proxy served from lifebuild subdomain and web env `VITE_PUBLIC_POSTHOG_HOST` updated
- [ ] All tests pass (`lint-all`, `test`, `test:e2e`)
- [ ] Documentation is consistent and accurate
- [ ] No broken links or references
- [ ] Data migration completed if chosen, or intentionally skipped for fresh start
- [ ] Redirects configured from old domain
- [ ] Zero user-facing bugs related to rebrand

---

## Appendix: Complete File List

### Configuration Files (Critical)

1. `package.json` (root)
2. `packages/web/package.json`
3. `packages/worker/package.json`
4. `packages/auth-worker/package.json`
5. `packages/shared/package.json`
6. `packages/server/package.json`
7. `packages/posthog-worker/package.json`
8. `packages/worker/wrangler.jsonc`
9. `packages/auth-worker/wrangler.toml`
10. `packages/posthog-worker/wrangler.toml`
11. `packages/server/render.yaml`
12. `.github/workflows/deploy.yml`
13. `.github/workflows/ci.yml`
14. `.gitignore`
    - Also review: `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `turbo.json` (if present), `.changeset/config.json` (if present), root `tsconfig.json`, and package-level `tsconfig.json` files for alias updates.

### HTML & Branding

15. `packages/web/index.html`
16. `packages/web/public/_headers`
17. `packages/web/public/manifest.json` (if exists)
    - Plus: `packages/web/public/robots.txt`, `packages/web/public/sitemap.xml` (or marketing-site equivalents) for domains/canonicals.

### Documentation (Primary)

18. `README.md`
19. `CONTRIBUTING.md`
20. `CLAUDE.md`
21. `docs/architecture.md`
22. `docs/deployment.md`
23. `docs/README.md`

### Documentation (Package READMEs)

24. `packages/web/README.md`
25. `packages/worker/README.md`
26. `packages/auth-worker/README.md`
27. `packages/posthog-worker/README.md`
28. `packages/server/README.md`
29. `packages/shared/README.md`
30. `packages/shared/src/auth/README.md`

### Environment Files

31. `packages/web/.env.example`
32. `packages/worker/.dev.vars.example`
33. `packages/auth-worker/.dev.vars.example`
34. `packages/server/.env.example`
35. `packages/server/.env.production` (handle carefully)

### Source Files (146+ files with imports)

36-181. `packages/web/src/**/*.tsx` (100+ files)
182-201. `packages/server/src/**/*.ts` (20+ files)
202-231. `packages/*/test/**/*.test.ts` (30+ test files)
232-241. `packages/*/**/*.stories.tsx` (Storybook files)

### Planning Documents (Selective updates)

242-261. Various files in `docs/plans/` (20+ files)

---

## Contact & Questions

For questions about this rebranding plan, contact:

- **Technical Lead:** [Name]
- **Product Owner:** [Name]
- **DevOps:** [Name]

---

**Document Version:** 1.0
**Last Updated:** 2025-12-06
**Status:** Planning Phase
