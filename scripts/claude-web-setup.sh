#!/bin/bash
# Claude Code on the Web setup script for Work Squared
# This script runs as a SessionStart hook to configure the environment

set -e  # Exit on any error

echo "🚀 Setting up Work Squared environment for Claude Code on the web..."

# Only run in remote (web) environments
if [ "$CLAUDE_CODE_REMOTE" != "true" ]; then
  echo "ℹ️  Running locally, skipping web-specific setup"
  exit 0
fi

# Function to create env file if it doesn't exist
create_env_file_if_missing() {
    local dest_file="$1"
    local example_file="$2"

    if [ ! -f "$dest_file" ]; then
        if [ -f "$example_file" ]; then
            mkdir -p "$(dirname "$dest_file")"
            cp "$example_file" "$dest_file"
            echo "✅ Created $dest_file from example"
        else
            echo "⚠️  Warning: $example_file not found"
        fi
    else
        echo "ℹ️  $dest_file already exists"
    fi
}

# Create environment files from examples if they don't exist
echo "📁 Setting up environment files..."

create_env_file_if_missing "packages/web/.env" "packages/web/.env.example"
create_env_file_if_missing "packages/server/.env" "packages/server/.env.example"
create_env_file_if_missing "packages/worker/.dev.vars" "packages/worker/.dev.vars.example"
create_env_file_if_missing "packages/auth-worker/.dev.vars" "packages/auth-worker/.dev.vars.example"

# Helper function to safely update a config value
# Uses a temp file approach instead of sed to avoid escaping issues
update_config_value() {
    local file="$1"
    local key="$2"
    local value="$3"

    if [ -f "$file" ]; then
        # Use grep -v to remove the old line, then append the new one
        grep -v "^${key}=" "$file" > "${file}.tmp" || true
        echo "${key}=${value}" >> "${file}.tmp"
        mv "${file}.tmp" "$file"
    fi
}

# Helper function to check if a value is a placeholder
is_placeholder() {
    local value="$1"

    # Check if value is empty
    if [ -z "$value" ]; then
        return 0  # true - empty is a placeholder
    fi

    # Check for exact matches to known placeholder values from .example files
    case "$value" in
        "workspace-123,workspace-456,workspace-789"|"workspace-123,workspace-456"|"workspace-123")
            return 0  # true - matches example STORE_IDS
            ;;
        "dev-jwt-secret-change-me-in-production")
            return 0  # true - matches example JWT_SECRET
            ;;
        "dev-server-bypass-token-change-me")
            return 0  # true - matches example SERVER_BYPASS_TOKEN
            ;;
        *)
            # Check for generic placeholder patterns
            if [[ "$value" =~ (change-me|your-.*-here|placeholder|example-) ]]; then
                return 0  # true - contains placeholder pattern
            fi
            ;;
    esac

    return 1  # false - not a placeholder
}

# Set consistent JWT secrets for dev environment
# These are not real secrets - just internal dev values that need to match across services
echo "🔑 Configuring JWT secrets for development..."
DEV_JWT_SECRET="claude-web-dev-jwt-secret-$(date +%s)"
DEV_BYPASS_TOKEN="claude-web-dev-bypass-token-$(date +%s)"

# Update worker .dev.vars with secrets (only if placeholders)
if [ -f "packages/worker/.dev.vars" ]; then
    CURRENT_JWT=$(grep "^JWT_SECRET=" packages/worker/.dev.vars 2>/dev/null | cut -d'=' -f2- || echo "")
    CURRENT_BYPASS=$(grep "^SERVER_BYPASS_TOKEN=" packages/worker/.dev.vars 2>/dev/null | cut -d'=' -f2- || echo "")

    if is_placeholder "$CURRENT_JWT"; then
        update_config_value "packages/worker/.dev.vars" "JWT_SECRET" "${DEV_JWT_SECRET}"
        echo "✅ Updated worker JWT_SECRET (was placeholder)"
    fi

    if is_placeholder "$CURRENT_BYPASS"; then
        update_config_value "packages/worker/.dev.vars" "SERVER_BYPASS_TOKEN" "${DEV_BYPASS_TOKEN}"
        echo "✅ Updated worker SERVER_BYPASS_TOKEN (was placeholder)"
    fi
