import React from 'react'
import type { StaticRoomDefinition } from '@lifebuild/shared/rooms'
import { NewUiShell } from './NewUiShell.js'

type RoomLayoutProps = {
  room: StaticRoomDefinition
  children: React.ReactNode
  /** When true, disables scrolling on main content (children handle their own scrolling) */
  noScroll?: boolean
}

export const RoomLayout: React.FC<RoomLayoutProps> = ({ room, children, noScroll = false }) => {
  const isLifeMapRoom = room.roomId === 'life-map'

  return (
    <NewUiShell fullHeight noScroll={noScroll || isLifeMapRoom} fullBleed={isLifeMapRoom}>
      <div className={isLifeMapRoom ? 'h-full flex' : 'h-full flex gap-4'}>
        <div className='h-full flex-1 min-w-0'>{children}</div>
      </div>
    </NewUiShell>
  )
}
