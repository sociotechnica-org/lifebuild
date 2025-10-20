import React from 'react'
import type { Project } from '@work-squared/shared/schema'
import { ProjectCard } from '../projects/ProjectCard/ProjectCard.js'
import { ProjectCreationView } from '../project-creation/ProjectCreationView.js'

export type CategoryTab = 'planning' | 'active' | 'completed'
export type PlanningSubTab = 'project-creation' | 'project-plans' | 'backlog'

export interface LifeCategoryPresenterProps {
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon?: string
  selectedTab: CategoryTab
  selectedSubTab: PlanningSubTab | null
  activeProjects: Project[]
  completedProjects: Project[]
  inProgressPlans: Project[]
  backlogProjects: Project[]
  onTabChange: (tab: CategoryTab) => void
  onSubTabChange: (subTab: PlanningSubTab) => void
  onProjectClick: (project: Project) => void
}

export const LifeCategoryPresenter: React.FC<LifeCategoryPresenterProps> = ({
  categoryName,
  categoryColor,
  categoryIcon,
  selectedTab,
  selectedSubTab,
  activeProjects,
  completedProjects,
  inProgressPlans,
  backlogProjects,
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
          <h1 className='text-xl font-semibold text-gray-900 mb-1 flex items-center gap-2'>
            {categoryIcon && <span className='text-2xl'>{categoryIcon}</span>}
            {categoryName}
          </h1>
          <p className='text-gray-600 text-sm'>Manage projects in this life category</p>
        </div>

        {/* Main Tabs */}
        <div className='flex gap-6 border-b border-gray-200'>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`pb-3 px-1 text-sm font-medium transition-colors relative cursor-pointer ${
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
                className={`pb-2 px-1 text-xs font-medium transition-colors cursor-pointer ${
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
      <div className='flex-1 overflow-y-auto'>
        {selectedTab === 'planning' && selectedSubTab === 'project-creation' && (
          <ProjectCreationView />
        )}

        {selectedTab === 'planning' && selectedSubTab === 'project-plans' && (
          <div className='p-6'>
            {inProgressPlans.length === 0 ? (
              <div className='text-center py-12'>
                <h2 className='text-xl font-semibold text-gray-600 mb-2'>
                  No projects in planning
                </h2>
                <p className='text-gray-500'>
                  Start a new project in Project Creation to begin planning.
                </p>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {inProgressPlans.map(project => (
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

        {selectedTab === 'planning' && selectedSubTab === 'backlog' && (
          <div className='p-6'>
            {backlogProjects.length === 0 ? (
              <div className='text-center py-12'>
                <h2 className='text-xl font-semibold text-gray-600 mb-2'>No projects in backlog</h2>
                <p className='text-gray-500'>
                  Complete planning (Stage 4) for a project to add it to the backlog.
                </p>
              </div>
            ) : (
              <div className='space-y-3'>
                {backlogProjects.map((project, index) => (
                  <div
                    key={project.id}
                    className='flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer'
                    onClick={() => onProjectClick(project)}
                  >
                    <div className='flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600'>
                      {index + 1}
                    </div>
                    <div className='flex-1'>
                      <h3 className='font-medium text-gray-900'>{project.name}</h3>
                      {project.description && (
                        <p className='text-sm text-gray-500 mt-1'>{project.description}</p>
                      )}
                    </div>
                    <div className='text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md'>
                      Stage 4
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'active' && (
          <div className='p-6'>
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
          <div className='p-6'>
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
