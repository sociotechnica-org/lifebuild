import React, { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.js'
import { isCurrentUserAdmin } from '../../utils/adminCheck.jsx'
import { ROUTES } from '../../constants/routes.js'
import { UserList } from './UserList.js'

interface AdminUser {
  email: string
  createdAt: string
  storeIds: string[]
  instanceCount: number
  isAdmin?: boolean
}

export const AdminUsersPage: React.FC = () => {
  const { user, getCurrentToken, isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
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
  }, [getCurrentToken])

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && isCurrentUserAdmin(user)) {
      void fetchUsers()
    }
  }, [fetchUsers, isAuthLoading, isAuthenticated, user])

  // Check admin access - redirect if not authenticated or not admin
  if (!isAuthenticated) {
    if (isAuthLoading) {
      return (
        <div className='p-6 bg-white min-h-screen'>
          <div className='max-w-7xl mx-auto'>
            <div className='mb-6'>
              <h1 className='text-2xl font-bold text-gray-900'>Admin Users</h1>
              <p className='text-gray-600 mt-1'>Manage registered users and their admin status</p>
            </div>
            <div className='flex justify-center items-center py-12'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
              <span className='ml-2 text-gray-600'>Verifying access...</span>
            </div>
          </div>
        </div>
      )
    }
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (!isCurrentUserAdmin(user)) {
    return <Navigate to={ROUTES.PROJECTS} replace />
  }

  if (loading) {
    return (
      <div className='p-6 bg-white min-h-screen'>
        <div className='max-w-7xl mx-auto'>
          <div className='mb-6'>
            <h1 className='text-2xl font-bold text-gray-900'>Admin Users</h1>
            <p className='text-gray-600 mt-1'>Manage registered users and their admin status</p>
          </div>
          <div className='flex justify-center items-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            <span className='ml-2 text-gray-600'>Loading users...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='p-6 bg-white min-h-screen'>
        <div className='max-w-7xl mx-auto'>
          <div className='mb-6'>
            <h1 className='text-2xl font-bold text-gray-900'>Admin Users</h1>
            <p className='text-gray-600 mt-1'>Manage registered users and their admin status</p>
          </div>
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <svg
                  className='h-5 w-5 text-red-400'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                  aria-hidden='true'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z'
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
      </div>
    )
  }

  return (
    <div className='p-6 bg-white min-h-screen'>
      <div className='max-w-7xl mx-auto'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-gray-900'>Admin Users</h1>
          <p className='text-gray-600 mt-1'>Manage registered users and their admin status</p>
        </div>

        <UserList users={users} />
      </div>
    </div>
  )
}
