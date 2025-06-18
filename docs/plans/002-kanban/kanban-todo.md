# Work Squared Kanban Implementation Todo — User-Story Slices

> Purpose: Build the Kanban feature incrementally, one tiny user story at a time. Each slice delivers user-visible value and introduces only the minimal supporting infrastructure.

---

## ✅ Story 1 – View list of Kanban boards — COMPLETED

**User story**: _As a manager, I want to view a list of kanban boards for projects._

### Tasks — DONE

- [x] Events: `board.created`, `board.renamed`, `board.deleted` (define in `src/livestore/events.ts`)
- [x] Schema: Add `boards` table `{ id, name, createdAt, updatedAt }` in `src/livestore/schema.ts`
- [x] Query: `queries.getBoards` → returns all boards ordered by `updatedAt DESC`
- [x] Seed: Create default sample board in a migration script (dev only)
- [x] UI: `BoardsPage.tsx` + `BoardCard.tsx` with grid layout
- [x] Routing: `/boards` page registered in router
- [x] Tests: unit tests for materialization, component snapshot, storybook story
- [x] Definition of Done: Visiting `/boards` shows existing boards and empty-state message when none exist.

---

## ✅ Story 2 – View a Kanban board with task columns — COMPLETED

**User story**: _As a manager, I want to view a kanban board for a project with tasks in various states (Todo, Doing, In Review, Done)._

### Tasks — DONE

- [x] Events: `column.created`, `column.renamed`, `column.reordered`
- [x] Schema: Add `columns` table `{ id, boardId, name, position }` and `tasks` table minimal subset `{ id, boardId, columnId, title }`
- [x] Query: `queries.getBoardColumns$` and `queries.getBoardTasks$`
- [x] UI: `KanbanBoard.tsx` container → maps columns to `KanbanColumn.tsx` which maps tasks to `TaskCard.tsx`
- [x] Styling: Tailwind columns with horizontal scroll fallback
- [x] Tests: Column & task rendering, LiveStore query returns expected order
- [x] DoD: Selecting a board from `/board/:id` renders four default columns with seeded tasks.

---

## ✅ Story 3 – Create a new task card — COMPLETED

**User story**: _As a manager, I want to create a new card._

### Tasks — DONE

- [x] Event: `task.created` with position field
- [x] Schema: extend `tasks` with `position` field for ordering
- [x] UI: "➕ Add Card" button in each column shows inline form (title required)
- [x] Form: Inline AddTaskForm with Enter to submit, Escape to cancel
- [x] Dispatch: Form dispatches `task.created` → optimistic UI update
- [x] Position: New tasks appear at bottom of column with correct position
- [x] Tests: Form validation, event emission, LiveStore materialization
- [x] DoD: Creating a card instantly appears in chosen column and persists on reload.

---

## ✅ Story 4 – Move a card via drag-and-drop — COMPLETED

**User story**: _As a manager, I want to move a card from one state to another by dragging-and-dropping._

### Tasks — DONE

- [x] Event: `task.moved` `{ taskId, toColumnId, position, updatedAt }`
- [x] UI: Integrate `@dnd-kit` (lightweight, accessible) into `KanbanBoard`
- [x] State update: On drag end, dispatch `task.moved` and optimistically update positions
- [x] Query: Ensure tasks query orders by `position`
- [x] Tests: dnd interaction test with proper @dnd-kit mocking
- [x] Simplified drop targets: Card-only drops with Add Card button for end-of-column
- [x] Visual feedback: Insertion previews and drag overlays
- [x] Empty column support: Drop via Add Card button
- [x] DoD: Cards can be reordered within and across columns with persistence.

### Implementation Notes

