import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.js'
import { determineStoreId } from '../../utils/navigation.js'

interface EnsureStoreIdProps {
  children: React.ReactNode
}

export const EnsureStoreId: React.FC<EnsureStoreIdProps> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    // Only redirect if we don't have storeId in URL
    const urlParams = new URLSearchParams(location.search)
    const hasStoreId = urlParams.get('storeId')

    if (!hasStoreId) {
      // Use the same logic as buildRedirectUrl to determine storeId
      // This ensures consistency with post-login redirect
      const currentUrl = location.pathname + location.search
      const storeId = determineStoreId(currentUrl, user)

      // Store it in localStorage for future reference
      localStorage.setItem('storeId', storeId)

      // Add storeId to URL using URLSearchParams to avoid duplicates
      const newParams = new URLSearchParams(location.search)
      newParams.set('storeId', storeId)
      const newUrl = `${location.pathname}?${newParams.toString()}${location.hash}`
      navigate(newUrl, { replace: true })
    }
  }, [location.pathname, location.search, location.hash, navigate, user])

  // Always render children - don't block on storeId check
  return <>{children}</>
}
