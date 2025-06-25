# Stream 2: UI/UX Adaptation Todo

**Owner**: Claude Code #1
**Parent Plan**: [Law Firm Demo Plan](./law-firm-demo-plan.md)

This document outlines the tasks for adapting the UI/UX for a chat-first experience for the Virtual Danvers Advisor demo.

## Must Have

### 1. Fix Chat UI

**Goal**: Resolve the issue where the global navigation pushes the chat textarea off-screen.

- [ ] **Identify**: Inspect the CSS affecting `ChatInterface.tsx` and the main `Layout.tsx`.
- [ ] **Fix**: Adjust the flexbox, grid, or positioning properties to ensure the chat input is always visible. This likely involves setting a `flex-shrink: 0` on the input container and allowing the message list to be the scrollable element.
- [ ] **Test**: Verify the fix on Chrome, Firefox, and Safari, and on various screen sizes, including mobile.

### 2. Session Routing

**Goal**: Implement the `/session/[id]` URL structure.

- [ ] **Library**: Use `react-router-dom` for routing.
- [ ] **Routes (`src/Root.tsx`)**:
  - [ ] Create a route for `/session/:sessionId` that renders the main chat application component.
  - [ ] Create a root route `/` that handles session restoration. It should check `localStorage` for a `sessionId`. If one exists, it redirects to `/session/[sessionId]`. Otherwise, it generates a new UUID and navigates to `/session/[new_uuid]`.
  - [ ] Create a route for `/session/:sessionId/admin` that renders the full, original UI (Kanban, etc.) for inspecting the state of that specific session.
  - [ ] The component at `/session/:sessionId` should extract the `sessionId` from the URL parameters and use it to initialize the LiveStore connection.
- [ ] **State**: Ensure the `sessionId` is passed down to all components that need it, possibly via a React Context.

### 3. Chat-First Interface

**Goal**: Hide non-essential UI elements on the main session route, making chat the primary focus.

- [ ] **Conditional Rendering**: Modify `Layout.tsx` or other top-level components to hide the project/document navigation and Kanban boards on the `/session/:sessionId` route.
- [ ] **Admin View**: The `/session/:sessionId/admin` route will render the original full-featured interface, providing an "inspector" view for the session.
- [ ] **Focus**: The main view at `/session/:sessionId` should render the `ChatInterface.tsx` component as the most prominent element.

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
