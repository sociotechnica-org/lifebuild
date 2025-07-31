import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.js'

export const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Check if we're in development mode
  const isDevelopmentMode = import.meta.env.DEV || import.meta.env.VITE_REQUIRE_AUTH === 'false'

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email is required')
      return false
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      return false
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Call signup API directly since AuthContext doesn't have signup method yet
      const authServiceUrl =
        import.meta.env.VITE_AUTH_SERVICE_URL || 'https://work-squared-auth.jessmartin.workers.dev'

      const response = await fetch(`${authServiceUrl}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `Signup failed: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        // Redirect to login with success message
        navigate('/login?message=Account created successfully. Please sign in.')
      } else {
        setError(data.error?.message || 'Signup failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed. Please try again.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = email.trim() !== '' && password.trim() !== '' && confirmPassword.trim() !== ''

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='text-center'>
          <h1 className='text-3xl font-bold text-gray-900'>Work Squared</h1>
          <h2 className='mt-4 text-2xl font-semibold text-gray-700'>Create your account</h2>
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
                  autoComplete='new-password'
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                  placeholder='Enter your password'
                />
              </div>
              <p className='mt-1 text-xs text-gray-500'>Must be at least 6 characters long</p>
            </div>

            <div>
              <label htmlFor='confirmPassword' className='block text-sm font-medium text-gray-700'>
                Confirm password
              </label>
              <div className='mt-1'>
                <input
                  id='confirmPassword'
                  name='confirmPassword'
                  type='password'
                  autoComplete='new-password'
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                  placeholder='Confirm your password'
                />
              </div>
            </div>

            <div className='text-xs text-gray-500'>
              By creating an account, you agree to our{' '}
              <a href='#' className='text-indigo-600 hover:text-indigo-500'>
                Terms of Service
              </a>{' '}
              and{' '}
              <a href='#' className='text-indigo-600 hover:text-indigo-500'>
                Privacy Policy
              </a>
              .
            </div>

            <div>
              <button
                type='submit'
                disabled={!isFormValid || isLoading}
                className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </div>

            <div className='text-center'>
              <span className='text-sm text-gray-600'>
                Already have an account?{' '}
                <Link to='/login' className='font-medium text-indigo-600 hover:text-indigo-500'>
                  Sign in
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
