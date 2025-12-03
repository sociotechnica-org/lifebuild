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

/**
 * TableSlot component - Represents a single slot in The Table (Gold, Silver, or Bronze).
 * Shows the current project in that stream with progress indication.
 * Gold and Silver slots are clickable and navigate to the project detail page.
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
    gold: 'Gold',
    silver: 'Silver',
    bronze: 'Bronze',
  }

  const streamColors = {
    gold: 'var(--gold)',
    silver: 'var(--silver)',
    bronze: 'var(--bronze)',
  }

  const isEmpty = !projectId && !projectName
  const isClickable = projectId && (stream === 'gold' || stream === 'silver')

  const slotContent = (
    <>
      <h4>{streamLabels[stream]}</h4>
      {isEmpty ? (
        <div className='meta'>Empty</div>
      ) : (
        <>
          <div className='body'>{projectName}</div>
          {projectMeta && <div className='meta'>{projectMeta}</div>}
          {stream === 'bronze' && bronzeCount !== undefined && bronzeCount > 0 && (
            <div className='meta'>+{bronzeCount} more</div>
          )}
          {progress !== undefined && progress >= 0 && stream !== 'bronze' && (
            <div className='new-ui-project-card progress' style={{ marginTop: '0.4rem' }}>
              <div
                className='bar'
                style={{
                  width: `${Math.round(progress * 100)}%`,
                  background: streamColors[stream],
                }}
              ></div>
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
        className={`new-ui-table-slot ${stream}`}
        style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
      >
        {slotContent}
      </Link>
    )
  }

  return <div className={`new-ui-table-slot ${stream}`}>{slotContent}</div>
}
