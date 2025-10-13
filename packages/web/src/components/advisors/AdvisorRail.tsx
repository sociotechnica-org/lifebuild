import React from 'react'
import { AdvisorAvatar } from './AdvisorAvatar.js'

export interface Advisor {
  id: string
  name: string
  initials: string
  color?: 'blue' | 'teal' | 'purple'
}

export interface AdvisorRailProps {
  advisors: Advisor[]
  selectedAdvisorId?: string | null
  onAdvisorClick: (advisorId: string) => void
}

/**
 * AdvisorRail - Vertical rail of geometric advisor avatars
 *
 * Displays AI advisor characters following the LifeSquared geometric
 * character system. Each advisor is a contemplative guide with
 * elevated thinking posture.
 */
export const AdvisorRail: React.FC<AdvisorRailProps> = ({
  advisors,
  selectedAdvisorId,
  onAdvisorClick,
}) => {
  return (
    <div className='fixed left-6 top-24 flex flex-col gap-6 z-10'>
      {advisors.map(advisor => {
        const isSelected = selectedAdvisorId === advisor.id

        return (
          <button
            key={advisor.id}
            onClick={() => onAdvisorClick(advisor.id)}
            className='focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full'
            title={advisor.name}
          >
            <AdvisorAvatar
              initials={advisor.initials}
              color={advisor.color}
              isSelected={isSelected}
              size='md'
            />
          </button>
        )
      })}
    </div>
  )
}
