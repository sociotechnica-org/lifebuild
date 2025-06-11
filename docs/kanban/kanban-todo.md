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
- [x] DoD: Cards can be reordered within and across columns with persistence.

---

## 🍰 Story 4.5 – Advanced drag-and-drop positioning

**User story**: _As a manager, I want precise control over card positioning when dragging between other cards, with smooth visual feedback._

### Tasks

- Animation: Cards shift up when a card is dragged out of a column
- Animation: Bottom cards slide down when a card is dropped between two other cards
- Position calculation: Support inserting cards at specific positions within the same column
- Visual feedback: Show insertion indicator line when hovering between cards
- Event optimization: Recalculate positions for all affected cards in source/target columns
- Tests: Animation behavior, precise positioning logic, within-column reordering
- DoD: Dragging creates smooth animations and allows precise positioning anywhere in any column.

---

## 🍰 Story 5 – Edit a card's title & description

**GitHub Issue**: [#9](https://github.com/sociotechnica-org/work-squared/issues/9)

**User story**: _As a manager, I want to change the title and description of a card._

### Tasks

- Event: `task.updated` `{ taskId, updates }`
- UI: Re-use `TaskModal` in edit mode (opens on card click)
- Validation: Title cannot be empty
- Tests: Modal pre-populates data, save emits event, optimistic update
- DoD: Editing fields updates card in realtime and persists.

---

## 🍰 Story 6 – Assign a teammate to a card

**GitHub Issue**: [#10](https://github.com/sociotechnica-org/work-squared/issues/10)

**User story**: _As a manager, I want to assign someone to a card._

### Tasks

- Schema: Add `assigneeId?` to `tasks`; add `users` table minimal `{ id, name, avatarUrl }`
- Event: extend `task.updated` to include `assigneeId`
- UI: Assignee dropdown in `TaskModal` powered by `Combobox` component
- Seed: Mock users list in dev
- Tests: Selecting assignee updates task; avatar chip shows on `TaskCard`
- DoD: Cards display assignee avatar; assignment persists.

---

## 🍰 Story 7 – Comment on a card

**GitHub Issue**: [#11](https://github.com/sociotechnica-org/work-squared/issues/11)

**User story**: _As a manager, I want to comment on a card._

### Tasks

- Schema: New `comments` table `{ id, taskId, authorId, content, createdAt }`
- Events: `comment.added`, `comment.edited`, `comment.deleted`
- UI: Comments panel inside `TaskModal` with list & composer
- Tests: Add comment renders in list; events materialize correctly
- DoD: Comments visible in modal and survive reload.

---

## 🍰 Story 8 – Set a due date for a card

**GitHub Issue**: [#12](https://github.com/sociotechnica-org/work-squared/issues/12)

**User story**: _As a manager, I want to set the due date for a card._

### Tasks

- Schema: Add `dueDate?` (ISO string) to `tasks`
- Event: `task.updated` handles `dueDate`
- UI: DatePicker component in `TaskModal`; show colored badge on `TaskCard` when overdue
- Tests: Date picker emits correct event; overdue styling logic unit tested
- DoD: Due date visibly reflected and saved.

---

## 🍰 Story 9 – Archive a card

**GitHub Issue**: [#13](https://github.com/sociotechnica-org/work-squared/issues/13)

**User story**: _As a manager, I want to archive a card._

### Tasks

- Event: `task.archived` (instead of hard delete)
- Schema: Add `archivedAt?` to `tasks`; queries exclude archived by default
- UI: "Archive" button in `TaskModal` > "More actions" dropdown; undo snackbar
- Tests: Archiving hides card; undo within 5 s restores
- DoD: Archived cards disappear from board, still retrievable via future "Archive" view.

---

### General Implementation Guidelines

1. Ship each story behind a feature flag if needed.
2. Maintain >80 % unit test coverage per slice.
3. Update README & design docs after each story.
4. Use LiveStore migrations to evolve schema safely.
