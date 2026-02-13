import type { Project } from '@lifebuild/shared/schema'
import type { PlanningAttributes } from '@lifebuild/shared'
import { getInitials } from './initials.js'

const getFullImageUrl = (url: string): string => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  const syncUrl = import.meta.env.VITE_LIVESTORE_SYNC_URL || 'http://localhost:8787'
  const httpUrl = syncUrl.replace(/^ws:/, 'http:').replace(/^wss:/, 'https:')
  return `${httpUrl}${url}`
}

const parseAttributes = (attributes: Project['attributes']): PlanningAttributes | null => {
  if (!attributes) return null
  if (typeof attributes === 'string') {
    try {
      return JSON.parse(attributes) as PlanningAttributes
    } catch {
      return null
    }
  }
  return attributes as PlanningAttributes
}

export const getProjectCoverImageUrl = (project: Project): string | null => {
  const attributes = parseAttributes(project.attributes)
  const coverImage = attributes?.coverImage
  if (!coverImage) return null
  return getFullImageUrl(coverImage)
}

export const getProjectInitials = (project: Project): string => {
  return getInitials(project.name || 'P')
}
