import React from 'react'
import { useNavigate } from 'react-router-dom'
import { generateRoute } from '../../constants/routes.js'

export type SystemWizardStage = 1 | 2 | 3

interface SystemStageWizardProps {
  /** The system ID for navigation */
  systemId: string
  /** Currently active stage being viewed */
  currentStage: SystemWizardStage
  /** Maximum stage the user can navigate to (based on data completeness) */
  maxAccessibleStage: SystemWizardStage
}

const STAGES: { stage: SystemWizardStage; label: string }[] = [
  { stage: 1, label: 'Identify' },
  { stage: 2, label: 'Scope' },
  { stage: 3, label: 'Detail' },
]

export const SystemStageWizard: React.FC<SystemStageWizardProps> = ({
  systemId,
  currentStage,
  maxAccessibleStage,
}) => {
  const navigate = useNavigate()

  const handleStageClick = (stage: SystemWizardStage) => {
    if (stage > maxAccessibleStage) return // Can't navigate to inaccessible stages
    if (!systemId) return // Can't navigate without a system ID (unsaved new system)

    switch (stage) {
      case 1:
        navigate(generateRoute.systemStage1(systemId))
        break
      case 2:
        navigate(generateRoute.systemStage2(systemId))
        break
      case 3:
        navigate(generateRoute.systemStage3(systemId))
        break
    }
  }

  return (
    <div className='my-4'>
      <div className='flex items-center justify-center gap-0'>
        {STAGES.map(({ stage, label }, index) => {
          const isActive = stage === currentStage
          const isAccessible = stage <= maxAccessibleStage && !!systemId
          const isCompleted = stage < currentStage

          return (
            <React.Fragment key={stage}>
              {/* Connector line (before each dot except first) */}
              {index > 0 && (
                <div
                  className={`h-0.5 w-12 transition-colors duration-200 ${
                    stage <= currentStage ? 'bg-[#2f2b27]' : 'bg-[#e8e4de]'
                  }`}
                />
              )}

              {/* Stage dot */}
              <button
                type='button'
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 text-xs font-semibold ${
                  isActive
                    ? 'bg-[#2f2b27] border-[#2f2b27] text-[#faf9f7] cursor-pointer'
                    : isCompleted
                      ? 'bg-[#2f2b27] border-[#2f2b27] text-[#faf9f7] cursor-pointer'
                      : isAccessible
                        ? 'bg-white border-[#d0ccc5] text-[#2f2b27] cursor-pointer hover:border-[#2f2b27]'
                        : 'bg-[#f1efe9] border-[#e8e4de] text-[#8b8680] cursor-not-allowed'
                }`}
                onClick={() => handleStageClick(stage)}
                disabled={!isAccessible}
                title={
                  !systemId
                    ? `Save this system to navigate stages`
                    : isAccessible
                      ? label
                      : `Complete earlier stages to unlock ${label}`
                }
              >
                {isCompleted ? (
                  <svg
                    className='w-4 h-4'
                    viewBox='0 0 16 16'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                  >
                    <path d='M3 8l4 4 6-7' strokeLinecap='round' strokeLinejoin='round' />
                  </svg>
                ) : (
                  <span>{stage}</span>
                )}
              </button>
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
