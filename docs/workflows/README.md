# Changelog Automation Workflows

These GitHub Actions workflow files need to be installed manually because they require `workflows` permission that the GitHub App doesn't have.

## Installation

1. Copy both workflow files to `.github/workflows/`:

```bash
cp docs/workflows/changelog-check.yml .github/workflows/
cp docs/workflows/update-changelog.yml .github/workflows/
```

2. Commit and push with your Git credentials:

```bash
git add .github/workflows/changelog-check.yml .github/workflows/update-changelog.yml
git commit -m "Add GitHub Actions for changelog automation"
git push
```

## Required Setup

### For `update-changelog.yml`

This workflow pushes changelog entries to the `lifebuild-site` repository when PRs are merged.

1. **Create a Personal Access Token (PAT)**:
   - Go to GitHub Settings > Developer settings > Personal access tokens > Fine-grained tokens
   - Create a token with write access to `sociotechnica-org/lifebuild-site`
   - Required permissions: `Contents: Read and write`

2. **Add the secret to work-squared**:
   - Go to Repository Settings > Secrets and variables > Actions
   - Create a new secret named `LIFEBUILD_SITE_PAT` with the PAT value

3. **Prepare the lifebuild-site repository**:
   - Create directory: `src/content/changelog/`
   - Create file: `src/data/version.json` with initial content:
     ```json
     {
       "version": "0.1.0",
       "lastUpdated": "2024-01-01"
     }
     ```

## Workflow Descriptions

### `changelog-check.yml`

Runs on every PR to validate:

- PR description contains a `## Changelog` section
- At least one bullet point entry exists
- Entries start with a capital letter (action verb format)

### `update-changelog.yml`

Runs when a PR is merged:

- Extracts changelog entries from PR description
- If there are user-facing changes:
  - Bumps the patch version in `packages/web/package.json`
  - Commits the version bump
- Creates a changelog entry file in `lifebuild-site`
- Updates `version.json` in `lifebuild-site`
