import React, { createContext, useContext, ReactNode } from 'react'
import { useQuery } from '@livestore/react'
import { getProjectById$ } from '@lifebuild/shared/queries'
import type { Project } from '@lifebuild/shared/schema'

interface ProjectContextValue {
  project: Project | undefined
  projectId: string | null
  isLoading: boolean
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

interface ProjectProviderProps {
  projectId: string | null
  children: ReactNode
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ projectId, children }) => {
  const projectResult = projectId ? useQuery(getProjectById$(projectId)) : null
  const project = projectResult?.[0] as Project | undefined
  const isLoading = projectId ? !projectResult : false

  const value: ProjectContextValue = {
    project,
    projectId,
    isLoading,
  }

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

export const useProject = (): ProjectContextValue => {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider')
  }
  return context
}
