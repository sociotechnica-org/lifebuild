# Going Public Plan: Work Squared Repository

## Executive Summary

This plan outlines the steps necessary to safely transition the Work Squared repository from private to public, with a Functional Source License (FSL-1.1-ALv2). The plan addresses security concerns, documentation needs, and repository presentation to ensure professional "curb appeal" for potential users and contributors.

## Critical Security Issues to Address

### 🚨 P0 - Must Fix Before Going Public

1. **Clean Git History - CRITICAL**
   - **Found exposed Braintrust API key in commits**: `sk-z0wNBIkLURT2XB6Xpg201dFuFf87I3anYenpgDUDrw2hcNkz`
   - Exposed in commits: `0f08eff`, `3fa1dc1`, `ff9056f`, `9f7fe61`
   - **Action Required**: Clean history using BFG Repo-Cleaner before going public
   - Command: `bfg --replace-text passwords.txt` (create file with key to remove)
   - Force-push cleaned history

2. **Production Database ID - ACCEPTABLE RISK**
   - File: `packages/worker/wrangler.jsonc`
   - Contains: `database_id: "3e3e5640-b41f-4838-8892-f5362e865e2d"`
   - **Decision**: Keep as-is (requires Cloudflare permissions to access)

3. **Current .env Files - NO ACTION NEEDED**
   - All `.env` and `.dev.vars` files properly gitignored
   - No rotation needed for current credentials

### ✅ P1 - Security Best Practices

4. **Add Security Documentation**
   - Create `SECURITY.md` with vulnerability disclosure process
   - Add security best practices to contributing guide

5. **Environment Variable Documentation**
   - Ensure all `.env.example` files have clear instructions
   - Document which services require API keys
   - Add setup cost expectations (free tier availability)

## Legal & Licensing

### 📄 License Implementation

6. **Add FSL-1.1-ALv2 License**
   - Create `LICENSE` file with FSL-1.1-ALv2 (converts to Apache 2.0 after 4 years)
   - Update all `package.json` files with `"license": "FSL-1.1-ALv2"`
   - No source file headers needed for FSL
   - Consider adding `NOTICE` file for third-party attributions

7. **Contribution Guidelines**
   - Create simple `CONTRIBUTING.md` with:
     - FSL-1.1-ALv2 implications (contributions under same license)
     - No CLA needed initially
     - Development workflow from CLAUDE.md

## Documentation & Curb Appeal

### 📚 Core Documentation

8. **Polish README.md**
   - Add simple W² text logo (or W^2)
   - Add badges (FSL-1.1-ALv2 license, build status)
   - Include "Why Work Squared?" section
   - Add screenshots/GIFs of app.worksquared.ai
   - Brief mention that it's a live demo (signup may be disabled)
   - Link to `/docs/plans/` for transparent development roadmap

9. **Documentation Structure**
   - Keep technical docs in `/docs` (already good structure)
   - Keep plans public in `/docs/plans/` (building in public!)
   - README focused on quick start and overview

10. **Add Missing Documentation**
    - Brief self-hosting guide for Cloudflare deployment
    - Link to existing architecture.md

### 🎨 Repository Presentation

11. **GitHub Repository Settings**
    - Add description and website URL
    - Add topics/tags for discoverability
    - Create issue templates
    - Set up PR template
    - Configure GitHub Actions badges

12. **Demo & Examples**
    - app.worksquared.ai already live ✅
    - Note in README that signup may be disabled
    - Add example use cases in README
    - Quick Start guide already good in README

## Code Quality & Maintenance

### 🔧 Technical Debt

13. **Clean Up Development Artifacts**
    - Keep `/docs/plans/` public (building in public!) ✅
    - Review and clean up TODO comments in code
    - Remove any debug console.logs
    - Clean up commented-out code

14. **Standardize Code Quality**
    - Ensure all tests pass
    - Add CI badges to README
    - Document test coverage goals
    - Fix any existing linting warnings

15. **Dependencies Audit**
    - Run `pnpm audit` and fix vulnerabilities
    - Document minimum Node/pnpm versions
    - Review and update outdated dependencies

## Community Preparation

### 👥 Community Setup

16. **Issue Management**
    - Create a few initial "good first issue" items
    - Set up basic issue templates
    - No formal community needed yet

17. **Communication Channels**
    - GitHub Issues for now
    - No Discord/Discussions needed initially

## Pre-Launch Checklist

### Phase 1: Security & Legal
- [ ] **CRITICAL**: Clean git history with BFG to remove exposed API key
- [ ] Add FSL-1.1-ALv2 license file
- [ ] Update package.json files with license field
- [ ] Create minimal SECURITY.md

### Phase 2: Documentation
- [ ] Add W² logo/branding to README
- [ ] Add FSL-1.1-ALv2 and build badges
- [ ] Add screenshots from app.worksquared.ai
- [ ] Create minimal CONTRIBUTING.md
- [ ] Note that demo signup may be disabled

### Phase 3: Repository Polish
- [ ] Set up basic issue templates
- [ ] Add GitHub repository description and topics
- [ ] Clean up any debug console.logs
- [ ] Ensure tests pass
- [ ] Create 2-3 "good first issues"

### Launch Day
- [ ] Final check for secrets in history
- [ ] Flip repository to public
- [ ] Post announcement if desired

## Clarifications Resolved

✅ **FSL Terms**: FSL-1.1-ALv2 (converts to Apache 2.0 after 4 years)
✅ **Demo**: app.worksquared.ai already live, may disable signup
✅ **Database ID**: Acceptable risk (requires Cloudflare permissions)
✅ **Development Plans**: Keep public (building in public!)
✅ **Community**: No formal community needed initially
✅ **Branding**: Simple W² text logo
✅ **.env secrets**: No rotation needed (properly gitignored)

## Key Action Items

### 🚨 CRITICAL - Must Do Before Going Public

1. **Clean Git History**
   ```bash
   # Create passwords.txt with the exposed key
   echo "sk-z0wNBIkLURT2XB6Xpg201dFuFf87I3anYenpgDUDrw2hcNkz" > passwords.txt
   
   # Run BFG to clean history
   bfg --replace-text passwords.txt
   
   # Clean up and force push
   git reflog expire --expire=now --all && git gc --prune=now --aggressive
   git push --force-with-lease
   ```

2. **Add FSL-1.1-ALv2 License**
   - Create LICENSE file with proper copyright year and name
   - Update all package.json files

3. **Quick README Polish**
   - Add W² branding
   - Add screenshots
   - Note about demo/signup

## Timeline

- **Phase 1**: Security & Legal (Priority 0)
- **Phase 2**: Documentation (Priority 1)  
- **Phase 3**: Polish (Priority 2)

The repository is already in good shape with proper gitignore, clear documentation, and working demo. Main blocker is cleaning the git history to remove the exposed API key.