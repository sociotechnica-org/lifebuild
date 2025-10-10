# Plan: Fix duplicate user messages sent to server LLM processor

## Summary

- LLM agent running on the server currently receives every user chat message twice, leading to duplicate reasoning chains and redundant tool execution.
- Root cause: the agentic loop is initialized with a conversation history that already contains the newest user message, and the loop immediately appends the same message again before calling the provider. This results in duplicated user turns being sent to the LLM.
- Goal: ensure each user turn appears exactly once in the outbound history by adjusting history construction, covering the behavior with tests, and adding safeguards that detect regressions.

## Current Behavior & Findings

1. When a new user chat message arrives, `EventProcessor.runAgenticLoop` loads the full ordered chat history for that conversation and converts it to `LLMMessage` entries before instantiating the `AgenticLoop` (`event-processor.ts` lines 772-889). The most recent user message (the one currently being processed) is included in this history.
2. Inside `AgenticLoop.run`, the implementation unconditionally pushes the user input onto the `ConversationHistory` prior to the first Braintrust call (`agentic-loop.ts` lines 36-70). Because the same message was already part of `initialHistory`, the history now contains two identical user turns, and both copies are sent to the provider on every iteration.
3. The duplication explains the observed "double inputs" without requiring duplicate LiveStore events; processed-message tracking continues to work as designed, so only the outbound payload is affected.

## Proposed Changes

1. **Build a pre-LLM history that excludes the live user message.**
   - When `runAgenticLoop` builds `chatHistory`, slice off the trailing entry when it matches the message currently being processed (by `id`).
   - Generate `rawHistory` and sanitize it from this trimmed list so the `AgenticLoop` starts with past turns only.
2. **Cover with automated tests.**
   - Extend or add a unit test around the agentic loop (e.g., a focused test that feeds a fake history and asserts the provider receives the correct sequence) to ensure only one copy of the latest user turn is emitted.
   - Consider adding a regression test in `event-processor` (using spies/mocks) that verifies a single `LLMMessage` per user input is passed into the provider.
3. **Add lightweight instrumentation to detect future regressions.**
   - Emit a debug log (or optional metric) when duplicate consecutive user messages are detected in the constructed history before calling the provider; guard it so it does not spam logs, but it will help catch similar issues in the future.
4. **Document the invariant.**
   - Update inline comments near the history construction call site to clarify why the current message is intentionally excluded.

## Testing Strategy

- Unit tests for the agentic loop history handling.
- Event processor tests exercising `runAgenticLoop` with mocked Braintrust provider to confirm single delivery.
- Smoke verification in development environment by sending a user message and inspecting logs/Braintrust payload (manual sanity check after automated tests pass).

## Risks & Mitigations

- **Risk:** Accidentally trimming non-user messages if ordering assumptions break. _Mitigation:_ Guard the slice with both `id` match and `role === 'user'` check, and cover with tests featuring assistant/tool messages after the user turn.
- **Risk:** Future refactors to conversation history might reintroduce duplicates. _Mitigation:_ Keep the regression test in place and add the proposed instrumentation.

## Open Questions

- Do we need to backfill or clean up any past LLM outputs that were generated from duplicated inputs? (Likely out of scope for this fix, but worth confirming with stakeholders.)
