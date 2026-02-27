import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import type { Store } from '@livestore/livestore'
import { SanctuaryOverlayContent } from './SanctuaryOverlayContent.js'
import { BuildingOverlay } from '../layout/BuildingOverlay.js'
import { events, schema } from '@lifebuild/shared/schema'
import { LiveStoreProvider } from '../../livestore-compat.js'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { MemoryRouter } from 'react-router-dom'
import { AttendantRailProvider } from '../layout/AttendantRailProvider.js'
import { SANCTUARY_FIRST_VISIT_SETTING_KEY } from '../../constants/sanctuary.js'

const meta: Meta<typeof SanctuaryOverlayContent> = {
  title: 'Buildings/SanctuaryOverlayContent',
  component: SanctuaryOverlayContent,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

const MapBackdrop: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className='relative h-dvh w-full overflow-hidden bg-[radial-gradient(circle_at_20%_20%,#fff8ec_0%,#efe2cd_45%,#d9c5a8_100%)]'>
      <div className='absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.22),rgba(0,0,0,0.05))]' />
      <div className='absolute inset-0'>{children}</div>
    </div>
  )
}

const withLiveStore =
  (boot?: (store: Store) => void) =>
  (Story: React.ComponentType): React.ReactElement => {
    return (
      <MemoryRouter initialEntries={['/sanctuary']}>
        <LiveStoreProvider
          schema={schema}
          adapter={makeInMemoryAdapter()}
          batchUpdates={batchUpdates}
          boot={store => {
            boot?.(store)
          }}
        >
          <AttendantRailProvider>
            <MapBackdrop>
              <BuildingOverlay title='Sanctuary' onClose={() => {}}>
                <Story />
              </BuildingOverlay>
            </MapBackdrop>
          </AttendantRailProvider>
        </LiveStoreProvider>
      </MemoryRouter>
    )
  }

export const Default: Story = {
  decorators: [withLiveStore()],
  render: () => <SanctuaryOverlayContent />,
}

export const InBuildingOverlayFrame: Story = {
  decorators: [
    withLiveStore(store => {
      store.commit(
        events.settingUpdated({
          key: SANCTUARY_FIRST_VISIT_SETTING_KEY,
          value: new Date('2026-02-27T00:00:00.000Z').toISOString(),
          updatedAt: new Date('2026-02-27T00:00:00.000Z'),
        })
      )
    }),
  ],
  render: () => <SanctuaryOverlayContent />,
}
