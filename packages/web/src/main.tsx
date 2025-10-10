import './index.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { PostHogProvider } from 'posthog-js/react'

import { App } from './Root.js'

const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY
const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST

const options = {
  api_host: posthogHost || 'https://us.i.posthog.com',
  defaults: '2025-05-24' as const,
  capture_pageview: true,
  persistence: 'localStorage+cookie' as const,
  debug: import.meta.env.DEV,
}

const rootElement = document.getElementById('react-app')
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    posthogKey ? (
      <PostHogProvider apiKey={posthogKey} options={options}>
        <App />
      </PostHogProvider>
    ) : (
      <App />
    )
  )
} else {
  console.error('Root element not found')
}

// Alternative strict mode setup:
// const rootElement = document.getElementById('react-app')
// if (rootElement) {
//   ReactDOM.createRoot(rootElement).render(
//     <React.StrictMode>
//       <App />
//     </React.StrictMode>
//   )
// }
