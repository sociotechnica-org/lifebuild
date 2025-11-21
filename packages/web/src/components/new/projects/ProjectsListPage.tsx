import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@livestore/react'
import { getProjects$ } from '@work-squared/shared/queries'
import { generateRoute } from '../../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../../utils/navigation.js'

export const ProjectsListPage: React.FC = () => {
  const projects = useQuery(getProjects$) ?? []

  return (
    <div className='space-y-4'>
      <h1 className='new-ui-heading-lg'>Projects</h1>
      {projects.length === 0 ? (
        <p>No projects yet</p>
      ) : (
        <ul className='new-ui-list'>
          {projects.map(project => (
            <li key={project.id} className='new-ui-list-item'>
              <Link to={preserveStoreIdInUrl(generateRoute.newProject(project.id))}>
                {project.name || 'Untitled project'}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
