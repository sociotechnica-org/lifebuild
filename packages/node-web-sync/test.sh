#!/bin/bash

echo "🧪 Testing Node/Web Adapter Materializer Hash Mismatch"
echo "========================================================"
echo ""

echo "✅ All commands are working individually:"
echo ""

echo "1. Testing node-monitor (should start successfully):"
timeout 5 pnpm node-monitor &
NODE_PID=$!
sleep 3
if kill -0 $NODE_PID 2>/dev/null; then
    echo "   ✅ Node monitor starts successfully"
    kill $NODE_PID
else
    echo "   ❌ Node monitor failed to start"
fi
echo ""

echo "2. Testing web-client (should start successfully):"
timeout 5 pnpm web-client &
WEB_PID=$!
sleep 3
if kill -0 $WEB_PID 2>/dev/null; then
    echo "   ✅ Web client starts successfully"
    kill $WEB_PID
else
    echo "   ❌ Web client failed to start"
fi
echo ""

echo "📋 Ready for manual testing!"
echo ""
echo "To reproduce the materializer hash mismatch:"
echo "1. Make sure the sync server is running (cd ../worker && pnpm dev)"
echo "2. Start the node monitor: pnpm node-monitor"
echo "3. Start the web client: pnpm web-client"
echo "4. Watch the node monitor - it should shutdown when web client creates events"
echo ""
echo "Expected: Node monitor should receive events from web client"
echo "Actual: Node monitor shuts down with materializer hash mismatch"