import './index.css'
// IMPORTANT: Import Sentry instrumentation first, before React
import './instrument.js'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { PostHogProvider } from 'posthog-js/react'

import { App } from './Root.js'

// Display LifeBuild ASCII art logo and version in console
const version = import.meta.env.VITE_APP_VERSION || '0.1.0'
const logLifeBuildBanner = () => {
  const asciiArt = `
██▌  ██  ██▀▀▀▀ ██▀▀▀▀ ██▀▀██▄  ██   ██  ██  ██▌    ▐██▀▀██▄
██▌  ██  ██     ██     ██  ▐██  ██   ██  ██  ██▌    ▐██  ▐██
██▌  ██  ██     ██     ██  ▐██  ██   ██  ██  ██▌    ▐██  ▐██
██▌  ██  ██▀▀   ██▀▀   ██▀▀██▀  ██   ██  ██  ██▌    ▐██  ▐██
██▌  ██  ██     ██     ██  ▐██  ██   ██  ██  ██▌    ▐██  ▐██
██▌  ██  ██     ██     ██  ▐██  ██   ██  ██  ██▌    ▐██  ▐██
██▌  ▀▀  ██     ██     ██  ▐██  ██   ██ ▄▄▄▄ ██▌    ▐██  ▐██
███▄▄▄▄  ██     ██▄▄▄▄ ██▄▄██▀  ▀██▄██▀ ▄▄▄▄ ███▄▄▄ ▐██▄▄██▀
`

  console.log(`%c${asciiArt}`, 'color: #111111; font-family: monospace; font-weight: bold;')
  console.log(
    `%cv${version}%c | https://lifebuild.me`,
    'color: #111111; font-weight: bold; font-size: 14px;',
    'color: #888; font-size: 12px;'
  )
  console.log(
    '%cBuilt by Danvers Fleury and Jess Martin, because we needed it first.',
    'color: #888; font-style: italic; font-size: 11px;'
  )
}

logLifeBuildBanner()

const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY
const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST
const isProduction = import.meta.env.PROD

// Only enable PostHog in production
const shouldEnablePosthog = posthogKey && isProduction

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
    shouldEnablePosthog ? (
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
