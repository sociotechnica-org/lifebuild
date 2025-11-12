import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@livestore/react'
import { getProjects$ } from '@work-squared/shared/queries'
import { generateRoute } from '../../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../../utils/navigation.js'

export const ProjectsListPage: React.FC = () => {
  const projects = useQuery(getProjects$) ?? []

  return (
    <div>
      <header>
        <h1>Projects</h1>
        <p>Foundation list for the upcoming UI. Links navigate to the new project detail page.</p>
      </header>

      {projects.length === 0 ? (
        <p>No projects yet</p>
      ) : (
        <ul>
          {projects.map(project => (
            <li key={project.id}>
              <Link to={preserveStoreIdInUrl(generateRoute.newProject(project.id))}>
                {project.name || 'Untitled project'}
              </Link>
              {project.description && <p>{project.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
