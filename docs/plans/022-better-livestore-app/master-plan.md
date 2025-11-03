# Master Plan for Making Work Squared use LiveStore more effectively

- [x] Fix Storybook tests to work with LiveStore
- [i] Make commit calls synchronous
  - Add a linting warning for async commit calls
  - Have Claude Code check for these lint warnings and clean them up
- [i] Add an eslint rule to drop `as any` casts
  - Have Claude Code check for these lint warnings and clean them up
- [-] Move off of node-adapter to a Cloudflare Worker set up
  - Cloudflare Workers don't have access to a file system, so they don't currently support running the Claude Agent SDK. We'll need to wait for this to be implemented before we can full migrate off of the node-adapter.
- [ ] Application initialization should work when offline, not just because of a "wait 5 seconds" rule

**Waiting on event stream implementation:**

- [ ] How to handle side effects and once-and-only execution
