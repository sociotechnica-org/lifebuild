import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.js'
import { buildRedirectUrl } from '../utils/navigation.js'

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login, isAuthenticated, isLoading: authLoading, user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Get redirect destination and success message from URL params
  const redirectTo = searchParams.get('redirect') || '/'
  const successMessage = searchParams.get('message')

  // Check if we're in development mode (simple check for dev mode indicator)
  const isDevelopmentMode = import.meta.env.DEV || import.meta.env.VITE_REQUIRE_AUTH === 'false'

  // Redirect if already authenticated (but only after auth loading is complete)
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const redirectUrl = buildRedirectUrl(redirectTo, user)
      navigate(redirectUrl, { replace: true })
    }
  }, [authLoading, isAuthenticated, navigate, redirectTo, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const success = await login(email, password)
      if (success) {
        // Don't navigate here - let the useEffect handle it after user state updates
        // The useEffect will trigger once isAuthenticated becomes true and user is populated
      } else {
        setError('Invalid email or password')
      }
    } catch {
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = email.trim() !== '' && password.trim() !== ''
  const isFormDisabled = isLoading || authLoading

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='text-center'>
          <h1 className='text-3xl font-bold text-gray-900'>Work Squared</h1>
          <h2 className='mt-4 text-2xl font-semibold text-gray-700'>Sign in to your account</h2>
          {isDevelopmentMode && (
            <div className='mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
              Dev Mode
            </div>
          )}
        </div>
      </div>

      <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
          <form className='space-y-6' onSubmit={handleSubmit}>
            {successMessage && (
              <div className='rounded-md bg-green-50 p-4'>
                <div className='text-sm text-green-700'>{successMessage}</div>
              </div>
            )}
            {error && (
              <div className='rounded-md bg-red-50 p-4'>
                <div className='text-sm text-red-700'>{error}</div>
              </div>
            )}

            <div>
              <label htmlFor='email' className='block text-sm font-medium text-gray-700'>
                Email address
              </label>
              <div className='mt-1'>
                <input
                  id='email'
                  name='email'
                  type='email'
                  autoComplete='email'
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                  placeholder='Enter your email'
                />
              </div>
            </div>

            <div>
              <label htmlFor='password' className='block text-sm font-medium text-gray-700'>
                Password
              </label>
              <div className='mt-1'>
                <input
                  id='password'
                  name='password'
                  type='password'
                  autoComplete='current-password'
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                  placeholder='Enter your password'
                />
              </div>
            </div>

            <div className='flex items-center justify-between'>
              <div className='text-sm'>
                <a href='#' className='font-medium text-indigo-600 hover:text-indigo-500'>
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type='submit'
                disabled={!isFormValid || isFormDisabled}
                className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isLoading ? 'Signing in...' : authLoading ? 'Loading...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
