import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { formatRegistrationDate } from '../../util/dates.js'
import { useAuth } from '../../contexts/AuthContext.js'
import { isCurrentUserAdmin } from '../../utils/adminCheck.jsx'
import { ROUTES } from '../../constants/routes.js'

interface UserDetail {
  id: string
  email: string
  createdAt: string
  instances: Array<{
    id: string
    name: string
    createdAt: string
    lastAccessedAt: string
    isDefault?: boolean
  }>
  isAdmin?: boolean
}

export const UserDetailPage: React.FC = () => {
  const { userEmail } = useParams<{ userEmail: string }>()
  const navigate = useNavigate()
  const { user, getCurrentToken, isAuthenticated } = useAuth()
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [newStoreId, setNewStoreId] = useState('')

  useEffect(() => {
    if (userEmail) {
      fetchUserDetail()
    }
  }, [userEmail])

  // Check admin access - redirect if not authenticated or not admin
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (!isCurrentUserAdmin(user)) {
    return <Navigate to={ROUTES.PROJECTS} replace />
  }

  if (!userEmail) {
    return <Navigate to={ROUTES.ADMIN} replace />
  }

  const fetchUserDetail = async () => {
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

      const response = await fetch(
        `${authServiceUrl}/admin/users/${encodeURIComponent(userEmail)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setUserDetail(data.user || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      console.error('Error fetching user detail:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateStoreIds = async (action: 'add' | 'remove', storeId: string) => {
    try {
      setUpdating(true)

      const token = await getCurrentToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const authServiceUrl = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8788'

      const response = await fetch(
        `${authServiceUrl}/admin/users/${encodeURIComponent(userEmail)}/store-ids`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action, storeId }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `Failed to ${action} store ID`)
      }

      // Refresh user detail
      await fetchUserDetail()
      if (action === 'add') {
        setNewStoreId('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      console.error(`Error ${action}ing store ID:`, err)
    } finally {
      setUpdating(false)
    }
  }

  const updateAdminStatus = async (isAdmin: boolean) => {
    try {
      setUpdating(true)

      const token = await getCurrentToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const authServiceUrl = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8788'

      const response = await fetch(
        `${authServiceUrl}/admin/users/${encodeURIComponent(userEmail)}/admin-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isAdmin }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to update admin status')
      }

      // Refresh user detail
      await fetchUserDetail()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      console.error('Error updating admin status:', err)
    } finally {
      setUpdating(false)
    }
  }

  const handleAddStoreId = (e: React.FormEvent) => {
    e.preventDefault()
    if (newStoreId.trim()) {
      updateStoreIds('add', newStoreId.trim())
    }
  }

  if (loading) {
    return (
      <div className='p-6 bg-white min-h-screen'>
        <div className='max-w-4xl mx-auto'>
          <div className='flex justify-center items-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            <span className='ml-2 text-gray-600'>Loading user details...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='p-6 bg-white min-h-screen'>
        <div className='max-w-4xl mx-auto'>
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md'>
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
                <h3 className='text-sm font-medium text-red-800'>Error loading user</h3>
                <div className='mt-2 text-sm text-red-700'>
                  <p>{error}</p>
                </div>
                <div className='mt-4'>
                  <button
                    onClick={fetchUserDetail}
                    className='bg-red-100 px-3 py-2 rounded text-sm font-medium text-red-800 hover:bg-red-200'
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => navigate(ROUTES.ADMIN)}
                    className='ml-2 bg-gray-100 px-3 py-2 rounded text-sm font-medium text-gray-800 hover:bg-gray-200'
                  >
                    Back to Users
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!userDetail) {
    return (
      <div className='p-6 bg-white min-h-screen'>
        <div className='max-w-4xl mx-auto'>
          <div className='text-center py-12'>
            <h3 className='mt-2 text-sm font-medium text-gray-900'>User not found</h3>
            <p className='mt-1 text-sm text-gray-500'>The requested user could not be found.</p>
            <div className='mt-6'>
              <button
                onClick={() => navigate(ROUTES.ADMIN)}
                className='bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700'
              >
                Back to Users
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6 bg-white min-h-screen'>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <div className='mb-6'>
          <div className='flex items-center gap-4 mb-3'>
            <button
              onClick={() => navigate(ROUTES.ADMIN)}
              className='flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors'
            >
              <svg
                className='w-4 h-4 text-gray-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 19l-7-7 7-7'
                />
              </svg>
            </button>
            <nav className='flex items-center text-sm text-gray-500'>
              <span className='hover:text-gray-700 transition-colors'>Admin Users</span>
              <svg className='w-4 h-4 mx-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 5l7 7-7 7'
                />
              </svg>
              <span className='text-gray-900 font-medium'>{userDetail.email}</span>
            </nav>
          </div>

          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900 flex items-center gap-3'>
                {userDetail.email}
                {userDetail.isAdmin && (
                  <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                    Admin
                  </span>
                )}
              </h1>
              <p className='text-gray-600'>
                Created on {formatRegistrationDate(userDetail.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Admin Status Section */}
        <div className='bg-white border border-gray-200 rounded-lg p-6 mb-6'>
          <h2 className='text-lg font-medium text-gray-900 mb-4'>Admin Status</h2>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-900'>Admin Access</p>
              <p className='text-sm text-gray-500'>
                {userDetail.isAdmin
                  ? 'This user has administrator privileges'
                  : 'This user does not have administrator privileges'}
              </p>
            </div>
            <button
              onClick={() => updateAdminStatus(!userDetail.isAdmin)}
              disabled={updating}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                userDetail.isAdmin ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  userDetail.isAdmin ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Instances Section */}
        <div className='bg-white border border-gray-200 rounded-lg p-6'>
          <h2 className='text-lg font-medium text-gray-900 mb-4'>Instances</h2>

          {/* Add Instance */}
          <div className='mb-6'>
            <form onSubmit={handleAddStoreId} className='flex gap-3'>
              <input
                type='text'
                value={newStoreId}
                onChange={e => setNewStoreId(e.target.value)}
                placeholder='store_abc123'
                className='flex-1 min-w-0 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                disabled={updating}
              />
              <button
                type='submit'
                disabled={updating || !newStoreId.trim()}
                className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed'
              >
                {updating ? 'Adding...' : 'Add Instance'}
              </button>
            </form>
          </div>

          {/* Instances List */}
          {userDetail.instances.length === 0 ? (
            <div className='text-center py-6'>
              <p className='text-gray-500'>No instances found for this user.</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {userDetail.instances.map(instance => (
                <div
                  key={instance.id}
                  className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
                >
                  <div className='flex-1'>
                    <div className='flex items-center gap-2'>
                      <h3 className='text-sm font-medium text-gray-900'>{instance.name}</h3>
                      {instance.isDefault && (
                        <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                          Default
                        </span>
                      )}
                    </div>
                    <p className='text-sm text-gray-500'>ID: {instance.id}</p>
                    <p className='text-xs text-gray-400'>
                      Created: {formatRegistrationDate(instance.createdAt)} • Last accessed:{' '}
                      {formatRegistrationDate(instance.lastAccessedAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => updateStoreIds('remove', instance.id)}
                    disabled={instance.isDefault || updating}
                    className='ml-4 inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed'
                  >
                    {instance.isDefault ? 'Default' : updating ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
