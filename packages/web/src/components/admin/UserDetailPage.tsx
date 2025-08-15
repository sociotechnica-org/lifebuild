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
      <div className='p-6'>
        <div className='flex items-center justify-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          <span className='ml-2 text-gray-600'>Loading user details...</span>
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
    )
  }

  if (!userDetail) {
    return (
      <div className='p-6'>
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
    )
  }

  return (
    <div className='p-6'>
      {/* Header */}
      <div className='mb-6'>
        <div className='flex items-center justify-between'>
          <div>
            <button
              onClick={() => navigate(ROUTES.ADMIN)}
              className='flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-2'
            >
              <svg className='w-4 h-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 19l-7-7 7-7'
                />
              </svg>
              Back to Users
            </button>
            <h1 className='text-2xl font-bold text-gray-900'>User Details</h1>
            <p className='mt-2 text-gray-600'>Manage user settings and Work Squared instances</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className='bg-white shadow overflow-hidden sm:rounded-lg mb-6'>
        <div className='px-4 py-5 sm:px-6'>
          <h3 className='text-lg leading-6 font-medium text-gray-900'>User Information</h3>
          <p className='mt-1 max-w-2xl text-sm text-gray-500'>Basic details and account status</p>
        </div>
        <div className='border-t border-gray-200'>
          <dl>
            <div className='bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
              <dt className='text-sm font-medium text-gray-500'>Email</dt>
              <dd className='mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2'>
                {userDetail.email}
              </dd>
            </div>
            <div className='bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
              <dt className='text-sm font-medium text-gray-500'>Registration Date</dt>
              <dd className='mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2'>
                {formatRegistrationDate(userDetail.createdAt)}
              </dd>
            </div>
            <div className='bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
              <dt className='text-sm font-medium text-gray-500'>Admin Status</dt>
              <dd className='mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2'>
                <div className='flex items-center space-x-3'>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      userDetail.isAdmin
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {userDetail.isAdmin ? 'Admin' : 'User'}
                  </span>
                  <button
                    onClick={() => updateAdminStatus(!userDetail.isAdmin)}
                    disabled={updating}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      userDetail.isAdmin
                        ? 'bg-red-100 text-red-800 hover:bg-red-200'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    } disabled:opacity-50`}
                  >
                    {updating ? 'Updating...' : userDetail.isAdmin ? 'Revoke Admin' : 'Grant Admin'}
                  </button>
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Work Squared Instances */}
      <div className='bg-white shadow overflow-hidden sm:rounded-lg'>
        <div className='px-4 py-5 sm:px-6'>
          <h3 className='text-lg leading-6 font-medium text-gray-900'>
            Work Squared Instances ({userDetail.instances.length})
          </h3>
          <p className='mt-1 max-w-2xl text-sm text-gray-500'>
            Manage user access to Work Squared instances (storeIds)
          </p>
        </div>

        {/* Add Instance Form */}
        <div className='border-t border-gray-200 px-4 py-5 sm:px-6'>
          <form onSubmit={handleAddStoreId} className='flex space-x-3'>
            <div className='flex-1'>
              <input
                type='text'
                value={newStoreId}
                onChange={e => setNewStoreId(e.target.value)}
                placeholder='Enter new store ID'
                className='block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                disabled={updating}
              />
            </div>
            <button
              type='submit'
              disabled={updating || !newStoreId.trim()}
              className='bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50'
            >
              {updating ? 'Adding...' : 'Add Instance'}
            </button>
          </form>
        </div>

        {/* Instances List */}
        <div className='border-t border-gray-200'>
          {userDetail.instances.length === 0 ? (
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
                  d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
                />
              </svg>
              <h3 className='mt-2 text-sm font-medium text-gray-900'>No instances</h3>
              <p className='mt-1 text-sm text-gray-500'>This user has no Work Squared instances.</p>
            </div>
          ) : (
            <ul className='divide-y divide-gray-200'>
              {userDetail.instances.map(instance => (
                <li key={instance.id} className='px-4 py-4 sm:px-6'>
                  <div className='flex items-center justify-between'>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between'>
                        <div>
                          <p className='text-sm font-medium text-gray-900 truncate'>
                            {instance.id}
                            {instance.isDefault && (
                              <span className='ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full'>
                                Default
                              </span>
                            )}
                          </p>
                          <p className='text-sm text-gray-500'>{instance.name}</p>
                          <p className='text-xs text-gray-400'>
                            Created: {formatRegistrationDate(instance.createdAt)}
                          </p>
                        </div>
                        <div className='flex items-center space-x-2'>
                          {!instance.isDefault && (
                            <button
                              onClick={() => updateStoreIds('remove', instance.id)}
                              disabled={updating}
                              className='bg-red-100 text-red-800 px-3 py-1 rounded text-xs font-medium hover:bg-red-200 disabled:opacity-50'
                            >
                              {updating ? 'Removing...' : 'Remove'}
                            </button>
                          )}
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
    </div>
  )
}
