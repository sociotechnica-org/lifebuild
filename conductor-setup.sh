#!/bin/bash

# Conductor setup script for Work Squared
# This script copies environment files from the root repo to the new worktree

set -e  # Exit on any error

echo "🚀 Setting up Work Squared worktree environment..."

# Check if we're in a worktree (CONDUCTOR_ROOT_PATH should be set)
if [ -z "$CONDUCTOR_ROOT_PATH" ]; then
    echo "❌ Error: CONDUCTOR_ROOT_PATH not set. This script should be run by Conductor."
    exit 1
fi

# Function to copy file if it exists in root repo
copy_env_file() {
    local src_file="$1"
    local dest_file="$2"
    local root_file="$CONDUCTOR_ROOT_PATH/$src_file"
    
    if [ -f "$root_file" ]; then
        mkdir -p "$(dirname "$dest_file")"
        cp "$root_file" "$dest_file"
        echo "✅ Copied $src_file"
    else
        echo "⚠️  Warning: $src_file not found in root repo"
    fi
}

# Copy environment files from root repo to worktree
echo "📁 Copying environment files from root repo..."

# Root .env and .dev.vars files
copy_env_file ".env" ".env"
copy_env_file ".dev.vars" ".dev.vars"

# Package-specific environment files
copy_env_file "packages/web/.env" "packages/web/.env"
copy_env_file "packages/server/.env" "packages/server/.env"
copy_env_file "packages/worker/.dev.vars" "packages/worker/.dev.vars"
copy_env_file "packages/auth-worker/.dev.vars" "packages/auth-worker/.dev.vars"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

echo "✨ Worktree setup complete!"
echo ""
echo "🔧 Next steps:"
echo "   - Review copied environment files and update if needed"
echo "   - Run 'pnpm dev' to start development"
echo "   - Run 'pnpm lint-all && pnpm test' to verify setup"