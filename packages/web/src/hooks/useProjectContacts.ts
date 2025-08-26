import { useStore } from '@livestore/react'
import { getProjectContacts$, getContactProjects$ } from '@work-squared/shared/queries'

export function useProjectContacts(projectId?: string) {
  const { mutate } = useStore.store()

  const projectContacts = projectId ? useStore(getProjectContacts$(projectId)) : []

  const addContactToProject = async (projectId: string, contactId: string) => {
    await mutate([
      {
        type: 'v1.ProjectContactAdded',
        id: crypto.randomUUID(),
        projectId,
        contactId,
        createdAt: new Date(),
      },
    ])
  }

  const removeContactFromProject = async (projectId: string, contactId: string) => {
    await mutate([
      {
        type: 'v1.ProjectContactRemoved',
        projectId,
        contactId,
      },
    ])
  }

  const addMultipleContactsToProject = async (projectId: string, contactIds: string[]) => {
    const events = contactIds.map(contactId => ({
      type: 'v1.ProjectContactAdded' as const,
      id: crypto.randomUUID(),
      projectId,
      contactId,
      createdAt: new Date(),
    }))

    await mutate(events)
  }

  return {
    projectContacts,
    addContactToProject,
    removeContactFromProject,
    addMultipleContactsToProject,
  }
}

export function useContactProjects(contactId?: string) {
  const { mutate } = useStore.store()

  const contactProjects = contactId ? useStore(getContactProjects$(contactId)) : []

  const addContactToProjects = async (contactId: string, projectIds: string[]) => {
    const events = projectIds.map(projectId => ({
      type: 'v1.ProjectContactAdded' as const,
      id: crypto.randomUUID(),
      projectId,
      contactId,
      createdAt: new Date(),
    }))

    await mutate(events)
  }

  return {
    contactProjects,
    addContactToProjects,
  }
}
