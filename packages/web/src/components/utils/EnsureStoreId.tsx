import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

interface EnsureStoreIdProps {
  children: React.ReactNode
}

export const EnsureStoreId: React.FC<EnsureStoreIdProps> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // Only redirect if we don't have storeId in URL
    const urlParams = new URLSearchParams(location.search)
    const hasStoreId = urlParams.get('storeId')

    if (!hasStoreId) {
      // Get storeId from localStorage or create new one
      let storeId = localStorage.getItem('storeId')
      if (!storeId) {
        storeId = crypto.randomUUID()
        localStorage.setItem('storeId', storeId)
      }

      // Add storeId to URL using URLSearchParams to avoid duplicates
      const newParams = new URLSearchParams(location.search)
      newParams.set('storeId', storeId)
      const newUrl = `${location.pathname}?${newParams.toString()}${location.hash}`
      navigate(newUrl, { replace: true })
    }
  }, [location.pathname, location.search, location.hash, navigate])

  // Always render children - don't block on storeId check
  return <>{children}</>
}
