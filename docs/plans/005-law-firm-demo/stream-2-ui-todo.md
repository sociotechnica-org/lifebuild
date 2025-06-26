# Stream 2: UI/UX Adaptation Todo

**Owner**: Claude Code #1
**Parent Plan**: [Law Firm Demo Plan](./law-firm-demo-plan.md)

This document outlines the tasks for adapting the UI/UX for a chat-first experience for the Virtual Danvers Advisor demo.

## Must Have

### 1. Fix Chat UI ✅ COMPLETED

**Goal**: Resolve the issue where the global navigation pushes the chat textarea off-screen.

- [x] **Identify**: Inspected the CSS affecting `ChatInterface.tsx` and the main `Layout.tsx`.
- [x] **Fix**: Constrained ChatInterface to fixed width (w-96) in Layout component and removed w-full to prevent blocking main content.
- [x] **Test**: Verified the fix works correctly, chat input remains visible and accessible.

### 2. Session Routing ✅ COMPLETED

**Goal**: Implement the `/session/[id]` URL structure.

- [x] **Library**: Using `react-router-dom` for routing.
- [x] **Routes (`src/Root.tsx`)**:
  - [x] Created route for `/session/:sessionId` that renders the main chat application component.
  - [x] Created root route `/` that handles session restoration, checks `localStorage` for `sessionId` and redirects appropriately.
  - [x] Created route for `/session/:sessionId/admin` that renders the full, original UI (Kanban, etc.) for inspecting session state.
  - [x] Components extract `sessionId` from URL parameters and use stable storeId for LiveStore connection.
- [x] **State**: SessionId is managed through localStorage and React Context (`SessionContext`).

### 3. Chat-First Interface ⚠️ NEEDS REVERSION

**Goal**: Hide non-essential UI elements on the main session route, making chat the primary focus.

- [x] **Conditional Rendering**: Created `ChatOnlyLayout` component for session routes that hides project/document navigation.
- [x] **Admin View**: The `/session/:sessionId/admin` route renders the original full-featured interface as an "inspector" view.
- [x] **Focus**: The main view at `/session/:sessionId` renders the `ChatInterface.tsx` component as the primary element with clean, focused UI.

**Reversion Needed**: The chat-first interface work needs to be reverted. The original Projects List page with Projects and Tasks tabs and persistent chat sidebar on the right should be restored instead of the nested "/admin" page structure.

## Should Have

### 1. Session Sharing UI ✅ COMPLETED

**Goal**: Add a "Copy Session URL" button and a "New Session" button.

- [x] **Component**: Add buttons to the `ChatInterface.tsx` component, likely in the header or near the input area.
- [x] **New Session Button**: Add a "Start New Session" button. This will clear the `sessionId` from `localStorage` and navigate the user to `/` to create a fresh session.
- [x] **Copy URL Functionality**: The "Copy Session URL" button should use the `navigator.clipboard.writeText()` API to copy the current `window.location.href` to the user's clipboard.
- [x] **Feedback**: Provide user feedback, such as changing the button text to "Copied!" for a few seconds or showing a small snackbar notification.

**Final State**: Session sharing functionality was implemented successfully. The storeId is saved to localStorage and properly restored from URL parameters, making session persistence work correctly.

### 2. Mobile Optimization ✅ COMPLETED

**Goal**: Ensure the chat interface is responsive and usable on mobile devices.

- [x] **CSS**: Use Tailwind CSS's responsive prefixes (`sm:`, `md:`, etc.) to adjust font sizes, padding, and layout for smaller screens.
- [x] **Viewport**: Ensure the viewport meta tag is correctly set in `index.html` for proper scaling.
- [x] **Testing**: Use browser developer tools to simulate various mobile devices (iPhone, Android) and test for usability. Pay attention to the on-screen keyboard behavior.

**Final State**: Mobile fixes were implemented to ensure the chat interface works well on mobile devices.

### 3. Light Branding ❌ NOT COMPLETED

**Goal**: Add WorkSquared branding to the currently unbranded application.

- [ ] **Logo**: Add a WorkSquared logo to the application header.
- [ ] **Colors**: Update the color scheme in `tailwind.config.js` to match WorkSquared's brand colors, if applicable.
- [ ] **Favicon**: Update the favicon in `index.html` to the WorkSquared logo.

**Final State**: Light branding was not implemented as the demo was ultimately not needed.
