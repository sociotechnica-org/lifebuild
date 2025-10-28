#!/bin/bash
# Conductor setup script for Work Squared
# This script sets up a new worktree environment with proper configuration

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

# Update STORE_IDS in packages/server/.env to match branch name
echo "🔧 Updating STORE_IDS to match branch name..."
BRANCH_NAME=$(git branch --show-current)
if [ -f "packages/server/.env" ]; then
    # Replace STORE_IDS line with branch-specific value
    # Use | as delimiter instead of / to handle branch names with slashes
    sed -i.bak "s|^STORE_IDS=.*|STORE_IDS=${BRANCH_NAME}|" packages/server/.env
    rm packages/server/.env.bak
    echo "✅ Set STORE_IDS=${BRANCH_NAME}"
else
    echo "⚠️  Warning: packages/server/.env not found, skipping STORE_IDS update"
fi

# Create test user on auth server
echo "👤 Creating test user..."

# Start auth-worker in background
echo "   Starting auth-worker..."
cd packages/auth-worker
pnpm wrangler dev --port 8788 > /tmp/auth-worker.log 2>&1 &
AUTH_WORKER_PID=$!
cd ../..

# Wait for auth-worker to be ready
echo "   Waiting for auth-worker to start..."
for i in {1..30}; do
    if curl -s http://localhost:8788 > /dev/null 2>&1; then
        echo "   ✅ Auth-worker ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "   ⚠️  Auth-worker failed to start in time"
        kill $AUTH_WORKER_PID 2>/dev/null || true
        break
    fi
    sleep 1
done

# Create user via signup endpoint
if kill -0 $AUTH_WORKER_PID 2>/dev/null; then
    echo "   Creating user account..."
    SIGNUP_RESPONSE=$(curl -s -X POST http://localhost:8788/signup \
        -H "Content-Type: application/json" \
        -d '{"email":"jessmartin+tester@gmail.com","password":"testing123"}')

    if echo "$SIGNUP_RESPONSE" | grep -q '"success":true'; then
        echo "   ✅ Test user created: jessmartin+tester@gmail.com"
    else
        # Check if user already exists
        if echo "$SIGNUP_RESPONSE" | grep -q "already exists"; then
            echo "   ℹ️  Test user already exists: jessmartin+tester@gmail.com"
        else
            echo "   ⚠️  Failed to create test user: $SIGNUP_RESPONSE"
        fi
    fi

    # Stop auth-worker
    kill $AUTH_WORKER_PID 2>/dev/null || true
    sleep 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install
pnpm exec playwright install

echo "✨ Worktree setup complete!"
echo ""
echo "🔧 Configuration summary:"
echo "   - Branch: $BRANCH_NAME"
echo "   - STORE_IDS: $BRANCH_NAME"
echo "   - Test user: jessmartin+tester@gmail.com / testing123"
echo ""
echo "🚀 Next steps:"
echo "   - Run 'pnpm dev' to start development"
echo "   - Run 'pnpm lint-all && pnpm test' to verify setup"
