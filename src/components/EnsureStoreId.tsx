import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

interface EnsureStoreIdProps {
  children: React.ReactNode
}

export const EnsureStoreId: React.FC<EnsureStoreIdProps> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // Only redirect if we don't have storeId and we're not already redirecting
    const urlParams = new URLSearchParams(location.search)
    const hasStoreId = urlParams.get('storeId')

    if (!hasStoreId) {
      // Get or create storeId from localStorage
      let storeId = localStorage.getItem('storeId')
      if (!storeId) {
        storeId = crypto.randomUUID()
        localStorage.setItem('storeId', storeId)
      }

      // Add storeId to current URL
      const newSearch = `${location.search ? location.search + '&' : '?'}storeId=${storeId}`
      const newUrl = `${location.pathname}${newSearch}${location.hash}`
      navigate(newUrl, { replace: true })
    }
  }, [location.pathname, location.search, location.hash, navigate])

  // Always render children - don't block on storeId check
  return <>{children}</>
}
