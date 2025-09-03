#!/bin/bash
set -e  # Exit on any error

echo "🏗️ Starting Work Squared server build..."

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build better-sqlite3 native bindings for production
echo "🔨 Building better-sqlite3 native bindings..."
cd node_modules/.pnpm/better-sqlite3@11.10.0/node_modules/better-sqlite3
npm run build-release
cd -

# Build the server
echo "🚀 Building server..."
pnpm --filter @work-squared/server build

echo "✅ Build complete!"