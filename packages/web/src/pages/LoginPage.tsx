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
    <div className='min-h-screen bg-[#faf9f7] flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='text-center'>
          <img src='/lifebuild-logo.webp' alt='LifeBuild' className='h-12 mx-auto' />
          <h2 className="font-['Source_Serif_4',Georgia,serif] mt-4 text-2xl font-semibold text-[#2f2b27]">
            Sign in to your account
          </h2>
          {isDevelopmentMode && (
            <div className='mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
              Dev Mode
            </div>
          )}
        </div>
      </div>

      <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='bg-white py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-[#e8e4de]'>
          <form className='space-y-6' onSubmit={handleSubmit}>
            {successMessage && (
              <div className='rounded-lg bg-green-50 p-4 border border-green-100'>
                <div className='text-sm text-green-700'>{successMessage}</div>
              </div>
            )}
            {error && (
              <div className='rounded-lg bg-red-50 p-4 border border-red-100'>
                <div className='text-sm text-red-700'>{error}</div>
              </div>
            )}

            <div>
              <label htmlFor='email' className='block text-sm font-semibold text-[#2f2b27]'>
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
                  className='appearance-none block w-full px-3 py-2.5 border border-[#e8e4de] rounded-lg placeholder-[#8b8680] text-[#2f2b27] focus:outline-none focus:border-[#d0ccc5] text-sm'
                  placeholder='Enter your email'
                />
              </div>
            </div>

            <div>
              <label htmlFor='password' className='block text-sm font-semibold text-[#2f2b27]'>
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
                  className='appearance-none block w-full px-3 py-2.5 border border-[#e8e4de] rounded-lg placeholder-[#8b8680] text-[#2f2b27] focus:outline-none focus:border-[#d0ccc5] text-sm'
                  placeholder='Enter your password'
                />
              </div>
            </div>

            <div className='flex items-center justify-between'>
              <div className='text-sm'>
                <a href='#' className='font-medium text-[#2f2b27] hover:underline'>
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type='submit'
                disabled={!isFormValid || isFormDisabled}
                className='w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-[#faf9f7] bg-[#2f2b27] hover:bg-[#4a4540] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d0ccc5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
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
