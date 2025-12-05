import React from 'react'
import { useNavigate } from 'react-router-dom'
import { generateRoute } from '../../../constants/routes.js'

export type WizardStage = 1 | 2 | 3

interface StageWizardProps {
  /** The project ID for navigation */
  projectId: string
  /** Currently active stage being viewed */
  currentStage: WizardStage
  /** Maximum stage the user can navigate to (based on planningStage) */
  maxAccessibleStage: WizardStage
}

const STAGES: { stage: WizardStage; label: string }[] = [
  { stage: 1, label: 'Identifying' },
  { stage: 2, label: 'Scoping' },
  { stage: 3, label: 'Drafting' },
]

export const StageWizard: React.FC<StageWizardProps> = ({
  projectId,
  currentStage,
  maxAccessibleStage,
}) => {
  const navigate = useNavigate()

  const handleStageClick = (stage: WizardStage) => {
    if (stage > maxAccessibleStage) return // Can't navigate to inaccessible stages

    switch (stage) {
      case 1:
        navigate(generateRoute.projectStage1(projectId))
        break
      case 2:
        navigate(generateRoute.projectStage2(projectId))
        break
      case 3:
        navigate(generateRoute.projectStage3(projectId))
        break
    }
  }

  return (
    <div className='my-4'>
      <div className='flex items-center justify-center gap-0'>
        {STAGES.map(({ stage, label }, index) => {
          const isActive = stage === currentStage
          const isAccessible = stage <= maxAccessibleStage
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
                    ? 'bg-[#2f2b27] border-[#2f2b27] text-[#faf9f7]'
                    : isCompleted
                      ? 'bg-[#2f2b27] border-[#2f2b27] text-[#faf9f7]'
                      : isAccessible
                        ? 'bg-white border-[#d0ccc5] text-[#2f2b27] cursor-pointer hover:border-[#2f2b27]'
                        : 'bg-[#f1efe9] border-[#e8e4de] text-[#8b8680] cursor-not-allowed'
                }`}
                onClick={() => handleStageClick(stage)}
                disabled={!isAccessible}
                title={isAccessible ? label : `Complete earlier stages to unlock ${label}`}
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

      {/* Stage labels */}
      <div className='flex justify-between mt-2 px-0'>
        {STAGES.map(({ stage, label }) => {
          const isActive = stage === currentStage
          const isAccessible = stage <= maxAccessibleStage

          return (
            <span
              key={stage}
              className={`text-xs font-medium flex-1 text-center ${
                isActive ? 'text-[#2f2b27]' : isAccessible ? 'text-[#8b8680]' : 'text-[#d0ccc5]'
              }`}
            >
              {label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
