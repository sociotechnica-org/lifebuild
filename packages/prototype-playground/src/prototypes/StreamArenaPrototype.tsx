import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import type { CategoryToken } from '../lib/visualLanguage.js'
import { CATEGORY_TOKENS, STREAM_TOKENS, type StreamKey } from '../lib/visualLanguage.js'

interface WorkItem {
  id: string
  title: string
  categoryId: CategoryToken['id']
  urgency: number
  importance: number
  leverage: number
  stream: StreamKey
}

const seedItems: readonly Omit<WorkItem, 'stream'>[] = [
  {
    id: 'item-1',
    title: 'Launch neighborhood dinner series',
    categoryId: 'community',
    urgency: 4,
    importance: 8,
    leverage: 6,
  },
  {
    id: 'item-2',
    title: 'Build recurring budget autopilot',
    categoryId: 'finances',
    urgency: 7,
    importance: 7,
    leverage: 9,
  },
  {
    id: 'item-3',
    title: 'Restore morning mobility routine',
    categoryId: 'health',
    urgency: 6,
    importance: 9,
    leverage: 7,
  },
  {
    id: 'item-4',
    title: 'Host monthly family summit',
    categoryId: 'relationships',
    urgency: 5,
    importance: 8,
    leverage: 5,
  },
  {
    id: 'item-5',
    title: 'Reconfigure workshop storage wall',
    categoryId: 'home',
    urgency: 6,
    importance: 6,
    leverage: 8,
  },
  {
    id: 'item-6',
    title: 'Prototype coaching curriculum',
    categoryId: 'purpose',
    urgency: 4,
    importance: 9,
    leverage: 8,
  },
  {
    id: 'item-7',
    title: 'Plan low-friction recovery block',
    categoryId: 'leisure',
    urgency: 5,
    importance: 7,
    leverage: 6,
  },
  {
    id: 'item-8',
    title: 'Publish weekly reflection memo',
    categoryId: 'personal-growth',
    urgency: 5,
    importance: 8,
    leverage: 7,
  },
]

const makeInitialItems = (): WorkItem[] =>
  seedItems.map(item => ({ ...item, stream: 'bronze' as const }))

const categoryMap = new Map(CATEGORY_TOKENS.map(category => [category.id, category]))

function scoreItem(item: WorkItem, stream: StreamKey): number {
  if (stream === 'gold') return Number(((item.importance * 1.5 + item.leverage) / 2).toFixed(1))
  if (stream === 'silver') return Number(((item.leverage * 1.4 + item.importance) / 2).toFixed(1))
  return Number(((item.urgency * 1.5 + item.leverage * 0.5) / 2).toFixed(1))
}

function assignStreamWithCapacity(
  items: WorkItem[],
  itemId: string,
  nextStream: StreamKey
): WorkItem[] {
  const itemToMove = items.find(item => item.id === itemId)
  if (!itemToMove) return items

  if (nextStream === 'bronze') {
    return items.map(item => (item.id === itemId ? { ...item, stream: 'bronze' } : item))
  }

  const occupant = items.find(item => item.stream === nextStream && item.id !== itemId)

  return items.map(item => {
    if (item.id === itemId) return { ...item, stream: nextStream }
    if (occupant && item.id === occupant.id) return { ...item, stream: 'bronze' }
    return item
  })
}

export function StreamArenaPrototype() {
  const [items, setItems] = useState<WorkItem[]>(() => makeInitialItems())

  const lanes = useMemo(() => {
    const result: Record<StreamKey, WorkItem[]> = {
      gold: [],
      silver: [],
      bronze: [],
    }

    items.forEach(item => {
      result[item.stream].push(item)
    })

    return result
  }, [items])

  const assignStream = (itemId: string, nextStream: StreamKey) => {
    setItems(previous => assignStreamWithCapacity(previous, itemId, nextStream))
  }

  const autoBalance = () => {
    const goldCandidate = [...items].sort(
      (left, right) => scoreItem(right, 'gold') - scoreItem(left, 'gold')
    )[0]

    const remaining = items.filter(item => item.id !== goldCandidate?.id)
    const silverCandidate = [...remaining].sort(
      (left, right) => scoreItem(right, 'silver') - scoreItem(left, 'silver')
    )[0]

    setItems(previous =>
      previous.map(item => {
        if (item.id === goldCandidate?.id) return { ...item, stream: 'gold' as const }
        if (item.id === silverCandidate?.id) return { ...item, stream: 'silver' as const }
        return { ...item, stream: 'bronze' as const }
      })
    )
  }

  const reset = () => setItems(makeInitialItems())

  return (
    <section className='stream-arena'>
      <div className='stream-arena__controls'>
        <button type='button' onClick={autoBalance}>
          Auto-balance lanes
        </button>
        <button type='button' onClick={reset}>
          Reset to Bronze
        </button>
      </div>

      <div className='stream-arena__grid'>
        <aside className='stream-arena__bank'>
          <h2>Work Pool</h2>
          <p>
            Pick one Gold and one Silver. Any displaced project automatically moves back to Bronze.
          </p>
          <div className='stream-arena__items'>
            {items.map(item => {
              const category = categoryMap.get(item.categoryId)

              return (
                <article key={item.id} className='stream-item'>
                  <header>
                    <span style={{ backgroundColor: category?.colorHex }}>{category?.name}</span>
                    <strong>{item.title}</strong>
                  </header>
                  <p>
                    U{item.urgency} I{item.importance} L{item.leverage}
                  </p>
                  <div className='stream-item__buttons'>
                    {(Object.keys(STREAM_TOKENS) as StreamKey[]).map(stream => (
                      <button
                        key={stream}
                        type='button'
                        onClick={() => assignStream(item.id, stream)}
                        className={
                          item.stream === stream
                            ? 'stream-item__button stream-item__button--active'
                            : 'stream-item__button'
                        }
                        style={
                          { '--stream-color': STREAM_TOKENS[stream].colorHex } as CSSProperties
                        }
                      >
                        {STREAM_TOKENS[stream].label}
                      </button>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
        </aside>

        <div className='stream-arena__lanes'>
          {(Object.keys(STREAM_TOKENS) as StreamKey[]).map(stream => {
            const laneItems = lanes[stream]

            return (
              <section
                key={stream}
                className='stream-lane'
                style={{ '--lane-color': STREAM_TOKENS[stream].colorHex } as CSSProperties}
              >
                <header>
                  <h3>{STREAM_TOKENS[stream].label}</h3>
                  <p>{STREAM_TOKENS[stream].description}</p>
                </header>
                {laneItems.length === 0 && (
                  <div className='stream-lane__empty'>No projects assigned.</div>
                )}
                {laneItems.map(item => (
                  <article key={item.id} className='stream-lane__card'>
                    <strong>{item.title}</strong>
                    <p>Fit score {scoreItem(item, stream)}</p>
                  </article>
                ))}
              </section>
            )
          })}
        </div>
      </div>
    </section>
  )
}
