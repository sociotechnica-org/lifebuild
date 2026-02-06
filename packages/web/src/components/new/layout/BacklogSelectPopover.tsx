import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { generateRoute } from '../../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../../utils/navigation.js'

export type BacklogStream = 'gold' | 'silver'

export interface BacklogItem {
  id: string
  name: string
  meta?: string
}

export interface BacklogSelectPopoverProps {
  stream: BacklogStream
  isOpen: boolean
  onClose: () => void
  onSelect: (id: string) => void
  items: BacklogItem[]
}

const streamColors: Record<BacklogStream, string> = {
  gold: '#d8a650',
  silver: '#c5ced8',
}

const streamLabels: Record<BacklogStream, string> = {
  gold: 'Initiative',
  silver: 'Optimization',
}

/**
 * BacklogSelectPopover - A popover for selecting a backlog project to activate on the Table.
 * Shows available projects for the given stream (Gold or Silver).
 */
export const BacklogSelectPopover: React.FC<BacklogSelectPopoverProps> = ({
  stream,
  isOpen,
  onClose,
  onSelect,
  items,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null)

  // Handle click outside and escape key
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleItemClick = (id: string) => {
    onSelect(id)
    onClose()
  }

  return (
    <div
      ref={popoverRef}
      data-testid='backlog-select-popover'
      className='absolute left-0 right-0 bottom-full mb-2 z-50 bg-white rounded-xl border border-[#e8e4de] shadow-lg overflow-hidden'
      style={{ borderBottomColor: streamColors[stream], borderBottomWidth: '3px' }}
    >
      <div className='px-3 py-2 border-b border-[#e8e4de]'>
        <h5 className='text-sm font-medium text-[#2f2b27]'>
          Add {streamLabels[stream]} from Backlog
        </h5>
      </div>

      {items.length === 0 ? (
        <div className='px-3 py-4 text-center'>
          <p className='text-sm text-[#8b8680] mb-2'>No projects available</p>
          <Link
            to={preserveStoreIdInUrl(generateRoute.projectCreate())}
            className='text-sm text-[#2f2b27] underline hover:no-underline'
            onClick={onClose}
          >
            Create new project
          </Link>
        </div>
      ) : (
        <ul className='max-h-[240px] overflow-y-auto'>
          {items.map(item => (
            <li key={item.id}>
              <button
                type='button'
                onClick={() => handleItemClick(item.id)}
                className='w-full text-left px-3 py-2 hover:bg-[#faf9f7] transition-colors border-l-2 border-transparent hover:border-current'
                style={
                  {
                    '--tw-border-opacity': 1,
                    borderLeftColor: 'transparent',
                  } as React.CSSProperties
                }
                onMouseEnter={e => {
                  e.currentTarget.style.borderLeftColor = streamColors[stream]
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderLeftColor = 'transparent'
                }}
              >
                <div className='font-medium text-[#2f2b27] text-sm'>{item.name}</div>
                {item.meta && <div className='text-xs text-[#8b8680]'>{item.meta}</div>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
