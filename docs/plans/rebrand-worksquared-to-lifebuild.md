# Rebranding Plan: WorkSquared → LifeBuild

**New Domain:** lifebuild.me
**Status:** Planning
**Last Updated:** 2025-10-21

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
- **Infrastructure resources:** 7 (workers, databases, buckets)
- **Domain changes:** 4+ URLs

### Key Changes

| Category | Old | New |
|----------|-----|-----|
| **Product Name** | Work Squared | LifeBuild |
| **Package Scope** | @work-squared/* | @lifebuild/* |
| **Primary Domain** | worksquared.ai | lifebuild.me |
| **App Domain** | app.worksquared.ai | app.lifebuild.me |
| **Sync Worker** | work-squared.jessmartin.workers.dev | lifebuild.jessmartin.workers.dev |
| **Auth Worker** | work-squared-auth.jessmartin.workers.dev | lifebuild-auth.jessmartin.workers.dev |
| **D1 Database** | work-squared-prod | lifebuild-prod |
| **R2 Bucket (prod)** | work-squared-images | lifebuild-images |
| **R2 Bucket (dev)** | work-squared-images-preview | lifebuild-images-preview |

---

## Phase 1: Critical Infrastructure (Affects Deployment)

### 1.1 Cloudflare Workers Configuration

#### packages/worker/wrangler.jsonc

**Changes required:**

```jsonc
{
  // Line 2: Worker name
  "name": "work-squared" → "lifebuild"

  // Line 18: D1 database binding
  "database_name": "work-squared-prod" → "lifebuild-prod"

  // Line 48: R2 bucket binding
  "bucket_name": "work-squared-images" → "lifebuild-images"

  // Line 49: R2 preview bucket binding
  "preview_bucket_name": "work-squared-images-preview" → "lifebuild-images-preview"
}
```

**Impact:** Changes worker deployment name and database/storage bindings

---

#### packages/auth-worker/wrangler.toml

**Changes required:**

```toml
# Line 1: Worker name
name = "work-squared-auth" → "lifebuild-auth"

# Line 11: Script name (in routes section)
script_name = "work-squared-auth" → "lifebuild-auth"
```

**Impact:** Changes auth worker deployment name

---

### 1.2 Server Deployment Configuration

#### packages/server/render.yaml

**Changes required:**

```yaml
# Line 3: Service name
name: work-squared-server → lifebuild-server

# Line 21: WebSocket URL environment variable
value: wss://app.worksquared.ai → wss://app.lifebuild.me

# Line 57: Database name
name: work-squared-data → lifebuild-data
```

**Impact:** Changes Render.com service and database names

---

### 1.3 GitHub Workflows

#### .github/workflows/deploy.yml

**Changes required:**

- **Package filter commands** (Lines 31, 35, 42, 46):
  - `--filter @work-squared/auth-worker` → `--filter @lifebuild/auth-worker`
  - `--filter @work-squared/worker` → `--filter @lifebuild/worker`
  - `--filter @work-squared/web` → `--filter @lifebuild/web`

- **Environment variables** (Lines 51-52, 69-71):
  - `VITE_AUTH_WORKER_URL: https://work-squared-auth.jessmartin.workers.dev`
    → `VITE_AUTH_WORKER_URL: https://lifebuild-auth.jessmartin.workers.dev`
  - `VITE_LIVESTORE_SYNC_URL: https://work-squared.jessmartin.workers.dev`
    → `VITE_LIVESTORE_SYNC_URL: https://lifebuild.jessmartin.workers.dev`
  - `VITE_BASE_URL: https://app.worksquared.ai`
    → `VITE_BASE_URL: https://app.lifebuild.me`

**Impact:** Changes CI/CD deployment process

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

**Total:** 6 package.json files

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
# Find all TypeScript/TSX files with @work-squared imports
find packages -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/@work-squared\//@lifebuild\//g' {} +
```

---

## Phase 3: Domain & URL References

### 3.1 Production Domain Updates

**Old domains:**

- `worksquared.ai`
- `app.worksquared.ai`
- `work-squared.jessmartin.workers.dev`
- `work-squared-auth.jessmartin.workers.dev`

**New domains:**

- `lifebuild.me`
- `app.lifebuild.me`
- `lifebuild.jessmartin.workers.dev` (or custom domain)
- `lifebuild-auth.jessmartin.workers.dev` (or custom domain)

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

#### packages/web/public/_headers

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

### 3.3 Git Configuration

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

**Decision needed:** Are we renaming the GitHub repository?

---

## Phase 4: Configuration & Environment Files

### 4.1 Environment Example Files

#### packages/web/.env.example

**Review and update:**

- Any URL references to local or production domains
- Comments mentioning WorkSquared

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

### 4.2 Other Configuration Files

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

**Decision needed:** Which planning docs should be updated vs. archived?

---

## Phase 6: Branding Assets

### 6.1 Logo & Images

**Current:**

- Logo URL: `https://worksquared.ai/worksquared-logo.png` (external)

**Action items:**

1. Create new LifeBuild logo
2. Decide logo location:
   - Host on lifebuild.me domain
   - Store in repo: `docs/images/lifebuild-logo.png`
3. Update README.md reference

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

---

## Phase 7: Cloudflare Infrastructure Migration

### 7.1 Cloudflare Resources to Create

#### D1 Database

**Action items:**

1. Create new database: `lifebuild-prod`
2. Run migrations on new database
3. **Data migration:** Export from `work-squared-prod` and import to `lifebuild-prod`
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
3. **Data migration:** Copy images from old buckets to new buckets
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
2. Update custom domains/routes if applicable
3. Test new workers before switching traffic

**Commands:**

```bash
# Deploy auth worker
pnpm --filter @lifebuild/auth-worker deploy

# Deploy sync worker
pnpm --filter @lifebuild/worker deploy
```

---

### 7.2 DNS Configuration

**New domains to configure:**

1. **lifebuild.me** - Main marketing site
   - Type: A/CNAME records
   - Points to: TBD (hosting provider)

2. **app.lifebuild.me** - Web application
   - Type: CNAME
   - Points to: Cloudflare Pages domain

3. **Optional:** Custom worker domains (instead of *.workers.dev)
   - `sync.lifebuild.me` → sync worker
   - `auth.lifebuild.me` → auth worker

**Action items:**

1. Purchase/configure lifebuild.me domain
2. Set up DNS records in Cloudflare
3. Configure SSL certificates
4. Set up redirects from worksquared.ai → lifebuild.me

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

### 7.4 Migration Timeline

**Recommended approach:**

1. **Parallel deployment:** Deploy new infrastructure alongside old
2. **Testing phase:** Test new deployment thoroughly
3. **Traffic switch:** Update DNS to point to new infrastructure
4. **Monitoring:** Watch for errors after switch
5. **Cleanup:** Deprecate old infrastructure after stable period

---

## Recommended Execution Order

### Prerequisites (Before Code Changes)

- [ ] Purchase and configure lifebuild.me domain
- [ ] Create new Cloudflare resources (D1, R2, workers)
- [ ] Set up DNS records
- [ ] Create new logo and branding assets
- [ ] Plan data migration strategy

---

### Implementation (Code Changes)

#### Step 1: Create Feature Branch

```bash
git checkout -b rebrand/worksquared-to-lifebuild
```

---

#### Step 2: Package Names & Imports (Bulk Changes)

Execute these changes together for consistency:

1. Update root `package.json`
2. Update all `packages/*/package.json` files (6 files)
3. Global find-replace in source files:
   ```bash
   find packages -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/@work-squared\//@lifebuild\//g' {} +
   ```
4. Run `pnpm install` to update lock files

**Verification:**

```bash
# Check for any remaining @work-squared references
grep -r "@work-squared" packages/ --include="*.ts" --include="*.tsx"
```

---

#### Step 3: Infrastructure Configuration

Update in this order:

1. `packages/worker/wrangler.jsonc`
2. `packages/auth-worker/wrangler.toml`
3. `packages/server/render.yaml`
4. `.github/workflows/deploy.yml`
5. `.github/workflows/ci.yml`

---

#### Step 4: Domain References

1. `README.md`
2. `docs/architecture.md`
3. `docs/deployment.md`
4. `packages/web/public/_headers`
5. `packages/web/src/pages/SignupPage.tsx`
6. `packages/web/src/utils/auth.ts`

---

#### Step 5: HTML & Branding

1. `packages/web/index.html` (title tag)
2. Update favicon files
3. Update manifest.json

---

#### Step 6: Documentation

1. Primary docs (README, CLAUDE.md, CONTRIBUTING.md)
2. Architecture docs
3. Package READMEs (6 files)
4. Review planning docs (selective updates)

---

#### Step 7: Environment Files

1. `.gitignore`
2. `.env.example` files (4 files)
3. Review `.env.production` carefully

---

#### Step 8: Quality Checks

Run all quality checks before committing:

```bash
# Reinstall dependencies with new package names
pnpm install

