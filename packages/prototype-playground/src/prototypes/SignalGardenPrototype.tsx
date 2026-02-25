import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import type { CategoryToken } from '../lib/visualLanguage.js'
import { CATEGORY_TOKENS, STATE_TREATMENTS, type StateKey } from '../lib/visualLanguage.js'

interface GardenCell {
  id: number
  categoryId: CategoryToken['id']
  state: StateKey
}

const rowLengths = [3, 4, 5, 4, 3] as const
const cycleStates: readonly StateKey[] = ['planned', 'live', 'workAtHand', 'paused']
const defaultState: StateKey = 'planned'

const randomCategoryId = () =>
  CATEGORY_TOKENS[Math.floor(Math.random() * CATEGORY_TOKENS.length)]?.id ?? 'health'

const buildInitialCells = (): GardenCell[] => {
  const totalCells = rowLengths.reduce((sum, count) => sum + count, 0)

  return Array.from({ length: totalCells }, (_, index) => ({
    id: index,
    categoryId: randomCategoryId(),
    state: 'planned' as const,
  }))
}

const categoryMap = new Map(CATEGORY_TOKENS.map(category => [category.id, category]))

const nextState = (state: StateKey): StateKey => {
  const currentIndex = cycleStates.indexOf(state)
  const nextIndex = (currentIndex + 1) % cycleStates.length
  return cycleStates[nextIndex] ?? defaultState
}

export function SignalGardenPrototype() {
  const [cells, setCells] = useState<GardenCell[]>(() => buildInitialCells())

  const rows = useMemo(() => {
    let cursor = 0

    return rowLengths.map(length => {
      const row = cells.slice(cursor, cursor + length)
      cursor += length
      return row
    })
  }, [cells])

  const stateCounts = useMemo(() => {
    return cells.reduce(
      (counts, cell) => {
        counts[cell.state] += 1
        return counts
      },
      {
        live: 0,
        planned: 0,
        paused: 0,
        workAtHand: 0,
      } as Record<StateKey, number>
    )
  }, [cells])

  const shuffleCategories = () => {
    setCells(previous => previous.map(cell => ({ ...cell, categoryId: randomCategoryId() })))
  }

  const cycleAllStates = () => {
    setCells(previous => previous.map(cell => ({ ...cell, state: nextState(cell.state) })))
  }

  const resetGarden = () => setCells(buildInitialCells())

  const toggleCell = (cellId: number) => {
    setCells(previous =>
      previous.map(cell => (cell.id === cellId ? { ...cell, state: nextState(cell.state) } : cell))
    )
  }

  return (
    <section className='signal-garden'>
      <div className='signal-garden__toolbar'>
        <button type='button' onClick={shuffleCategories}>
          Shuffle categories
        </button>
        <button type='button' onClick={cycleAllStates}>
          Cycle all states
        </button>
        <button type='button' onClick={resetGarden}>
          Reset field
        </button>
      </div>

      <div className='signal-garden__legend'>
        {(Object.keys(STATE_TREATMENTS) as StateKey[]).map(state => (
          <div key={state} className='signal-garden__legend-chip'>
            <strong>{STATE_TREATMENTS[state].label}</strong>
            <span>{stateCounts[state]}</span>
          </div>
        ))}
      </div>

      <div className='signal-garden__board'>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className='signal-garden__row'>
            {row.map(cell => {
              const category = categoryMap.get(cell.categoryId)
              const treatment = STATE_TREATMENTS[cell.state]

              return (
                <button
                  key={cell.id}
                  type='button'
                  aria-label={`${category?.name ?? 'Unknown'} in ${treatment.label}`}
                  className={
                    treatment.glow
                      ? 'signal-garden__cell signal-garden__cell--glow'
                      : 'signal-garden__cell'
                  }
                  style={
                    {
                      '--garden-color': category?.colorHex ?? '#8F887D',
                      '--garden-saturation': treatment.saturation,
                      '--garden-opacity': treatment.opacity,
                    } as CSSProperties
                  }
                  onClick={() => toggleCell(cell.id)}
                >
                  <span>{category?.name.slice(0, 2) ?? '--'}</span>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <p className='signal-garden__hint'>
        Click any hex to cycle state. This makes saturation differences easy to compare side by
        side.
      </p>
    </section>
  )
}
