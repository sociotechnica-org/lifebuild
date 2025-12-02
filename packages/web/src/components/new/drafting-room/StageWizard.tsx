import React from 'react'
import { useNavigate } from 'react-router-dom'
import { generateRoute } from '../../../constants/routes.js'
import './stage-wizard.css'

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
        navigate(generateRoute.newProjectStage1(projectId))
        break
      case 2:
        navigate(generateRoute.newProjectStage2(projectId))
        break
      case 3:
        // Stage 3 form doesn't exist yet
        // navigate(generateRoute.newProjectStage3(projectId))
        break
    }
  }

  return (
    <div className='stage-wizard'>
      <div className='stage-wizard-track'>
        {STAGES.map(({ stage, label }, index) => {
          const isActive = stage === currentStage
          const isAccessible = stage <= maxAccessibleStage
          const isCompleted = stage < currentStage

          return (
            <React.Fragment key={stage}>
              {/* Connector line (before each dot except first) */}
              {index > 0 && (
                <div
                  className={`stage-wizard-connector ${stage <= currentStage ? 'filled' : ''}`}
                />
              )}

              {/* Stage dot */}
              <button
                type='button'
                className={`stage-wizard-dot ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${!isAccessible ? 'disabled' : ''}`}
                onClick={() => handleStageClick(stage)}
                disabled={!isAccessible}
                title={isAccessible ? label : `Complete earlier stages to unlock ${label}`}
              >
                {isCompleted ? (
                  <svg
                    className='stage-wizard-check'
                    viewBox='0 0 16 16'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                  >
                    <path d='M3 8l4 4 6-7' strokeLinecap='round' strokeLinejoin='round' />
                  </svg>
                ) : (
                  <span className='stage-wizard-number'>{stage}</span>
                )}
              </button>
            </React.Fragment>
          )
        })}
      </div>

      {/* Stage labels */}
      <div className='stage-wizard-labels'>
        {STAGES.map(({ stage, label }) => {
          const isActive = stage === currentStage
          const isAccessible = stage <= maxAccessibleStage

          return (
            <span
              key={stage}
              className={`stage-wizard-label ${isActive ? 'active' : ''} ${!isAccessible ? 'disabled' : ''}`}
            >
              {label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
