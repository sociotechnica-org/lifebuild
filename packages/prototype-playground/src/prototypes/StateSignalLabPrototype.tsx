import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  CATEGORY_TOKENS,
  STATE_TREATMENTS,
  STREAM_TOKENS,
  type StateKey,
  type StreamKey,
} from '../lib/visualLanguage.js'

type EntityMode = 'project' | 'system'

const stateOrder: readonly StateKey[] = ['workAtHand', 'live', 'planned', 'paused']

export function StateSignalLabPrototype() {
  const [activeState, setActiveState] = useState<StateKey>('workAtHand')
  const [activeStream, setActiveStream] = useState<StreamKey>('gold')
  const [entityMode, setEntityMode] = useState<EntityMode>('project')
  const [progress, setProgress] = useState(64)

  const treatment = STATE_TREATMENTS[activeState]
  const stream = STREAM_TOKENS[activeStream]

  const progressLabel = useMemo(() => `${progress}%`, [progress])

  return (
    <section className='signal-lab'>
      <div className='signal-lab__controls'>
        <div className='signal-lab__control-group'>
          <h2>State</h2>
          <div>
            {stateOrder.map(state => (
              <button
                key={state}
                type='button'
                className={
                  activeState === state ? 'signal-toggle signal-toggle--active' : 'signal-toggle'
                }
                onClick={() => setActiveState(state)}
              >
                {STATE_TREATMENTS[state].label}
              </button>
            ))}
          </div>
        </div>

        <div className='signal-lab__control-group'>
          <h2>Stream Accent</h2>
          <div>
            {(Object.keys(STREAM_TOKENS) as StreamKey[]).map(streamKey => (
              <button
                key={streamKey}
                type='button'
                className={
                  activeStream === streamKey
                    ? 'signal-toggle signal-toggle--active'
                    : 'signal-toggle'
                }
                onClick={() => setActiveStream(streamKey)}
              >
                {STREAM_TOKENS[streamKey].label}
              </button>
            ))}
          </div>
        </div>

        <div className='signal-lab__control-group'>
          <h2>Entity Marker</h2>
          <div>
            <button
              type='button'
              className={
                entityMode === 'project' ? 'signal-toggle signal-toggle--active' : 'signal-toggle'
              }
              onClick={() => setEntityMode('project')}
            >
              Project ring
            </button>
            <button
              type='button'
              className={
                entityMode === 'system' ? 'signal-toggle signal-toggle--active' : 'signal-toggle'
              }
              onClick={() => setEntityMode('system')}
            >
              System dots
            </button>
          </div>
        </div>

        <div className='signal-lab__control-group signal-lab__control-group--slider'>
          <h2>Progress</h2>
          <label htmlFor='signal-progress'>
            <span>{progressLabel}</span>
            <input
              id='signal-progress'
              type='range'
              min={0}
              max={100}
              value={progress}
              onChange={event => setProgress(Number(event.target.value))}
            />
          </label>
        </div>
      </div>

      <div className='signal-grid'>
        {CATEGORY_TOKENS.map(category => {
          const cardStyle: CSSProperties = {
            '--signal-accent': category.colorHex,
            '--signal-stream': stream.colorHex,
            '--signal-saturation': treatment.saturation,
            '--signal-opacity': treatment.opacity,
            '--signal-progress': `${progress}%`,
          } as CSSProperties

          return (
            <article
              key={category.id}
              className={treatment.glow ? 'signal-card signal-card--glow' : 'signal-card'}
              style={cardStyle}
            >
              <header>
                <span>{category.name}</span>
                <small>{STATE_TREATMENTS[activeState].label}</small>
              </header>
              <p>{category.rationale}</p>
              <div className='signal-card__marker'>
                {entityMode === 'project' ? (
                  <div
                    className='signal-card__ring'
                    role='img'
                    aria-label={`${progressLabel} complete`}
                  >
                    <span>{progressLabel}</span>
                  </div>
                ) : (
                  <div className='signal-card__dots' role='img' aria-label='System health dots'>
                    <span />
                    <span />
                    <span />
                    <span />
                    <span className='signal-card__dot--dim' />
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
