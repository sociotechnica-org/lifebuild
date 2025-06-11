import { queryDb } from '@livestore/livestore'

import { tables } from './schema.js'

export const app$ = queryDb(tables.uiState.get(), { label: 'app' })

export const getBoards$ = queryDb(
  _get => {
    return tables.boards.select().where({
      deletedAt: undefined,
    })
  },
  { label: 'getBoards' }
)

export const getBoardColumns$ = (boardId: string) =>
  queryDb(
    tables.columns
      .select()
      .where({ boardId })
      .orderBy([{ col: 'position', direction: 'asc' }]),
    {
      label: `getBoardColumns:${boardId}`,
    }
  )

export const getBoardTasks$ = (boardId: string) =>
  queryDb(
    tables.tasks
      .select()
      .where({ boardId })
      .orderBy([{ col: 'position', direction: 'asc' }]),
    {
      label: `getBoardTasks:${boardId}`,
    }
  )
