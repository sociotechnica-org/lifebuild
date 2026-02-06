import React from 'react'
import type { Project } from '@lifebuild/shared/schema'
import { getCategoryInfo, type ProjectCategory } from '@lifebuild/shared'
import { getProjectCoverImageUrl, getProjectInitials } from '../../utils/projectImages.js'

interface ProjectAvatarProps {
  project: Project
  size?: number
  className?: string
}

export const ProjectAvatar: React.FC<ProjectAvatarProps> = ({ project, size = 40, className }) => {
  const coverImageUrl = getProjectCoverImageUrl(project)
  const categoryInfo = getCategoryInfo(project.category as ProjectCategory)
  const accentColor = categoryInfo?.colorHex ?? '#0ea5e9'
  const initials = getProjectInitials(project)

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 ${className ?? ''}`}
      style={{ width: size, height: size }}
      aria-label={`${project.name ?? 'Project'} icon`}
      role='img'
    >
      {coverImageUrl ? (
        <>
          <img src={coverImageUrl} alt='' className='h-full w-full object-cover' />
          <span className='absolute inset-0 rounded-xl ring-1 ring-inset ring-white/40' />
        </>
      ) : (
        <span
          className='flex h-full w-full items-center justify-center'
          style={{ color: accentColor }}
        >
          {initials}
        </span>
      )}
    </div>
  )
}