- **Drop Targets**: Only task cards and Add Card buttons are droppable (no column backgrounds)
- **Empty Columns**: Drag over Add Card button to drop into empty columns
- **End of Column**: Drag over Add Card button to place tasks at the end
- **Visual Feedback**: Clean insertion previews, no confusing double placeholders
- **Known Issues**: Same-column reordering edge cases documented in [Issue #14](https://github.com/sociotechnica-org/work-squared/issues/14)

---

## 🍰 Story 4.5 – Advanced drag-and-drop positioning

**User story**: _As a manager, I want precise control over card positioning when dragging between other cards, with smooth visual feedback._

**Status**: Partially implemented. Core positioning works, but same-column edge cases remain.

### Tasks

- [x] Position calculation: Support inserting cards at specific positions within the same column
- [x] Visual feedback: Show insertion indicator line when hovering between cards
- [x] Event optimization: Recalculate positions for all affected cards in source/target columns
- [x] Tests: Precise positioning logic, cross-column reordering
- [ ] Same-column reordering: Fix edge cases (see [Issue #14](https://github.com/sociotechnica-org/work-squared/issues/14))
- [ ] Animation: Cards shift up when a card is dragged out of a column  
- [ ] Animation: Bottom cards slide down when a card is dropped between two other cards
- [ ] Tests: Animation behavior, within-column reordering edge cases
- DoD: Dragging creates smooth animations and allows precise positioning anywhere in any column.

---

## 🍰 Story 5 – View a card's details

**GitHub Issue**: [#15](https://github.com/sociotechnica-org/work-squared/issues/15)

**User story**: _As a manager, I want to view a card's details by clicking on it._

### Tasks

- Schema: Extend `tasks` table with `description` field for richer content
- Query: `getTaskById$` for fetching individual task details
- UI: `TaskModal` for displaying card details in overlay (read-only)
- Component: `TaskCard` click handler to open modal
- Layout: Modal shows title, description, column, creation date
- Styling: Clean modal design with backdrop, close button, responsive
- Accessibility: Focus management, escape key, ARIA labels
- Tests: Modal rendering, click handlers, keyboard navigation
- DoD: Clicking any task card opens modal with full details.

### Implementation Notes

- **Foundation for editing**: This modal will be extended for edit functionality in Story 6
- **Reusable design**: Modal designed to accommodate future features (assignees, due dates, comments)
- **Mobile-friendly**: Responsive modal that works on all device sizes

---

## ✅ Story 6 – Edit a card's title & description — COMPLETED

**GitHub Issue**: [#9](https://github.com/sociotechnica-org/work-squared/issues/9)

**User story**: _As a manager, I want to change the title and description of a card._

**Dependencies**: Story 5 (View a card's details) must be completed first.

### Tasks — DONE

- [x] Event: `task.updated` `{ taskId, title?, description?, updatedAt }`
- [x] UI: Extend `TaskModal` with edit mode toggle
- [x] Form: Editable title and description fields with validation
- [x] Save/Cancel: Submit changes or revert to original values
- [x] Optimistic updates: UI updates immediately while sync happens
- [x] Validation: Title cannot be empty, real-time validation
- [x] Tests: Modal mode switching, form validation, event emission, optimistic updates
- [x] DoD: Editing fields updates card in realtime and persists.

### Implementation Notes

- **Edit Mode Toggle**: Click "Edit" button switches between view and edit modes
- **Form Validation**: Title is required with real-time validation and error messages
- **Efficient Updates**: Only changed fields are included in `task.updated` events
- **Keyboard Support**: Escape key cancels editing or closes modal
- **Optimistic UI**: Changes appear immediately while syncing in background

---

## ✅ Story 7 – Assign a teammate to a card — COMPLETED

**GitHub Issue**: [#10](https://github.com/sociotechnica-org/work-squared/issues/10)

**User story**: _As a manager, I want to assign someone to a card._

**Dependencies**: Story 5 (View a card's details) and Story 6 (Edit a card) should be completed first.

### Tasks — DONE

- [x] Schema: Add `assigneeIds` array to `tasks`; add `users` table `{ id, name, avatarUrl, createdAt }`
- [x] Event: extend `task.updated` to include `assigneeIds` array for multi-user assignment
- [x] UI: Multi-select assignee dropdown in `TaskModal` powered by `Combobox` component
- [x] Seed: Mock users list in dev (Alice Johnson, Bob Smith, Carol Davis, David Wilson)
- [x] Tests: Comprehensive test coverage for assignee functionality and edge cases
- [x] DoD: Cards display assignee avatars with initials; multi-assignment persists.

### Implementation Notes

- **Multi-user Support**: Cards can be assigned to multiple users simultaneously
- **Always Available**: Assignee editing works in both view and edit modes with immediate save
- **Visual Design**: Avatar circles with initials displayed on TaskCard (bottom-right, up to 3 + overflow)
- **Accessibility**: Full keyboard navigation, ARIA labels, escape key support
- **Edge Case Handling**: Robust initials generation with fallbacks for malformed names
- **Real-time Sync**: Assignments sync immediately across all connected clients
- **JSON Storage**: assigneeIds stored as JSON array for SQLite compatibility

---

## ✅ Story 8 – Comment on a card — COMPLETED

**GitHub Issue**: [#11](https://github.com/sociotechnica-org/work-squared/issues/11)

**User story**: _As a manager, I want to comment on a card._

**Dependencies**: Story 5 (View a card's details) must be completed first.

### Tasks — DONE

- [x] Schema: New `comments` table `{ id, taskId, authorId, content, createdAt }`
- [x] Events: `comment.added` event for creating comments
- [x] UI: Comments panel inside `TaskModal` with list & composer
- [x] Query: `getTaskComments$` for fetching comments by taskId
- [x] Tests: Comprehensive comment functionality with 10 test cases
- [x] DoD: Comments visible in modal and survive reload.

### Implementation Notes

- **Comment Display**: Comments show in reverse chronological order (newest first)
- **Author Identification**: User avatars with initials and hover tooltips for full names
- **Validation**: Comments have max 5000 character limit and cannot be empty
- **Real-time Updates**: Comments sync immediately across all connected clients
- **Keyboard Support**: Cmd+Enter shortcut to submit comments quickly
- **User Experience**: Character counter and helpful submission hints
- **Security**: Plain text comments with preserved line breaks (whitespace-pre-wrap)
- **Future Enhancement**: Markdown support documented in [Issue #23](https://github.com/sociotechnica-org/work-squared/issues/23)

---

## 🍰 Story 9 – Set a due date for a card

**GitHub Issue**: [#12](https://github.com/sociotechnica-org/work-squared/issues/12)

**User story**: _As a manager, I want to set the due date for a card._

**Dependencies**: Story 5 (View a card's details) must be completed first.

### Tasks

- Schema: Add `dueDate?` (ISO string) to `tasks`
- Event: `task.updated` handles `dueDate`
- UI: DatePicker component in `TaskModal`; show colored badge on `TaskCard` when overdue
- Tests: Date picker emits correct event; overdue styling logic unit tested
- DoD: Due date visibly reflected and saved.

---

## ✅ Story 10 – Archive a card — COMPLETED

**GitHub Issue**: [#13](https://github.com/sociotechnica-org/work-squared/issues/13)

**User story**: _As a manager, I want to archive a card._

**Dependencies**: Story 5 (View a card's details) must be completed first.

### Tasks — DONE

- [x] Event: `task.archived` (instead of hard delete)
- [x] Schema: Add `archivedAt?` to `tasks`; queries exclude archived by default
- [x] UI: "Archive" button in `TaskModal` > "More actions" dropdown; undo snackbar
- [x] Tests: Archiving hides card; undo within 5 s restores
- [x] DoD: Archived cards disappear from board, still retrievable via future "Archive" view.

---

### General Implementation Guidelines

1. Ship each story behind a feature flag if needed.
2. Maintain >80 % unit test coverage per slice.
3. Update README & design docs after each story.
4. Use LiveStore migrations to evolve schema safely.
