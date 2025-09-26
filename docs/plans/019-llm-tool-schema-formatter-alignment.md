# Plan 019: LLM Tool Schema & Formatter Alignment

## Goal
Bring the LLM-facing tool schemas in `packages/server/src/tools/schemas.ts` back in sync with their actual behavior and formatter outputs so assistants receive precise affordances, use the right parameters, and interpret tool responses consistently.

## Key Findings

### Task tools (`packages/server/src/tools/schemas.ts`, `packages/server/src/tools/tasks.ts`, `packages/server/src/services/agentic-loop/tool-formatters/task-formatter.ts`)
- `create_task` still uses legacy "board" terminology (`boardId`, `boardName`) even though the underlying API deals exclusively in projects; the formatter echoes the same mismatch. Allowing both `boardId` and `columnId` to be omitted forces accidental defaults to the first project/column, which is rarely desirable. Inputs mix singular (`assigneeId`) and plural (`assigneeIds`) conventions.
- `move_task` only works for non-orphaned tasks (`moveTaskCore` throws on `!task.projectId`), but the schema description implies any column move is allowed. It also hides the implicit requirement that `toColumnId` belongs to the task's current project.
- `move_task_to_project` accepts `toProjectId` as optional, relying on `getOrphanedColumns$` when absent. Neither the schema description nor formatter messaging explain when to omit `toProjectId` or how to select an orphan column.
- Query tools (`get_project_tasks`, `get_orphaned_tasks`, `get_task_by_id`) return raw IDs without column metadata; the formatter repeats those IDs verbatim, so the LLM has no friendly names to work with.

### Project tools (`packages/server/src/tools/projects.ts`, `packages/server/src/services/agentic-loop/tool-formatters/project-formatter.ts`)
- `create_project` silently provisions the default Kanban columns (`DEFAULT_KANBAN_COLUMNS`), but the schema description never mentions that side effect. The formatter highlights it, so schema/formatter messaging diverge.
- `get_project_details` returns document and task counts, yet the description only promises "detailed information". Being explicit would help the LLM decide whether this tool satisfies reporting requests.

### Document tools (`packages/server/src/tools/documents.ts`, `packages/server/src/services/agentic-loop/tool-formatters/document-formatter.ts`)
- `search_project_documents` marks `projectId` optional even though the description states "within a specific project". When omitted the implementation searches across all documents, potentially surprising the LLM.
- Formatter outputs surface `new Date(...).toLocaleDateString()` results; there is no guarantee of locale consistency, which might impede deterministic parsing.

### Contact & worker tools
- Contact tools lack a dedicated formatter, so most responses fall back to raw JSON dumps. That makes it harder for the assistant to read summaries, and the schema descriptions do not warn about large payloads (e.g., `validate_email_list`).
- Worker formatter messages depend on fields (e.g., `result.worker.systemPrompt`) that are not documented anywhere, and some tool results (`deactivate_worker`) only expose a boolean `success`/`message`, which the schema descriptions should convey.

### Cross-cutting
- Result payloads and formatter expectations are implicit. There is no shared contract describing what fields a tool must return for its formatter, making regressions easy.
- Naming drift (`board` vs `project`, singular vs plural IDs) and optional parameters that trigger hidden defaults are the main sources of LLM confusion the team has observed.

## Recommended Changes

1. **Standardize task terminology and inputs**
   - Rename `boardId` → `projectId` across schemas, types, implementations, and formatters, keeping an alias only if absolutely necessary for backward compatibility.
   - Require explicit `projectId` (and likely `columnId`) in `create_task`; document that the first-column fallback is temporary until deprecation.
   - Switch `assigneeId` to `assigneeIds` for task creation so new tasks mirror the update API.
   - Rename `move_task` → `move_task_within_project` (or similar) to encode its scope, and tighten the description to warn about orphaned tasks and column ownership.

2. **Clarify cross-project moves and orphan handling**
   - Update `move_task_to_project` schema text to spell out when to omit `toProjectId`, how to select orphan columns, and the validation performed (`getOrphanedColumns$`).
   - Consider splitting orphaning into an explicit `orphan_task` helper if we want the LLM to avoid juggling column IDs for that edge case.

3. **Align schema descriptions with runtime side effects**
   - Expand `create_project` and `get_project_details` descriptions to match formatter messaging (default columns, counts returned).
   - Fix `search_project_documents` to either require `projectId` or advertise the "all projects" fallback; document locale considerations for date formatting if we keep `toLocaleDateString()`.

4. **Document and validate formatter contracts**
   - Create shared TypeScript interfaces (e.g., `TaskFormatterResult`) used by both tool implementations and formatters so missing fields surface at compile time.
   - Add assertions/tests that formatter-required fields are present in tool responses, especially for task creation/moves.

5. **Improve formatter coverage and output fidelity**
   - Add a `ContactToolFormatter` and extend task/document formatters to surface human-readable column/project names by enriching query results.
   - Normalize date formatting (e.g., ISO strings) before formatting so downstream parsing is deterministic.

6. **Documentation & migration**
   - Update `docs/llm-tools.md` and any MCP integration docs after schema updates so external consumers know about renamed inputs and stricter requirements.
   - Provide migration guidance (breaking changes, tooling updates) and implement tests plus `pnpm lint-all`/`pnpm test` to guard the refactor.

## Open Questions
- Do we need temporary backward-compatible aliases (`boardId`, `move_task`) for existing agent prompts, or can we cut over immediately once documentation is updated?
- Should orphaned task handling become its own tool for clarity, or stay as `move_task_to_project` behavior?
- Are there downstream systems relying on locale-specific dates from the document formatter that would break if we standardize to ISO strings?
