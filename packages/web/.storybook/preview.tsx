import type { Preview } from '@storybook/react-vite'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { LiveStoreProvider } from '@livestore/react'
import { makePersistedAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { AuthProvider } from '../src/contexts/AuthContext.js'
import { schema } from '@work-squared/shared/schema'
import { LoadingState } from '../src/components/ui/LoadingState.js'
import '../src/index.css'

// Minimal adapter for Storybook - no persistence, no worker
const storybookAdapter = makePersistedAdapter({
  storage: { type: 'memory' },
})

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    Story => {
      // Wrap stories with necessary providers for components that use auth/routing/store
      return (
        <BrowserRouter>
          <AuthProvider>
            <LiveStoreProvider
              schema={schema}
              renderLoading={_ => (
                <LoadingState message={`Loading LiveStore (${_.stage})...`} fullScreen />
              )}
              adapter={storybookAdapter}
              batchUpdates={batchUpdates}
              storeId='storybook-store'
              syncPayload={{}}
            >
              <div data-testid='storybook-wrapper'>
                <Story />
              </div>
            </LiveStoreProvider>
          </AuthProvider>
        </BrowserRouter>
      )
    },
  ],
}

export default preview