# Run linting and formatting
pnpm lint-all

# Run unit tests
pnpm test

# Run E2E tests (if possible without deployment)
CI=true pnpm test:e2e
```

---

#### Step 9: Commit & Push

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Rebrand WorkSquared to LifeBuild

- Update all package names from @work-squared/* to @lifebuild/*
- Update domain references from worksquared.ai to lifebuild.me
- Update Cloudflare worker configurations and infrastructure names
- Update all documentation and README files
- Update HTML title and branding assets

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to remote
git push -u origin rebrand/worksquared-to-lifebuild
```

---

#### Step 10: Create Pull Request

```bash
gh pr create --title "Rebrand WorkSquared to LifeBuild" --body "$(cat <<'EOF'
## Summary

Complete rebranding from WorkSquared to LifeBuild, including:

- ✅ Package names: `@work-squared/*` → `@lifebuild/*` (6 packages)
- ✅ Domain references: `worksquared.ai` → `lifebuild.me`
- ✅ Worker configurations: Updated Cloudflare infrastructure names
- ✅ Source code imports: 146+ files updated
- ✅ Documentation: 50+ files updated
- ✅ HTML title and meta tags
- ✅ Environment configuration examples

## Impact

- **Files changed:** 200+
- **No breaking changes to user data or functionality**
- **Requires new Cloudflare infrastructure** (see Phase 7 in plan)

## Testing

- ✅ `pnpm lint-all` - All linting and formatting checks pass
- ✅ `pnpm test` - All unit tests pass
- ⚠️ `pnpm test:e2e` - E2E tests will need updated URLs after deployment

## Deployment Checklist

Before merging and deploying, ensure:

- [ ] New domain `lifebuild.me` is purchased and DNS configured
- [ ] Cloudflare D1 database `lifebuild-prod` created
- [ ] Cloudflare R2 buckets created (`lifebuild-images`, `lifebuild-images-preview`)
- [ ] Data migrated from old database and buckets
- [ ] New logo and branding assets created
- [ ] Environment variables updated in Cloudflare Pages
- [ ] Redirects configured from old domain to new domain

## Rollout Strategy

Recommended approach:

1. Deploy new infrastructure in parallel
2. Test thoroughly on staging/preview
3. Switch DNS to new infrastructure
4. Monitor for issues
5. Deprecate old infrastructure after stable period

## Related Documentation

See `docs/plans/rebrand-worksquared-to-lifebuild.md` for complete rebranding plan.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

### Post-Merge (Deployment)

#### Step 11: Infrastructure Deployment

1. Deploy auth worker:
   ```bash
   pnpm --filter @lifebuild/auth-worker deploy
   ```

2. Deploy sync worker:
   ```bash
   pnpm --filter @lifebuild/worker deploy
   ```

3. Deploy web app to Cloudflare Pages:
   ```bash
   pnpm --filter @lifebuild/web deploy
   ```

4. Verify deployments at new URLs

---

#### Step 12: Data Migration

1. Export data from `work-squared-prod` D1 database
2. Import to `lifebuild-prod` D1 database
3. Copy images from old R2 buckets to new buckets
4. Verify data integrity

---

#### Step 13: DNS Switch

1. Update DNS records to point to new infrastructure
2. Configure SSL certificates
3. Test all endpoints

---

#### Step 14: Monitoring

1. Monitor error rates
2. Check WebSocket connections
3. Verify authentication flows
4. Monitor user feedback

---

#### Step 15: Cleanup (After Stable Period)

1. Set up redirects: `worksquared.ai` → `lifebuild.me`
2. Deprecate old Cloudflare resources (workers, database, buckets)
3. Archive old domain (or redirect indefinitely)

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

# Database/bucket names (in wrangler files)
work-squared-prod → lifebuild-prod
work-squared-images → lifebuild-images
work-squared-default → lifebuild-default

# Domains (in docs and config)
worksquared.ai → lifebuild.me
app.worksquared.ai → app.lifebuild.me
work-squared.jessmartin.workers.dev → lifebuild.jessmartin.workers.dev
work-squared-auth.jessmartin.workers.dev → lifebuild-auth.jessmartin.workers.dev

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

---

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

## Open Questions

1. **GitHub Repository:**
   - Should the repo be renamed from `work-squared` to `lifebuild`?
   - How will this affect existing clones and links?

2. **Logo & Branding:**
   - Who is creating the new LifeBuild logo?
   - What's the timeline for logo/branding assets?

3. **Custom Domains:**
   - Use `*.jessmartin.workers.dev` subdomains or custom domains like `auth.lifebuild.me`?

4. **Planning Docs:**
   - Which historical planning documents should be updated vs. archived?
   - Should we create a `docs/archive/` folder for old branding?

5. **Data Migration:**
   - What's the acceptable downtime window for database migration?
   - Should we do a phased migration or all at once?

6. **User Communication:**
   - How will we notify existing users about the rebrand?
   - Will we maintain worksquared.ai with redirects indefinitely?

7. **Marketing Site:**
   - Is there an existing marketing site at worksquared.ai?
   - What content needs to be created for lifebuild.me?

---

## Estimated Timeline

**Preparation:** 1-2 days

- Domain setup
- Logo creation
- Infrastructure planning

**Implementation:** 1 day

- Code changes
- Testing
- PR review

**Deployment:** 1 day

- Infrastructure creation
- Code deployment
- Data migration
- DNS switch

**Monitoring:** 1 week

- Error monitoring
- User feedback
- Issue resolution

**Total:** ~2 weeks from start to stable

---

## Success Criteria

- [ ] All package names updated to `@lifebuild/*`
- [ ] All domain references updated to `lifebuild.me`
- [ ] All Cloudflare resources deployed with new names
- [ ] Application runs successfully at `app.lifebuild.me`
- [ ] All tests pass (`lint-all`, `test`, `test:e2e`)
- [ ] Documentation is consistent and accurate
- [ ] No broken links or references
- [ ] User data migrated successfully
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
7. `packages/worker/wrangler.jsonc`
8. `packages/auth-worker/wrangler.toml`
9. `packages/server/render.yaml`
10. `.github/workflows/deploy.yml`
11. `.github/workflows/ci.yml`
12. `.gitignore`

### HTML & Branding

13. `packages/web/index.html`
14. `packages/web/public/_headers`
15. `packages/web/public/manifest.json` (if exists)

### Documentation (Primary)

16. `README.md`
17. `CONTRIBUTING.md`
18. `CLAUDE.md`
19. `docs/architecture.md`
20. `docs/deployment.md`
21. `docs/README.md`

### Documentation (Package READMEs)

22. `packages/web/README.md`
23. `packages/worker/README.md`
24. `packages/auth-worker/README.md`
25. `packages/server/README.md`
26. `packages/shared/README.md`
27. `packages/shared/src/auth/README.md`

### Environment Files

28. `packages/web/.env.example`
29. `packages/worker/.dev.vars.example`
30. `packages/auth-worker/.dev.vars.example`
31. `packages/server/.env.example`
32. `packages/server/.env.production` (handle carefully)

### Source Files (146+ files with imports)

33-178. `packages/web/src/**/*.tsx` (100+ files)
179-198. `packages/server/src/**/*.ts` (20+ files)
199-228. `packages/*/test/**/*.test.ts` (30+ test files)
229-238. `packages/*/**/*.stories.tsx` (Storybook files)

### Planning Documents (Selective updates)

239-258. Various files in `docs/plans/` (20+ files)

---

## Contact & Questions

For questions about this rebranding plan, contact:

- **Technical Lead:** [Name]
- **Product Owner:** [Name]
- **DevOps:** [Name]

---

**Document Version:** 1.0
**Last Updated:** 2025-10-21
**Status:** Planning Phase
