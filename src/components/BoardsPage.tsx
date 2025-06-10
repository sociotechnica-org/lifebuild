import { useQuery, useStore } from '@livestore/react'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { getBoards$ } from '../livestore/queries.js'
import type { Board } from '../livestore/schema.js'
import { seedSampleBoards } from '../util/seed-data.js'
import { BoardCard } from './BoardCard.js'

export const BoardsPage: React.FC = () => {
  const { store } = useStore()
  const navigate = useNavigate()
  const boards = useQuery(getBoards$) ?? []
  const hasSeededRef = React.useRef(false)

  // Seed sample data if no boards exist (dev only)
  React.useEffect(() => {
    if (boards.length === 0 && !hasSeededRef.current) {
      hasSeededRef.current = true
      seedSampleBoards(store)
    }
  }, [boards.length, store])

  const handleBoardClick = (board: Board) => {
    navigate(`/board/${board.id}`)
  }

  if (boards.length === 0) {
    return (
      <div className='min-h-screen bg-gray-50 p-8'>
        <div className='max-w-7xl mx-auto'>
          <h1 className='text-3xl font-bold text-gray-900 mb-8'>Kanban Boards</h1>
          <div className='flex flex-col items-center justify-center py-12'>
            <div className='text-center'>
              <h2 className='text-xl font-semibold text-gray-600 mb-4'>No boards found</h2>
              <p className='text-gray-500 mb-6'>
                Create your first kanban board to get started with project management.
              </p>
              <button className='bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors'>
                Create Board
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex justify-between items-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Kanban Boards</h1>
          <button className='bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors'>
            Create Board
          </button>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
          {boards.map(board => (
            <BoardCard key={board.id} board={board} onClick={() => handleBoardClick(board)} />
          ))}
        </div>
      </div>
    </div>
  )
}
