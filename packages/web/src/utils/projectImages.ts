import type { Project } from '@lifebuild/shared/schema'
import type { PlanningAttributes } from '@lifebuild/shared'

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
  const name = project.name?.trim()
  if (!name) return 'P'
  const words = name.split(/\s+/)
  const initials = words
    .slice(0, 2)
    .map(word => word[0])
    .join('')
  return initials.toUpperCase()
}
