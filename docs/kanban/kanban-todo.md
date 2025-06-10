# Work Squared Kanban Implementation Todo — User-Story Slices

> Purpose: Build the Kanban feature incrementally, one tiny user story at a time. Each slice delivers user-visible value and introduces only the minimal supporting infrastructure.

---

## 🍰 Story 1 – View list of Kanban boards

**User story**: _As a manager, I want to view a list of kanban boards for projects._

### Tasks

- Events: `board.created`, `board.renamed`, `board.deleted` (define in `src/livestore/events.ts`)
- Schema: Add `boards` table `{ id, name, createdAt, updatedAt }` in `src/livestore/schema.ts`
- Query: `queries.getBoards` → returns all boards ordered by `updatedAt DESC`
- Seed: Create default sample board in a migration script (dev only)
- UI: `BoardsPage.tsx` + `BoardCard.tsx` with grid layout
- Routing: `/boards` page registered in router
- Tests: unit tests for materialization, component snapshot, storybook story
- Definition of Done: Visiting `/boards` shows existing boards and empty-state message when none exist.

---

## 🍰 Story 2 – View a Kanban board with task columns

**User story**: _As a manager, I want to view a kanban board for a project with tasks in various states (Todo, Doing, In Review, Done)._

### Tasks

- Events: `column.created`, `column.renamed`, `column.reordered`
- Schema: Add `columns` table `{ id, boardId, name, position }` and `tasks` table minimal subset `{ id, boardId, columnId, title }`
- Query: `queries.getBoardColumnsAndTasks(boardId)`
- UI: `KanbanBoard.tsx` container → maps columns to `KanbanColumn.tsx` which maps tasks to `TaskCard.tsx`
- Styling: Tailwind columns with horizontal scroll fallback
- Tests: Column & task rendering, LiveStore query returns expected order
- DoD: Selecting a board from `/boards/:id` renders four default columns with seeded tasks.

---

## 🍰 Story 3 – Create a new task card

**User story**: _As a manager, I want to create a new card._

### Tasks

- Event: `task.created`
- Schema: extend `tasks` with `description?` and timestamp fields
- UI: "➕ Add Card" button in each column opens `TaskModal.tsx` (title required, description optional)
- Dispatch: Modal dispatches `task.created` → optimistic UI update
- Tests: Modal validation, event emission, LiveStore materialization
- DoD: Creating a card instantly appears in chosen column and persists on reload.

---

## 🍰 Story 4 – Move a card via drag-and-drop

**User story**: _As a manager, I want to move a card from one state to another by dragging-and-dropping._

### Tasks

- Event: `task.moved` `{ taskId, fromColumnId, toColumnId, position }`
- UI: Integrate `@dnd-kit` (lightweight, accessible) into `KanbanBoard`
- State update: On drag end, dispatch `task.moved` and optimistically update positions
- Query: Ensure tasks query orders by `position`
- Tests: dnd interaction test with RTL & `@dnd-kit/test-utils`
- DoD: Cards can be reordered within and across columns with persistence.

---

## 🍰 Story 5 – Edit a card's title & description

**User story**: _As a manager, I want to change the title and description of a card._

### Tasks

- Event: `task.updated` `{ taskId, updates }`
- UI: Re-use `TaskModal` in edit mode (opens on card click)
- Validation: Title cannot be empty
- Tests: Modal pre-populates data, save emits event, optimistic update
- DoD: Editing fields updates card in realtime and persists.

---

## 🍰 Story 6 – Assign a teammate to a card

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

**User story**: _As a manager, I want to comment on a card._

### Tasks

- Schema: New `comments` table `{ id, taskId, authorId, content, createdAt }`
- Events: `comment.added`, `comment.edited`, `comment.deleted`
- UI: Comments panel inside `TaskModal` with list & composer
- Tests: Add comment renders in list; events materialize correctly
- DoD: Comments visible in modal and survive reload.

---

## 🍰 Story 8 – Set a due date for a card

**User story**: _As a manager, I want to set the due date for a card._

### Tasks

- Schema: Add `dueDate?` (ISO string) to `tasks`
- Event: `task.updated` handles `dueDate`
- UI: DatePicker component in `TaskModal`; show colored badge on `TaskCard` when overdue
- Tests: Date picker emits correct event; overdue styling logic unit tested
- DoD: Due date visibly reflected and saved.

---

## 🍰 Story 9 – Archive a card

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
