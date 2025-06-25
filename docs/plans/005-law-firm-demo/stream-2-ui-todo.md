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

### 3. Chat-First Interface ✅ COMPLETED

**Goal**: Hide non-essential UI elements on the main session route, making chat the primary focus.

- [x] **Conditional Rendering**: Created `ChatOnlyLayout` component for session routes that hides project/document navigation.
- [x] **Admin View**: The `/session/:sessionId/admin` route renders the original full-featured interface as an "inspector" view.
- [x] **Focus**: The main view at `/session/:sessionId` renders the `ChatInterface.tsx` component as the primary element with clean, focused UI.

## Should Have

### 1. Session Sharing UI

**Goal**: Add a "Copy Session URL" button and a "New Session" button.

- [ ] **Component**: Add buttons to the `ChatInterface.tsx` component, likely in the header or near the input area.
- [ ] **New Session Button**: Add a "Start New Session" button. This will clear the `sessionId` from `localStorage` and navigate the user to `/` to create a fresh session.
- [ ] **Copy URL Functionality**: The "Copy Session URL" button should use the `navigator.clipboard.writeText()` API to copy the current `window.location.href` to the user's clipboard.
- [ ] **Feedback**: Provide user feedback, such as changing the button text to "Copied!" for a few seconds or showing a small snackbar notification.

### 2. Mobile Optimization

**Goal**: Ensure the chat interface is responsive and usable on mobile devices.

- [ ] **CSS**: Use Tailwind CSS's responsive prefixes (`sm:`, `md:`, etc.) to adjust font sizes, padding, and layout for smaller screens.
- [ ] **Viewport**: Ensure the viewport meta tag is correctly set in `index.html` for proper scaling.
- [ ] **Testing**: Use browser developer tools to simulate various mobile devices (iPhone, Android) and test for usability. Pay attention to the on-screen keyboard behavior.

### 3. Light Branding

**Goal**: Add WorkSquared branding to the currently unbranded application.

- [ ] **Logo**: Add a WorkSquared logo to the application header.
- [ ] **Colors**: Update the color scheme in `tailwind.config.js` to match WorkSquared's brand colors, if applicable.
- [ ] **Favicon**: Update the favicon in `index.html` to the WorkSquared logo.
