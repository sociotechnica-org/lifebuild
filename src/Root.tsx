import { makePersistedAdapter } from '@livestore/adapter-web'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
import { LiveStoreProvider } from '@livestore/react'
import React from 'react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { ProjectsPage } from './components/ProjectsPage.js'
import { ProjectWorkspace } from './components/ProjectWorkspace.js'
import { TasksPage } from './components/TasksPage.js'
import { Layout } from './components/Layout.js'
import { SessionRedirect } from './components/SessionRedirect.js'
import { SessionWrapper } from './components/SessionWrapper.js'
import { SessionAdminWrapper } from './components/SessionAdminWrapper.js'
import LiveStoreWorker from './livestore.worker?worker'
import { schema } from './livestore/schema.js'
import { makeTracer } from './otel.js'
import { getStoreId } from './util/store-id.js'

const AppBody: React.FC = () => (
  <BrowserRouter>
    <Routes>
      {/* Session-based routes */}
      <Route path='/session/:sessionId' element={<SessionWrapper />} />
      <Route path='/session/:sessionId/admin' element={<SessionAdminWrapper />} />

      {/* Original routes */}
      <Route
        path='/projects'
        element={
          <Layout>
            <ProjectsPage />
          </Layout>
        }
      />
      <Route
        path='/project/:projectId'
        element={
          <Layout>
            <ProjectWorkspace />
          </Layout>
        }
      />
      <Route
        path='/tasks'
        element={
          <Layout>
            <TasksPage />
          </Layout>
        }
      />
      <Route path='/orphaned-tasks' element={<Navigate to='/tasks' replace />} />

      {/* Root redirect to session */}
      <Route path='/' element={<SessionRedirect />} />
    </Routes>
  </BrowserRouter>
)

const storeId = getStoreId()

const adapter = makePersistedAdapter({
  storage: { type: 'opfs' },
  worker: LiveStoreWorker,
  sharedWorker: LiveStoreSharedWorker,
})

const otelTracer = makeTracer('work-squared-main')

export const App: React.FC = () => (
  <LiveStoreProvider
    schema={schema}
    renderLoading={_ => <div>Loading LiveStore ({_.stage})...</div>}
    adapter={adapter}
    batchUpdates={batchUpdates}
    storeId={storeId}
    otelOptions={{ tracer: otelTracer }}
    syncPayload={{ authToken: 'insecure-token-change-me' }}
  >
    <AppBody />
  </LiveStoreProvider>
)
