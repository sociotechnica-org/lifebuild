import React from 'react'
import { Link } from 'react-router-dom'
import { generateRoute } from '../../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../../utils/navigation.js'

export type Stream = 'gold' | 'silver' | 'bronze'

export type TableSlotProps = {
  stream: Stream
  projectId?: string
  projectName?: string
  projectMeta?: string
  progress?: number
  bronzeCount?: number
}

const streamColors = {
  gold: '#d8a650',
  silver: '#c5ced8',
  bronze: '#c48b5a',
}

const getSlotClassName = (stream: Stream): string => {
  const baseClasses =
    'border border-[#e8e4de] rounded-[0.9rem] p-3 bg-white min-h-[110px] relative overflow-hidden'
  const streamClasses = {
    gold: 'border-[rgba(216,166,80,0.6)] bg-gradient-to-br from-[rgba(216,166,80,0.12)] to-white',
    silver:
      'border-[rgba(197,206,216,0.7)] bg-gradient-to-br from-[rgba(197,206,216,0.14)] to-white',
    bronze: 'border-[rgba(196,139,90,0.7)] bg-gradient-to-br from-[rgba(196,139,90,0.12)] to-white',
  }
  return `${baseClasses} ${streamClasses[stream]}`
}

/**
 * TableSlot component - Represents a single slot in The Table (Gold, Silver, or Bronze).
 * Shows the current project in that stream with progress indication.
 * All slots with a project are clickable and navigate to the project detail page.
 */
export const TableSlot: React.FC<TableSlotProps> = ({
  stream,
  projectId,
  projectName,
  projectMeta,
  progress,
  bronzeCount,
}) => {
  const streamLabels = {
    gold: 'Initiative',
    silver: 'Optimization',
    bronze: 'To-Do',
  }

  const isEmpty = !projectId && !projectName
  const isClickable = !!projectId

  const slotContent = (
    <>
      <h4 className="font-['Source_Serif_4',Georgia,serif] text-base mb-1 flex items-center gap-1.5">
        {streamLabels[stream]}
      </h4>
      {isEmpty ? (
        <div className='text-[#8b8680] text-sm'>Empty</div>
      ) : (
        <>
          <div className='font-bold text-[#2f2b27]'>{projectName}</div>
          {projectMeta && <div className='text-[#8b8680] text-sm'>{projectMeta}</div>}
          {stream === 'bronze' && bronzeCount !== undefined && bronzeCount > 0 && (
            <div className='text-[#8b8680] text-sm'>+{bronzeCount} more</div>
          )}
          {progress !== undefined && progress >= 0 && stream !== 'bronze' && (
            <div className='h-2 bg-[#f1efe9] rounded-full overflow-hidden mt-1'>
              <div
                className='h-full rounded-full'
                style={{
                  width: `${Math.round(progress * 100)}%`,
                  background: streamColors[stream],
                }}
              />
            </div>
          )}
        </>
      )}
    </>
  )

  if (isClickable) {
    return (
      <Link
        to={preserveStoreIdInUrl(generateRoute.project(projectId))}
        className={`${getSlotClassName(stream)} no-underline text-inherit cursor-pointer block`}
      >
        {slotContent}
      </Link>
    )
  }

  return <div className={getSlotClassName(stream)}>{slotContent}</div>
}
