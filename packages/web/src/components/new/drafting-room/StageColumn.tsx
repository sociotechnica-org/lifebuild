import React from 'react'
import type { PlanningStage } from '@work-squared/shared'

interface StageColumnProps {
  stage: PlanningStage
  stageName: string
  projectCount: number
  emptyMessage: string
  children: React.ReactNode
}

export const StageColumn: React.FC<StageColumnProps> = ({
  stage,
  stageName,
  projectCount,
  emptyMessage,
  children,
}) => {
  const isEmpty = projectCount === 0

  return (
    <div className='stage-column'>
      <div className='stage-column-header'>
        <h2 className='stage-column-title'>{stageName}</h2>
        <span className='stage-column-count'>
          Stage {stage} · {projectCount} project{projectCount !== 1 ? 's' : ''}
        </span>
      </div>
      <div className='stage-column-divider' />
      <div className='stage-column-content'>
        {isEmpty ? (
          <div className='stage-column-empty'>{emptyMessage}</div>
        ) : (
          <div className='stage-column-cards'>{children}</div>
        )}
      </div>
    </div>
  )
}
