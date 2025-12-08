#!/bin/bash
set -e  # Exit on any error

echo "🏗️ Starting LifeBuild server build..."

# Store the initial directory
INITIAL_DIR=$(pwd)
echo "📍 Running from: $INITIAL_DIR"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build better-sqlite3 native bindings for production
echo "🔨 Building better-sqlite3 native bindings..."
# Find the actual better-sqlite3 directory dynamically
SQLITE_DIR=$(find node_modules/.pnpm -name "better-sqlite3" -type d -path "*node_modules/better-sqlite3" | head -1)
if [ -z "$SQLITE_DIR" ]; then
    echo "❌ Could not find better-sqlite3 in node_modules"
    exit 1
fi
echo "📍 Found better-sqlite3 at: $SQLITE_DIR"
cd "$SQLITE_DIR"
npm run build-release
cd "$INITIAL_DIR"

# Copy the built bindings to where the server will look for them
echo "📋 Copying bindings to server runtime location..."
# Extract the version directory name from SQLITE_DIR
SQLITE_VERSION_DIR=$(echo "$SQLITE_DIR" | grep -o "better-sqlite3@[^/]*")
# Ensure the directory exists
mkdir -p "$INITIAL_DIR/packages/server/node_modules/.pnpm/$SQLITE_VERSION_DIR/node_modules/better-sqlite3/build/Release"
# Copy the built binary
cp "$SQLITE_DIR/build/Release/better_sqlite3.node" "$INITIAL_DIR/packages/server/node_modules/.pnpm/$SQLITE_VERSION_DIR/node_modules/better-sqlite3/build/Release/" || true
echo "📍 Copied bindings to: packages/server/node_modules/.pnpm/$SQLITE_VERSION_DIR/node_modules/better-sqlite3/build/Release/"

# Also try to create a symlink to the monorepo's node_modules if needed
if [ ! -e "$INITIAL_DIR/packages/server/node_modules" ]; then
    echo "🔗 Creating symlink to monorepo node_modules..."
    ln -s "$INITIAL_DIR/node_modules" "$INITIAL_DIR/packages/server/node_modules" || true
fi

# Build the server
echo "🚀 Building server..."
pnpm --filter @lifebuild/server build

echo "✅ Build complete!"