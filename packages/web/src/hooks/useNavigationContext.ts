import { useLocation, useParams } from 'react-router-dom'
import { useQuery } from '@livestore/react'
import { getProjects$, getDocumentList$, getContacts$ } from '@work-squared/shared/queries'
import type { NavigationContext } from '../../../server/src/services/agentic-loop/types.js'

/**
 * Hook to extract current navigation context for LLM
 * Captures what page/entity the user is viewing and subtab if present
 */
export const useNavigationContext = (): NavigationContext | null => {
  const location = useLocation()
  const params = useParams<{ projectId?: string; documentId?: string; contactId?: string }>()

  // Call all hooks unconditionally (Rules of Hooks requirement)
  const projects = useQuery(getProjects$) ?? []
  const documents = useQuery(getDocumentList$) ?? []
  const contacts = useQuery(getContacts$) ?? []

  // Extract subtab from query parameters
  const searchParams = new URLSearchParams(location.search)
  const subtab = searchParams.get('subtab') || undefined

  const context: NavigationContext = {}

  // Add subtab if present
  if (subtab) {
    context.subtab = subtab
  }

  // Detect current entity from route params
  if (params.projectId) {
    const project = projects.find(p => p.id === params.projectId)

    if (project) {
      context.currentEntity = {
        type: 'project',
        id: project.id,
        attributes: {
          name: project.name,
          description: project.description || '(none)',
          created: formatDate(project.createdAt),
          updated: formatDate(project.updatedAt),
        },
      }
    }
  } else if (params.documentId) {
    const document = documents.find(d => d.id === params.documentId)

    if (document) {
      context.currentEntity = {
        type: 'document',
        id: document.id,
        attributes: {
          title: document.title,
          created: formatDate(document.createdAt),
          updated: formatDate(document.updatedAt),
        },
      }

      // TODO: Add related project if document belongs to one
      // This would require querying documentProjects table
    }
  } else if (params.contactId) {
    const contact = contacts.find(c => c.id === params.contactId)

    if (contact) {
      context.currentEntity = {
        type: 'contact',
        id: contact.id,
        attributes: {
          name: contact.name,
          email: contact.email || '(none)',
          created: formatDate(contact.createdAt),
          updated: formatDate(contact.updatedAt),
        },
      }

      // TODO: Add related projects if contact is associated with any
      // This would require querying projectContacts table
    }
  }

  // Return null if no meaningful context (user on home page, settings, etc.)
  if (!context.currentEntity && !context.subtab) {
    return null
  }

  return context
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date: Date | number | string | null | undefined): string {
  if (!date) return '(none)'

  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return '(none)'

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
