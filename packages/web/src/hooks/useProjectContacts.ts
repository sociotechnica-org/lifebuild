import { useQuery, useStore } from '@livestore/react'
import { getProjectContacts$, getContactProjects$ } from '@lifebuild/shared/queries'
import { events } from '@lifebuild/shared/schema'

export function useProjectContacts(projectId?: string) {
  const { store } = useStore()

  const projectContacts = projectId ? (useQuery(getProjectContacts$(projectId)) ?? []) : []

  const addContactToProject = async (projectId: string, contactId: string) => {
    await store.commit(
      events.projectContactAdded({
        id: crypto.randomUUID(),
        projectId,
        contactId,
        createdAt: new Date(),
      })
    )
  }

  const removeContactFromProject = async (projectId: string, contactId: string) => {
    await store.commit(
      events.projectContactRemoved({
        projectId,
        contactId,
      })
    )
  }

  const addMultipleContactsToProject = async (projectId: string, contactIds: string[]) => {
    const eventsToCommit = contactIds.map(contactId =>
      events.projectContactAdded({
        id: crypto.randomUUID(),
        projectId,
        contactId,
        createdAt: new Date(),
      })
    )

    await store.commit(...eventsToCommit)
  }

  return {
    projectContacts,
    addContactToProject,
    removeContactFromProject,
    addMultipleContactsToProject,
  }
}

export function useContactProjects(contactId?: string) {
  const { store } = useStore()

  const contactProjects = contactId ? (useQuery(getContactProjects$(contactId)) ?? []) : []

  const addContactToProjects = async (contactId: string, projectIds: string[]) => {
    const eventsToCommit = projectIds.map(projectId =>
      events.projectContactAdded({
        id: crypto.randomUUID(),
        projectId,
        contactId,
        createdAt: new Date(),
      })
    )

    await store.commit(...eventsToCommit)
  }

  return {
    contactProjects,
    addContactToProjects,
  }
}
