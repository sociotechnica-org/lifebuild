import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { formatRegistrationDate } from '../../utils/dates.js'
import { useAuth } from '../../contexts/AuthContext.js'
import { isCurrentUserAdmin } from '../../utils/adminCheck.jsx'
import { ROUTES } from '../../constants/routes.js'
import { AdminToggle } from './AdminToggle.js'
import { InstancesList } from './InstancesList.js'
import { AddInstanceForm } from './AddInstanceForm.js'
import { DeleteUserModal } from './DeleteUserModal.js'
import type { WorkspaceRole } from '@work-squared/shared/auth'

interface UserDetail {
  id: string
  email: string
  createdAt: string
  instances: Array<{
    id: string
    name: string
    createdAt: string
    lastAccessedAt: string
    role?: WorkspaceRole
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
  const [settingDefaultInstanceId, setSettingDefaultInstanceId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  const setDefaultInstance = async (instanceId: string) => {
    try {
      setSettingDefaultInstanceId(instanceId)
      setError(null)

      const token = await getCurrentToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const authServiceUrl = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8788'

      const response = await fetch(
        `${authServiceUrl}/admin/users/${encodeURIComponent(userEmail)}/set-default-instance`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ instanceId }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to set default instance')
      }

      // Refresh user detail to reflect the change
      await fetchUserDetail()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      console.error('Error setting default instance:', err)
    } finally {
      setSettingDefaultInstanceId(null)
    }
  }

  const deleteUser = async () => {
    try {
      setDeleting(true)

      const token = await getCurrentToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const authServiceUrl = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8788'

      const response = await fetch(
        `${authServiceUrl}/admin/users/${encodeURIComponent(userEmail)}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to delete user')
      }

      // Navigate back to admin users list
      navigate(ROUTES.ADMIN)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      console.error('Error deleting user:', err)
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
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
            <div>
              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={updating || deleting}
                className='px-4 py-2 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm font-medium transition-colors flex items-center gap-2'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                  />
                </svg>
                Delete User
              </button>
            </div>
          </div>
        </div>

        {/* Admin Status Section */}
        <AdminToggle
          isAdmin={userDetail.isAdmin ?? false}
          onToggle={(isAdmin: boolean) => updateAdminStatus(isAdmin)}
          disabled={updating}
        />

        {/* Instances Section */}
        <div className='bg-white border border-gray-200 rounded-lg p-6'>
          <h2 className='text-lg font-medium text-gray-900 mb-4'>Instances</h2>

          {/* Add Instance */}
          <div className='mb-6'>
            <AddInstanceForm
              onAddInstance={storeId => updateStoreIds('add', storeId)}
              disabled={updating}
            />
          </div>

          {/* Instances List */}
          <InstancesList
            instances={userDetail.instances}
            onRemoveInstance={instanceId => updateStoreIds('remove', instanceId)}
            onSetDefaultInstance={setDefaultInstance}
            removing={updating}
            settingDefaultInstanceId={settingDefaultInstanceId}
          />
        </div>

        {/* Delete User Modal */}
        <DeleteUserModal
          isOpen={showDeleteModal}
          userEmail={userDetail.email}
          onConfirm={deleteUser}
          onCancel={() => setShowDeleteModal(false)}
          isDeleting={deleting}
        />
      </div>
    </div>
  )
}
