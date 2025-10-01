# Master Plan for Making Work Squared use LiveStore more effectively

- [i] Fix Storybook tests to work with LiveStore
- [i] Make commit calls synchronous
  - Add a linting warning for async commit calls
  - Have Claude Code check for these lint warnings and clean them up
- [i] Add an eslint rule to drop `as any` casts
  - Have Claude Code check for these lint warnings and clean them up
- [ ] Application initialization should work when offline, not just because of a "wait 5 seconds" rule
- [ ] How to handle side effects and once-and-only execution
- [ ] Move off of node-adapter to a Cloudflare Worker set up
