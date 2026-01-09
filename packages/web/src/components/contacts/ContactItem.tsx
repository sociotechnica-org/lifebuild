import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '../../livestore-compat.js'
import { Contact } from '@lifebuild/shared/schema'
import { getContactProjects$ } from '@lifebuild/shared/queries'
import { generateRoute } from '../../constants/routes.js'
import { getInitials } from '../../utils/initials.js'

interface ContactItemProps {
  contact: Contact
}

export const ContactItem: React.FC<ContactItemProps> = ({ contact }) => {
  const contactProjects = useQuery(getContactProjects$(contact.id)) ?? []
  const projectCount = contactProjects.length

  return (
    <Link
      to={generateRoute.oldContact(contact.id)}
      className='block px-6 py-4 hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0'
    >
      <div className='flex items-center justify-between'>
        <div className='flex-1'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <div className='h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center'>
                <span className='text-sm font-medium text-blue-800'>
                  {getInitials(contact.name || '')}
                </span>
              </div>
            </div>
            <div className='ml-4 flex-1'>
              <h3 className='text-sm font-medium text-gray-900'>
                {contact.name || 'Unnamed Contact'}
              </h3>
              {contact.email && <p className='text-sm text-gray-600'>{contact.email}</p>}
              <div className='flex items-center gap-3 mt-1'>
                <p className='text-xs text-gray-400'>
                  Created {new Date(contact.createdAt).toLocaleDateString()}
                </p>
                {projectCount > 0 && (
                  <span className='text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded'>
                    {projectCount} {projectCount === 1 ? 'project' : 'projects'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className='flex-shrink-0'>
          <svg
            className='h-5 w-5 text-gray-400'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth='1.5'
            stroke='currentColor'
          >
            <path strokeLinecap='round' strokeLinejoin='round' d='M8.25 4.5l7.5 7.5-7.5 7.5' />
          </svg>
        </div>
      </div>
    </Link>
  )
}
