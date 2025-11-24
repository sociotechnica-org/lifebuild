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

if [ ! -d "$CONDUCTOR_ROOT_PATH" ]; then
    echo "❌ Error: CONDUCTOR_ROOT_PATH ($CONDUCTOR_ROOT_PATH) does not exist."
    exit 1
fi

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
WORKSPACE_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
ROOT_REPO=$(cd "$CONDUCTOR_ROOT_PATH" && pwd)

cd "$WORKSPACE_ROOT"

AUTH_WORKER_PID=""
AUTH_WORKER_LOG="/tmp/auth-worker.log"
: > "$AUTH_WORKER_LOG"

stop_auth_worker() {
    if [ -n "$AUTH_WORKER_PID" ] && kill -0 "$AUTH_WORKER_PID" 2>/dev/null; then
        kill "$AUTH_WORKER_PID" 2>/dev/null || true
        wait "$AUTH_WORKER_PID" 2>/dev/null || true
    fi
    AUTH_WORKER_PID=""
}

cleanup() {
    stop_auth_worker
}
trap cleanup EXIT

# Function to copy file if it exists in root repo
copy_env_file() {
    local src_file="$1"
    local dest_file="$2"
    local root_file="$ROOT_REPO/$src_file"
    local dest_path="$WORKSPACE_ROOT/$dest_file"

    if [ -f "$root_file" ]; then
        mkdir -p "$(dirname "$dest_path")"
        if [ -e "$dest_path" ] && [ "$root_file" -ef "$dest_path" ] 2>/dev/null; then
            echo "ℹ️  Skipped $src_file (already up to date)"
            return
        fi
        cp "$root_file" "$dest_path"
        echo "✅ Copied $src_file"
    else
        echo "⚠️  Warning: $src_file not found in root repo"
    fi
}

# Helper to ensure env vars are set consistently
set_env_var() {
    local relative_file="$1"
    local key="$2"
    local value="$3"
    local file="$relative_file"

    if [[ "$file" != /* ]]; then
        file="$WORKSPACE_ROOT/$file"
    fi

    if [ ! -f "$file" ]; then
        echo "⚠️  Warning: $file not found, cannot set $key"
        return
    fi

    if grep -q "^${key}=" "$file"; then
        sed -i.bak "s|^${key}=.*|${key}=${value}|" "$file" && rm "${file}.bak"
    else
        echo "${key}=${value}" >> "$file"
    fi
    echo "✅ Set ${key}=${value} in ${relative_file}"
}

STORE_ID_REGEX='^[a-zA-Z0-9][a-zA-Z0-9-_]{2,63}$'
DEFAULT_STORE_ID="workspace-dev"

is_valid_store_id() {
    local value="$1"
    if [[ -z "$value" ]]; then
        return 1
    fi
    if [[ "$value" =~ $STORE_ID_REGEX ]]; then
        return 0
    fi
    return 1
}

sanitize_branch_name_for_store_id() {
    local raw="$1"
    local sanitized="${raw//[^a-zA-Z0-9-_]/-}"

    while [[ -n "$sanitized" && ! "$sanitized" =~ ^[a-zA-Z0-9] ]]; do
        sanitized="${sanitized:1}"
    done

    if [ -z "$sanitized" ]; then
        echo "$DEFAULT_STORE_ID"
        return
    fi

    sanitized="${sanitized:0:64}"

    while [ ${#sanitized} -lt 3 ]; do
        sanitized="${sanitized}x"
    done

    if is_valid_store_id "$sanitized"; then
        echo "$sanitized"
    else
        echo "$DEFAULT_STORE_ID"
    fi
}

start_auth_worker() {
    echo "   Starting auth-worker..."
    pushd "$WORKSPACE_ROOT/packages/auth-worker" >/dev/null
    pnpm exec wrangler dev --port 8788 > "$AUTH_WORKER_LOG" 2>&1 &
    AUTH_WORKER_PID=$!
    popd >/dev/null
}

wait_for_auth_worker() {
    echo "   Waiting for auth-worker to start..."
    for _ in {1..30}; do
        if curl -s http://localhost:8788 > /dev/null 2>&1; then
            echo "   ✅ Auth-worker ready"
            return 0
        fi

        if [ -n "$AUTH_WORKER_PID" ] && ! kill -0 "$AUTH_WORKER_PID" 2>/dev/null; then
            break
        fi

        sleep 1
    done

    echo "   ⚠️  Auth-worker failed to start in time"
    if [ -f "$AUTH_WORKER_LOG" ]; then
        echo "   Last auth-worker logs:"
        tail -n 20 "$AUTH_WORKER_LOG" | sed 's/^/      /'
    fi

    stop_auth_worker
    return 1
}

create_test_user() {
    echo "   Creating user account..."
    if response=$(curl -s -X POST http://localhost:8788/signup \
        -H "Content-Type: application/json" \
        -d '{"email":"jessmartin+tester@gmail.com","password":"testing123"}'); then

        if echo "$response" | grep -q '"success":true'; then
            echo "   ✅ Test user created: jessmartin+tester@gmail.com"
        elif echo "$response" | grep -q "already exists"; then
            echo "   ℹ️  Test user already exists: jessmartin+tester@gmail.com"
        else
            echo "   ⚠️  Failed to create test user: $response"
        fi
    else
        echo "   ⚠️  Failed to reach auth-worker signup endpoint"
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
SANITIZED_STORE_ID=$(sanitize_branch_name_for_store_id "$BRANCH_NAME")
SANITIZED_BRANCH=${BRANCH_NAME//\//-}
SERVER_ENV="$WORKSPACE_ROOT/packages/server/.env"
if [ -f "$SERVER_ENV" ]; then
    # Replace STORE_IDS line with branch-specific value
    # Use | as delimiter instead of / to handle branch names with slashes
    sed -i.bak "s|^STORE_IDS=.*|STORE_IDS=${SANITIZED_STORE_ID}|" "$SERVER_ENV"
    rm "$SERVER_ENV.bak"
    if [ "$SANITIZED_STORE_ID" != "$BRANCH_NAME" ]; then
        echo "✅ Set STORE_IDS=${SANITIZED_STORE_ID} (sanitized from ${BRANCH_NAME})"
    else
        echo "✅ Set STORE_IDS=${SANITIZED_STORE_ID}"
    fi
else
    echo "⚠️  Warning: packages/server/.env not found, skipping STORE_IDS update"
fi

# Ensure server + worker share a stable backend id locally
set_env_var "packages/server/.env" "BACKEND_ID" "${SANITIZED_BRANCH}-backend"
set_env_var "packages/worker/.dev.vars" "BACKEND_ID" "${SANITIZED_BRANCH}-backend"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install
pnpm exec playwright install

# Create test user on auth server
echo "👤 Creating test user..."
if start_auth_worker; then
    if wait_for_auth_worker; then
        create_test_user
    else
        echo "   ⚠️  Skipping test user creation. Check $AUTH_WORKER_LOG for details."
    fi
    stop_auth_worker
else
    echo "   ⚠️  Failed to start auth-worker process"
fi

echo "✨ Worktree setup complete!"
echo ""
echo "🔧 Configuration summary:"
echo "   - Branch: $BRANCH_NAME"
echo "   - STORE_IDS: $SANITIZED_STORE_ID"
echo "   - Test user: jessmartin+tester@gmail.com / testing123"
echo ""
echo "🚀 Next steps:"
echo "   - Run 'pnpm dev' to start development"
echo "   - Run 'pnpm lint-all && pnpm test' to verify setup"
