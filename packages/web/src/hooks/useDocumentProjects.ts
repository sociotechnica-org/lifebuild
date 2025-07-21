import { useMemo } from 'react'
import { useQuery } from '@livestore/react'
import {
  getAllDocumentProjects$,
  getDocumentProjectsByDocument$,
  getProjects$,
} from '@work-squared/shared/queries'

/**
 * Custom hook to get projects associated with a document
 *
 * @param documentId - The ID of the document to get projects for
 * @returns Array of projects associated with the document
 */
export function useDocumentProjects(documentId: string) {
  const allDocumentProjects = useQuery(getAllDocumentProjects$) ?? []
  const allProjects = useQuery(getProjects$) ?? []

  const associatedProjects = useMemo(() => {
    const projectIds = allDocumentProjects
      .filter(dp => dp.documentId === documentId)
      .map(dp => dp.projectId)

    return allProjects.filter(project => projectIds.includes(project.id))
  }, [allDocumentProjects, allProjects, documentId])

  return associatedProjects
}

/**
 * Alternative hook that uses the more targeted query for a specific document
 * This is more efficient when you only need associations for one document
 *
 * @param documentId - The ID of the document to get projects for
 * @returns Array of projects associated with the document
 */
export function useDocumentProjectsTargeted(documentId: string) {
  const documentProjects = useQuery(getDocumentProjectsByDocument$(documentId)) ?? []
  const allProjects = useQuery(getProjects$) ?? []

  const associatedProjects = useMemo(() => {
    const projectIds = documentProjects.map(dp => dp.projectId)
    return allProjects.filter(project => projectIds.includes(project.id))
  }, [documentProjects, allProjects])

  return associatedProjects
}
