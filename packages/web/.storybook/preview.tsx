import type { Preview } from '@storybook/react-vite'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../src/contexts/AuthContext.js'
import '../src/index.css'

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
      // Wrap stories with necessary providers for components that use auth/routing
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
