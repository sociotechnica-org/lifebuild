import React from 'react'
import { Link } from 'react-router-dom'
import { Contact } from '@work-squared/shared/schema'

interface ContactItemProps {
  contact: Contact
  projectCount?: number
}

export const ContactItem: React.FC<ContactItemProps> = ({ contact, projectCount }) => {
  return (
    <Link
      to={`/contacts/${contact.id}`}
      className='block p-4 hover:bg-gray-50 border-b border-gray-200 transition-colors'
    >
      <div className='flex items-center justify-between'>
        <div className='flex-1 min-w-0'>
          <p className='text-sm font-medium text-gray-900 truncate'>{contact.name}</p>
          <p className='text-sm text-gray-500 truncate'>{contact.email}</p>
        </div>
        {projectCount !== undefined && projectCount > 0 && (
          <div className='ml-2 flex-shrink-0'>
            <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
              {projectCount} {projectCount === 1 ? 'project' : 'projects'}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
