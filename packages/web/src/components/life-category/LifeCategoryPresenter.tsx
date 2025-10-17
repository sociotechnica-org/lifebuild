import React from 'react'
import type { Project } from '@work-squared/shared/schema'
import { ProjectCard } from '../projects/ProjectCard/ProjectCard.js'

export type CategoryTab = 'planning' | 'active' | 'completed'
export type PlanningSubTab = 'project-creation' | 'project-plans' | 'backlog'

export interface LifeCategoryPresenterProps {
  categoryId: string
  categoryName: string
  categoryColor: string
  selectedTab: CategoryTab
  selectedSubTab: PlanningSubTab | null
  activeProjects: Project[]
  completedProjects: Project[]
  onTabChange: (tab: CategoryTab) => void
  onSubTabChange: (subTab: PlanningSubTab) => void
  onProjectClick: (project: Project) => void
}

export const LifeCategoryPresenter: React.FC<LifeCategoryPresenterProps> = ({
  categoryName,
  categoryColor,
  selectedTab,
  selectedSubTab,
  activeProjects,
  completedProjects,
  onTabChange,
  onSubTabChange,
  onProjectClick,
}) => {
  const tabs: { id: CategoryTab; label: string }[] = [
    { id: 'planning', label: 'Planning' },
    { id: 'active', label: 'Active' },
    { id: 'completed', label: 'Completed' },
  ]

  const planningSubTabs: { id: PlanningSubTab; label: string }[] = [
    { id: 'project-creation', label: 'Project Creation' },
    { id: 'project-plans', label: 'Project Plans' },
    { id: 'backlog', label: 'Backlog' },
  ]

  return (
    <div className='h-full bg-white flex flex-col'>
      {/* Header */}
      <div className='border-b border-gray-200 bg-white px-6 py-4'>
        <div className='mb-4'>
          <h1 className='text-xl font-semibold text-gray-900 mb-1'>{categoryName}</h1>
          <p className='text-gray-600 text-sm'>Manage projects in this life category</p>
        </div>

        {/* Main Tabs */}
        <div className='flex gap-6 border-b border-gray-200'>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                selectedTab === tab.id
                  ? 'text-gray-900 border-b-2'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={
                selectedTab === tab.id
                  ? {
                      borderBottomColor: categoryColor,
                    }
                  : undefined
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Planning Sub-tabs (only visible when Planning tab is active) */}
      {selectedTab === 'planning' && (
        <div className='border-b border-gray-200 bg-gray-50 px-6'>
          <div className='flex gap-4 pt-2'>
            {planningSubTabs.map(subTab => (
              <button
                key={subTab.id}
                onClick={() => onSubTabChange(subTab.id)}
                className={`pb-2 px-1 text-xs font-medium transition-colors ${
                  selectedSubTab === subTab.id
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {subTab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className='flex-1 overflow-y-auto p-6'>
        {selectedTab === 'planning' && selectedSubTab && (
          <div>
            <h2 className='text-lg font-semibold mb-4'>
              {planningSubTabs.find(t => t.id === selectedSubTab)?.label}
            </h2>
            <p className='text-gray-600'>Content for {selectedSubTab} will go here.</p>
          </div>
        )}

        {selectedTab === 'active' && (
          <div>
            {activeProjects.length === 0 ? (
              <div className='text-center py-12'>
                <h2 className='text-xl font-semibold text-gray-600 mb-2'>No active projects</h2>
                <p className='text-gray-500'>Create projects in the Planning tab to get started.</p>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {activeProjects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => onProjectClick(project)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'completed' && (
          <div>
            {completedProjects.length === 0 ? (
              <div className='text-center py-12'>
                <h2 className='text-xl font-semibold text-gray-600 mb-2'>No completed projects</h2>
                <p className='text-gray-500'>
                  Completed projects will appear here when you finish them.
                </p>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {completedProjects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => onProjectClick(project)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
