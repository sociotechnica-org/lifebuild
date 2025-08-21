import React from 'react'
import { Link } from 'react-router-dom'
import { Contact } from '@work-squared/shared/schema'
import { generateRoute } from '../../constants/routes.js'

interface ContactItemProps {
  contact: Contact
}

export const ContactItem: React.FC<ContactItemProps> = ({ contact }) => {
  return (
    <Link
      to={generateRoute.contact(contact.id)}
      className='block px-6 py-4 hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0'
    >
      <div className='flex items-center justify-between'>
        <div className='flex-1'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <div className='h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center'>
                <span className='text-sm font-medium text-blue-800'>
                  {contact.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </span>
              </div>
            </div>
            <div className='ml-4 flex-1'>
              <h3 className='text-sm font-medium text-gray-900'>{contact.name}</h3>
              {contact.email && <p className='text-sm text-gray-600'>{contact.email}</p>}
              <p className='text-xs text-gray-400 mt-1'>
                Created {new Date(contact.createdAt).toLocaleDateString()}
              </p>
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
