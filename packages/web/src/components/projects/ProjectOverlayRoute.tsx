import React, { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes.js'
import { BuildingOverlay } from '../layout/BuildingOverlay.js'
import { ProjectDetailPage } from './ProjectDetailPage.js'

type OverlayCloseResolutionInput = {
  openedFromMap: boolean
  historyLength: number
  search: string
}

type OverlayCloseResolution = { type: 'back' } | { type: 'home'; search: string }

export const resolveMapOverlayCloseAction = ({
  openedFromMap,
  historyLength,
  search,
}: OverlayCloseResolutionInput): OverlayCloseResolution => {
  if (openedFromMap && historyLength > 1) {
    return { type: 'back' }
  }

  return { type: 'home', search }
}

export const useCloseMapOverlayRoute = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const openedFromMap = Boolean(
    (location.state as { openedFromMap?: boolean } | null)?.openedFromMap
  )

  return useCallback(() => {
    const closeAction = resolveMapOverlayCloseAction({
      openedFromMap,
      historyLength: window.history.length,
      search: location.search,
    })

    if (closeAction.type === 'back') {
      navigate(-1)
      return
    }

    navigate({ pathname: ROUTES.HOME, search: closeAction.search }, { replace: true })
  }, [location.search, navigate, openedFromMap])
}

export const ProjectOverlayRoute: React.FC = () => {
  const closeOverlay = useCloseMapOverlayRoute()

  return (
    <BuildingOverlay title='Project Board' onClose={closeOverlay} panelClassName='max-w-[1100px]'>
      <ProjectDetailPage onCloseOverlay={closeOverlay} />
    </BuildingOverlay>
  )
}
