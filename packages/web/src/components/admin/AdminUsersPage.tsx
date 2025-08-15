import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { formatRegistrationDate } from '../../util/dates.js'
import { useAuth } from '../../contexts/AuthContext.js'
import { isCurrentUserAdmin } from '../../utils/adminCheck.jsx'
import { ROUTES } from '../../constants/routes.js'

interface AdminUser {
  email: string
  createdAt: string
  storeIds: string[]
  instanceCount: number
}

export const AdminUsersPage: React.FC = () => {
  const { user, getCurrentToken, isAuthenticated } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check admin access - redirect if not authenticated or not admin
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (!isCurrentUserAdmin(user)) {
    return <Navigate to={ROUTES.PROJECTS} replace />
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current access token
      const token = await getCurrentToken()
      if (!token) {
        throw new Error('No access token available')
      }

      // Get auth service URL from environment
      const authServiceUrl = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8788'

      const response = await fetch(`${authServiceUrl}/admin/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatStoreIds = (storeIds: string[]) => {
    if (storeIds.length === 0) return 'None'
    if (storeIds.length === 1) return (storeIds[0] || '').slice(0, 8) + '...'
    return `${storeIds.length} instances`
  }

  if (loading) {
    return (
      <div className='p-6'>
        <div className='flex items-center justify-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          <span className='ml-2 text-gray-600'>Loading users...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='p-6'>
        <div className='bg-red-50 border border-red-200 rounded-md p-4'>
          <div className='flex'>
            <div className='flex-shrink-0'>
              <svg className='h-5 w-5 text-red-400' viewBox='0 0 20 20' fill='currentColor'>
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
            <div className='ml-3'>
              <h3 className='text-sm font-medium text-red-800'>Error loading users</h3>
              <div className='mt-2 text-sm text-red-700'>
                <p>{error}</p>
              </div>
              <div className='mt-4'>
                <button
                  onClick={fetchUsers}
                  className='bg-red-100 px-3 py-2 rounded text-sm font-medium text-red-800 hover:bg-red-200'
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>Admin: Users</h1>
        <p className='mt-2 text-gray-600'>Manage all users and their Work Squared instances</p>
      </div>

      <div className='bg-white shadow overflow-hidden sm:rounded-md'>
        <div className='px-4 py-5 sm:px-6 border-b border-gray-200'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-lg leading-6 font-medium text-gray-900'>
                All Users ({users.length})
              </h3>
              <p className='mt-1 max-w-2xl text-sm text-gray-500'>
                Complete list of registered users and their instances
              </p>
            </div>
            <button
              onClick={fetchUsers}
              className='bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700'
            >
              Refresh
            </button>
          </div>
        </div>

        {users.length === 0 ? (
          <div className='text-center py-12'>
            <svg
              className='mx-auto h-12 w-12 text-gray-400'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
              />
            </svg>
            <h3 className='mt-2 text-sm font-medium text-gray-900'>No users found</h3>
            <p className='mt-1 text-sm text-gray-500'>No users have registered yet.</p>
          </div>
        ) : (
          <ul className='divide-y divide-gray-200'>
            {users.map(user => (
              <li key={user.email} className='px-4 py-4 sm:px-6'>
                <div className='flex items-center justify-between'>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between'>
                      <div>
                        <p className='text-sm font-medium text-gray-900 truncate'>{user.email}</p>
                        <p className='text-sm text-gray-500'>
                          Registered: {formatRegistrationDate(user.createdAt)}
                        </p>
                      </div>
                      <div className='flex items-center space-x-4'>
                        <div className='text-right'>
                          <p className='text-sm font-medium text-gray-900'>
                            {user.instanceCount}{' '}
                            {user.instanceCount === 1 ? 'instance' : 'instances'}
                          </p>
                          <p className='text-sm text-gray-500'>{formatStoreIds(user.storeIds)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
