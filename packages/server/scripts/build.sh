#!/bin/bash
set -e  # Exit on any error

echo "🏗️ Starting Work Squared server build..."

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
cd -

# Build the server
echo "🚀 Building server..."
pnpm --filter @work-squared/server build

echo "✅ Build complete!"