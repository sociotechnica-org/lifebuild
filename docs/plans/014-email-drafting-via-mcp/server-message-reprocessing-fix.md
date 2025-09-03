# Server Message Reprocessing Fix

## Problem

When the server starts up with existing stores that contain chat messages, it attempts to reprocess all existing user messages. This happens because:

1. On startup, the server subscribes to the `chatMessages` table
2. LiveStore immediately calls the subscription callback with ALL existing records
3. The server has no memory of which messages were already processed
4. All existing user messages get sent to the LLM for processing again

## Current Behavior

The server tries to avoid this by tracking message counts:
- On first subscription, it sets `lastSeenCounts` to the current count
- Only processes messages when count increases

However, this doesn't fully prevent reprocessing on server restarts.

## Solution

Pre-populate a Set of processed message IDs on startup to track which messages have already been handled.

### Implementation

1. Add `processedMessageIds: Set<string>` to `StoreProcessingState`
2. On store subscription, query all existing user message IDs and add them to the Set
3. Before processing any message, check if it's already in the Set
4. Add new messages to the Set as they're processed

### Trade-offs

**Accepted:**
- Messages sent while the server is down will be missed
- Messages sent during server restart/deployment will be missed
- Messages sent during the brief startup period will be missed

**Benefits:**
- Simple and reliable solution
- Prevents duplicate LLM calls and costs
- No need for persistent state storage
- Easy to implement and maintain

## Code Changes

### 1. Update StoreProcessingState interface
Add `processedMessageIds` to track which messages have been processed.

### 2. Pre-populate on startup
In `subscribeToStore` method, query existing user messages and populate the Set.

### 3. Check before processing
In `handleTableUpdate`, skip messages that are already in the Set.

## Testing

1. Start server with existing stores containing chat messages
2. Verify no reprocessing of existing messages
3. Send new message and verify it gets processed
4. Restart server and verify no reprocessing

## Future Improvements

If we need to avoid missing messages during downtime:
1. Store last processed timestamp persistently (database or file)
2. On startup, process messages newer than last timestamp
3. Implement queue-based processing with acknowledgments
4. Use event sourcing with persistent event log position

For now, the simple Set-based approach is sufficient given the accepted trade-offs.