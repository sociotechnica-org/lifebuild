import React from 'react'
import type { PlanningStage } from '@work-squared/shared'

interface StageColumnProps {
  stage: PlanningStage
  stageName: string
  projectCount: number
  emptyMessage?: string
  emptyAction?: React.ReactNode
  children: React.ReactNode
}

export const StageColumn: React.FC<StageColumnProps> = ({
  stage,
  stageName,
  projectCount,
  emptyMessage,
  emptyAction,
  children,
}) => {
  const isEmpty = projectCount === 0

  return (
    <div className='bg-white rounded-2xl p-4 border border-[#e8e4de] min-h-[300px]'>
      <div className='flex items-center justify-between mb-2'>
        <h2 className="font-['Source_Serif_4',Georgia,serif] text-xl font-semibold text-[#2f2b27]">
          {stageName}
        </h2>
        <span className='text-xs text-[#8b8680]'>
          Stage {stage} · {projectCount} project{projectCount !== 1 ? 's' : ''}
        </span>
      </div>
      <div className='h-px bg-[#e8e4de] mb-4' />
      <div>
        {isEmpty ? (
          <div className='text-center py-6 text-[#8b8680]'>{emptyAction || emptyMessage}</div>
        ) : (
          <div className='flex flex-col gap-3'>{children}</div>
        )}
      </div>
    </div>
  )
}
