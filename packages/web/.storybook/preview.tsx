import type { Preview } from '@storybook/react-vite'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../src/contexts/AuthContext.js'
import '../src/index.css'

// For now, skip LiveStore in Storybook to focus on component testing
// TODO: Re-enable LiveStore once adapter issues are resolved

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
      // Wrap stories with basic providers for components that use auth/routing
      // LiveStore temporarily disabled to resolve adapter issues
      return (
        <BrowserRouter>
          <AuthProvider>
            <div data-testid='storybook-wrapper'>
              <Story />
            </div>
          </AuthProvider>
        </BrowserRouter>
      )
    },
  ],
}

export default preview
