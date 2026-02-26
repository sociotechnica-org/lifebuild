import { getCategoryInfo, PROJECT_CATEGORIES, type ProjectCategory } from '@lifebuild/shared'
import React, { useMemo, useState } from 'react'

export type PanelProjectItem = {
  id: string
  name: string
  category: string | null
}

export type PanelSystemItem = {
  id: string
  name: string
  category: string | null
}

export type PanelCompletedProjectItem = PanelProjectItem & {
  completedAt?: number | null
}

export type PanelArchivedProjectItem = PanelProjectItem & {
  archivedAt?: Date | null
}

type UnplacedPanelProps = {
  isCollapsed: boolean
  unplacedProjects: readonly PanelProjectItem[]
  unplacedSystems?: readonly PanelSystemItem[]
  completedProjects: readonly PanelCompletedProjectItem[]
  archivedProjects: readonly PanelArchivedProjectItem[]
  onToggleCollapsed: () => void
  onSelectUnplacedProject?: (projectId: string) => void
  onSelectUnplacedSystem?: (systemId: string) => void
  onOpenProject?: (projectId: string) => void
  onUnarchiveProject?: (projectId: string) => void
  placementProject?: PanelProjectItem | null
  placementSystem?: PanelSystemItem | null
  selectedPlacedProject?: PanelProjectItem | null
  isSelectingPlacedProject?: boolean
  onCancelPlacement?: () => void
  onStartSelectingPlacedProject?: () => void
  onClearPlacedProjectSelection?: () => void
  onRemoveSelectedPlacedProject?: () => void
}

const formatTimestamp = (value: number | null | undefined): string | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  return new Date(value).toLocaleDateString()
}

const formatArchivedDate = (value: Date | null | undefined): string | null => {
  if (!value) {
    return null
  }

  return value.toLocaleDateString()
}

const CategoryDot: React.FC<{ category: string | null }> = ({ category }) => {
  const categoryInfo = useMemo(() => {
    const isKnownCategory = PROJECT_CATEGORIES.some(item => item.value === category)
    const normalizedCategory = isKnownCategory ? (category as ProjectCategory) : null
    return getCategoryInfo(normalizedCategory)
  }, [category])

  return (
    <span
      className='h-2 w-2 flex-shrink-0 rounded-full'
      style={{ backgroundColor: categoryInfo?.colorHex ?? '#8b8680' }}
    />
  )
}

