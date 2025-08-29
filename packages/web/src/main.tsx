import './index.css'

import React from 'react'
import ReactDOM from 'react-dom/client'

import { App } from './Root.js'
import { initAnalytics, capture } from './lib/analytics.js'

initAnalytics()
capture('app_started')

const rootElement = document.getElementById('react-app')
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<App />)
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
