## Summary

Implements a versioning and changelog system for LifeBuild:

- Version tracking starting at 0.1.0
- PR template requiring changelog entries
- GitHub Actions for validation and automation
- Version display in console and Settings page

## Changelog

- Add version display in browser console with ASCII art logo on page load
- Add version number and changelog link to Settings page

## Test Plan

- Run `pnpm dev` and check browser console for ASCII art logo and version
- Navigate to Settings page and verify version appears at bottom with changelog link

## Post-Merge Setup Required

### 1. Install the GitHub Actions workflows

The workflow files are in `docs/workflows/` because pushing to `.github/workflows/` requires special permissions.

```bash
cp docs/workflows/*.yml .github/workflows/
git add .github/workflows/
git commit -m "Activate changelog automation workflows"
git push
```

### 2. Create the `LIFEBUILD_SITE_PAT` secret

The `update-changelog.yml` workflow needs a token to push to the lifebuild-site repo:

1. Create a Fine-grained PAT at GitHub Settings > Developer settings > Personal access tokens
2. Grant `Contents: Read and write` permission for `sociotechnica-org/lifebuild-site`
3. Add as repository secret named `LIFEBUILD_SITE_PAT` in work-squared settings

### 3. Prepare the lifebuild-site repository

Create these files/directories:

- `src/content/changelog/` (directory for changelog entries)
- `src/data/version.json`:
  ```json
  {
    "version": "0.1.0",
    "lastUpdated": "2024-01-01"
  }
  ```

## How It Works

1. **PR Template**: All PRs now have a Changelog section that must be filled out
2. **Changelog Check**: GitHub Action validates the changelog format on PRs
3. **Version Bump**: When PR merges with user-facing changes, patch version increments automatically
4. **Changelog Update**: Entries are pushed to lifebuild-site for display at https://lifebuild.me/updates
