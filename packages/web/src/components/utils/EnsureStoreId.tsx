import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.js'
import { determineStoreIdFromUser } from '../../utils/navigation.js'

interface EnsureStoreIdProps {
  children: React.ReactNode
}

export const EnsureStoreId: React.FC<EnsureStoreIdProps> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const currentStoreId = urlParams.get('storeId')

    // Determine what the storeId should be based on user data (ignoring current URL)
    const userPreferredStoreId = determineStoreIdFromUser(user)

    // Update the storeId in the URL if:
    // 1. There's no storeId in the URL, OR
    // 2. User just loaded and their default/first instance differs from current URL storeId
    //    (this handles the case where we initially set a fallback storeId before user loaded)
    const shouldUpdate =
      !currentStoreId ||
      (user &&
        user.instances &&
        user.instances.length > 0 &&
        currentStoreId !== userPreferredStoreId &&
        // Only update if userPreferredStoreId matches user's default or first instance
        (userPreferredStoreId === user.defaultInstanceId ||
          userPreferredStoreId === user.instances[0]?.id))

    if (shouldUpdate) {
      // Store it in localStorage for future reference
      localStorage.setItem('storeId', userPreferredStoreId)

      // Add/update storeId in URL
      const newParams = new URLSearchParams(location.search)
      newParams.set('storeId', userPreferredStoreId)
      const newUrl = `${location.pathname}?${newParams.toString()}${location.hash}`
      navigate(newUrl, { replace: true })
    }
  }, [location.pathname, location.search, location.hash, navigate, user])

  // Always render children - don't block on storeId check
  return <>{children}</>
}