fi

# Update auth-worker .dev.vars with matching secrets (only if placeholders)
if [ -f "packages/auth-worker/.dev.vars" ]; then
    CURRENT_JWT=$(grep "^JWT_SECRET=" packages/auth-worker/.dev.vars 2>/dev/null | cut -d'=' -f2- || echo "")
    CURRENT_BYPASS=$(grep "^SERVER_BYPASS_TOKEN=" packages/auth-worker/.dev.vars 2>/dev/null | cut -d'=' -f2- || echo "")

    if is_placeholder "$CURRENT_JWT"; then
        update_config_value "packages/auth-worker/.dev.vars" "JWT_SECRET" "${DEV_JWT_SECRET}"
        echo "✅ Updated auth-worker JWT_SECRET (was placeholder)"
    fi

    if is_placeholder "$CURRENT_BYPASS"; then
        update_config_value "packages/auth-worker/.dev.vars" "SERVER_BYPASS_TOKEN" "${DEV_BYPASS_TOKEN}"
        echo "✅ Updated auth-worker SERVER_BYPASS_TOKEN (was placeholder)"
    fi
fi

# Update server .env with matching bypass token (only if placeholder)
if [ -f "packages/server/.env" ]; then
    CURRENT_BYPASS=$(grep "^SERVER_BYPASS_TOKEN=" packages/server/.env 2>/dev/null | cut -d'=' -f2- || echo "")

    if is_placeholder "$CURRENT_BYPASS"; then
        update_config_value "packages/server/.env" "SERVER_BYPASS_TOKEN" "${DEV_BYPASS_TOKEN}"
        echo "✅ Updated server SERVER_BYPASS_TOKEN (was placeholder)"
    fi
fi

# Update STORE_IDS in packages/server/.env to match branch name if it exists
echo "🔧 Updating STORE_IDS to match branch name..."

# Get branch name, handling detached HEAD state
BRANCH_NAME=$(git branch --show-current)
if [ -z "$BRANCH_NAME" ]; then
    # Detached HEAD - use commit SHA as fallback
    BRANCH_NAME="detached-$(git rev-parse --short HEAD)"
    echo "⚠️  Detached HEAD detected, using: $BRANCH_NAME"
fi

if [ -f "packages/server/.env" ]; then
    CURRENT_STORE_IDS=$(grep "^STORE_IDS=" packages/server/.env 2>/dev/null | cut -d'=' -f2- || echo "")

    # Only update if it's a placeholder value
    if is_placeholder "$CURRENT_STORE_IDS"; then
        update_config_value "packages/server/.env" "STORE_IDS" "${BRANCH_NAME}"
        echo "✅ Set STORE_IDS=${BRANCH_NAME} (was placeholder)"
    else
        echo "ℹ️  STORE_IDS already configured, skipping update"
    fi
else
    echo "⚠️  Warning: packages/server/.env not found, skipping STORE_IDS update"
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Install Playwright browsers (for E2E tests)
echo "🎭 Installing Playwright browsers..."
pnpm exec playwright install

# Persist environment variables for subsequent bash commands
# This makes NODE_ENV and branch info available to Claude Code
if [ -n "$CLAUDE_ENV_FILE" ]; then
    echo "export WORK_SQUARED_BRANCH=${BRANCH_NAME}" >> "$CLAUDE_ENV_FILE"
    echo "✅ Persisted WORK_SQUARED_BRANCH environment variable"
fi

echo "✨ Environment setup complete!"
echo ""
echo "🔧 Configuration summary:"
echo "   - Branch: $BRANCH_NAME"
echo "   - STORE_IDS: $BRANCH_NAME"
echo ""
echo "🚀 Environment is ready for Claude Code!"
