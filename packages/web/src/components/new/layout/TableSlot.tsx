import React from 'react'

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

  return (
    <div className={`new-ui-table-slot ${stream}`}>
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
    </div>
  )
}