export function UnplacedPanel({
  isCollapsed,
  unplacedProjects,
  unplacedSystems = [],
  completedProjects,
  archivedProjects,
  onToggleCollapsed,
  onSelectUnplacedProject,
  onSelectUnplacedSystem,
  onOpenProject,
  onUnarchiveProject,
  placementProject,
  placementSystem,
  selectedPlacedProject,
  isSelectingPlacedProject = false,
  onCancelPlacement,
  onStartSelectingPlacedProject,
  onClearPlacedProjectSelection,
  onRemoveSelectedPlacedProject,
}: UnplacedPanelProps) {
  const [completedExpanded, setCompletedExpanded] = useState(false)
  const [archivedExpanded, setArchivedExpanded] = useState(false)
  const unplacedCount = unplacedProjects.length + unplacedSystems.length

  const activePlacementEntity = placementProject ?? placementSystem ?? null

  if (isCollapsed) {
    return (
      <div className='pointer-events-auto absolute right-4 top-4 z-[5]'>
        <button
          type='button'
          className='inline-flex items-center gap-2 rounded-full border border-[#d8cab3] bg-[#faf4e9]/95 px-3 py-2 text-xs font-semibold text-[#2f2b27] shadow-sm backdrop-blur-sm'
          onClick={onToggleCollapsed}
        >
          <span>Unplaced</span>
          <span className='rounded-full bg-[#2f2b27] px-2 py-0.5 text-[11px] text-[#faf9f7]'>
            {unplacedCount}
          </span>
        </button>
      </div>
    )
  }

  return (
    <aside className='pointer-events-auto absolute right-0 top-0 z-[5] flex h-full w-[320px] flex-col border-l border-[#d8cab3] bg-[#faf4e9]/95 shadow-xl backdrop-blur-sm'>
      <div className='flex items-center justify-between border-b border-[#e8dcc8] px-4 py-3'>
        <div>
          <p className='text-sm font-semibold text-[#2f2b27]'>Unplaced Items</p>
          <p className='text-xs text-[#7f6952]'>{unplacedCount} waiting for placement</p>
        </div>
        <button
          type='button'
          className='rounded-lg border border-[#d8cab3] bg-white/70 px-2 py-1 text-xs font-semibold text-[#7f6952]'
          onClick={onToggleCollapsed}
        >
          Collapse
        </button>
      </div>

      <div className='flex-1 space-y-4 overflow-y-auto p-3'>
        <section>
          {unplacedProjects.length === 0 ? (
            <div className='rounded-lg border border-dashed border-[#d8cab3] bg-[#fffaf1] px-3 py-4 text-xs text-[#7f6952]'>
              All active projects are currently placed on the map.
            </div>
          ) : (
            <div className='space-y-2'>
              {unplacedProjects.map(project => (
                <button
                  key={project.id}
                  type='button'
                  className={`flex w-full items-center gap-2 rounded-lg border border-[#e8dcc8] bg-white px-3 py-2 text-left text-xs text-[#2f2b27] transition-colors ${
                    onSelectUnplacedProject ? 'hover:bg-[#f7efe0] cursor-pointer' : 'cursor-default'
                  }`}
                  disabled={!onSelectUnplacedProject}
                  onClick={() => onSelectUnplacedProject?.(project.id)}
                >
                  <CategoryDot category={project.category} />
                  <span className='truncate font-medium'>{project.name}</span>
                  {placementProject?.id === project.id && (
                    <span className='ml-auto rounded-full bg-[#c48b5a] px-2 py-0.5 text-[10px] font-semibold text-white'>
                      Placing
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        {unplacedSystems.length > 0 && (
          <section>
            <p className='mb-2 text-xs font-semibold text-[#2f2b27]'>Systems</p>
            <div className='space-y-2'>
              {unplacedSystems.map(system => (
                <button
                  key={system.id}
                  type='button'
                  className={`flex w-full items-center gap-2 rounded-lg border border-[#e8dcc8] bg-white px-3 py-2 text-left text-xs text-[#2f2b27] transition-colors ${
                    onSelectUnplacedSystem ? 'hover:bg-[#f7efe0] cursor-pointer' : 'cursor-default'
                  }`}
                  disabled={!onSelectUnplacedSystem}
                  onClick={() => onSelectUnplacedSystem?.(system.id)}
                >
                  <CategoryDot category={system.category} />
                  <span className='truncate font-medium'>{system.name}</span>
                  <span className='ml-auto rounded-full bg-[#7f6952]/20 px-2 py-0.5 text-[10px] font-semibold text-[#7f6952]'>
                    System
                  </span>
                  {placementSystem?.id === system.id && (
                    <span className='rounded-full bg-[#c48b5a] px-2 py-0.5 text-[10px] font-semibold text-white'>
                      Placing
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {activePlacementEntity && (
          <section className='rounded-lg border border-[#d8cab3] bg-[#fff8ec] p-3'>
            <p className='text-xs font-semibold text-[#2f2b27]'>Placement mode</p>
            <p className='mt-1 text-xs text-[#7f6952]'>
              Placing{' '}
              <span className='font-semibold text-[#2f2b27]'>{activePlacementEntity.name}</span>.
              Click an empty highlighted hex.
            </p>
            <p className='mt-1 text-[11px] text-[#8b7a66]'>Press Esc or click away to cancel.</p>
            {onCancelPlacement && (
              <button
                type='button'
                className='mt-2 rounded border border-[#d8cab3] bg-white px-2 py-1 text-[10px] font-semibold text-[#7f6952]'
                onClick={onCancelPlacement}
              >
                Cancel placement
              </button>
            )}
          </section>
        )}

        {onRemoveSelectedPlacedProject && (
          <section className='rounded-lg border border-[#e8dcc8] bg-white p-3'>
            <p className='text-xs font-semibold text-[#2f2b27]'>Placed Project Removal</p>
            {selectedPlacedProject ? (
              <div className='mt-2 space-y-2'>
                <div className='flex items-center gap-2 rounded-md bg-[#faf9f7] px-2 py-2 text-xs text-[#2f2b27]'>
                  <CategoryDot category={selectedPlacedProject.category} />
                  <span className='min-w-0 flex-1 truncate font-medium'>
                    {selectedPlacedProject.name}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  {onClearPlacedProjectSelection && (
                    <button
                      type='button'
                      className='rounded border border-[#d8cab3] bg-white px-2 py-1 text-[10px] font-semibold text-[#7f6952]'
                      onClick={onClearPlacedProjectSelection}
                    >
                      Choose another
                    </button>
                  )}
                  <button
                    type='button'
                    className='rounded border border-[#c48b5a] bg-[#fff2e4] px-2 py-1 text-[10px] font-semibold text-[#8f5d2f]'
                    onClick={onRemoveSelectedPlacedProject}
                  >
                    Remove from map
                  </button>
                </div>
              </div>
            ) : (
              <div className='mt-2 space-y-2'>
                <button
                  type='button'
                  className='rounded border border-[#d8cab3] bg-white px-2 py-1 text-[10px] font-semibold text-[#7f6952]'
                  onClick={onStartSelectingPlacedProject}
                  disabled={!onStartSelectingPlacedProject}
                >
                  Select placed tile
                </button>
                {isSelectingPlacedProject && (
                  <p className='text-[11px] text-[#8b7a66]'>
                    Click a placed hex tile on the map to select it.
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {completedProjects.length > 0 && (
          <section className='rounded-lg border border-[#e8dcc8] bg-white'>
            <button
              type='button'
              className='flex w-full items-center justify-between border-none bg-transparent px-3 py-2 text-left'
              onClick={() => setCompletedExpanded(expanded => !expanded)}
            >
              <span className='text-xs font-semibold text-[#2f2b27]'>
                Completed ({completedProjects.length})
              </span>
              <span className='text-xs text-[#7f6952]'>{completedExpanded ? 'Hide' : 'Show'}</span>
            </button>

            {completedExpanded && (
              <div className='space-y-1 border-t border-[#f0e7d8] p-2'>
                {completedProjects.map(project => {
                  const completedDate = formatTimestamp(project.completedAt)
                  return (
                    <button
                      key={project.id}
                      type='button'
                      className='flex w-full items-center gap-2 rounded-md border-none bg-[#faf9f7] px-2 py-2 text-left text-xs text-[#2f2b27] transition-colors hover:bg-[#f4eee3]'
                      onClick={() => onOpenProject?.(project.id)}
                    >
                      <CategoryDot category={project.category} />
                      <span className='min-w-0 flex-1 truncate font-medium'>{project.name}</span>
                      {completedDate && (
                        <span className='text-[10px] text-[#8b8680]'>{completedDate}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {archivedProjects.length > 0 && (
          <section className='rounded-lg border border-[#e8dcc8] bg-white'>
            <button
              type='button'
              className='flex w-full items-center justify-between border-none bg-transparent px-3 py-2 text-left'
              onClick={() => setArchivedExpanded(expanded => !expanded)}
            >
              <span className='text-xs font-semibold text-[#2f2b27]'>
                Archived ({archivedProjects.length})
              </span>
              <span className='text-xs text-[#7f6952]'>{archivedExpanded ? 'Hide' : 'Show'}</span>
            </button>

            {archivedExpanded && (
              <div className='space-y-1 border-t border-[#f0e7d8] p-2'>
                {archivedProjects.map(project => {
                  const archivedDate = formatArchivedDate(project.archivedAt)
                  return (
                    <div
                      key={project.id}
                      className='flex items-center gap-2 rounded-md bg-[#faf9f7] px-2 py-2 text-xs text-[#2f2b27]'
                    >
                      <button
                        type='button'
                        className='flex min-w-0 flex-1 items-center gap-2 border-none bg-transparent p-0 text-left'
                        onClick={() => onOpenProject?.(project.id)}
                      >
                        <CategoryDot category={project.category} />
                        <span className='min-w-0 flex-1 truncate font-medium'>{project.name}</span>
                        {archivedDate && (
                          <span className='text-[10px] text-[#8b8680]'>{archivedDate}</span>
                        )}
                      </button>
                      {onUnarchiveProject && (
                        <button
                          type='button'
                          className='rounded border border-[#d8cab3] bg-white px-2 py-1 text-[10px] font-semibold text-[#7f6952]'
                          onClick={() => onUnarchiveProject(project.id)}
                        >
                          Unarchive
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </aside>
  )
}
