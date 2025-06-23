import { makePersistedAdapter } from '@livestore/adapter-web'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
import { LiveStoreProvider } from '@livestore/react'
import React from 'react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'

import { ProjectsPage } from './components/ProjectsPage.js'
import { ProjectWorkspace } from './components/ProjectWorkspace.js'
import { Layout } from './components/Layout.js'
import { MainSection } from './components/MainSection.js'

// Redirect component for old board URLs
const BoardRedirect: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>()
  return <Navigate to={`/project/${boardId}`} replace />
}
import LiveStoreWorker from './livestore.worker?worker'
import { schema } from './livestore/schema.js'
import { makeTracer } from './otel.js'
import { getStoreId } from './util/store-id.js'

const AppBody: React.FC = () => (
  <BrowserRouter>
    <Layout>
      <Routes>
        <Route path='/projects' element={<ProjectsPage />} />
        <Route path='/project/:projectId' element={<ProjectWorkspace />} />
        <Route path='/boards' element={<Navigate to='/projects' replace />} />
        <Route path='/board/:boardId' element={<BoardRedirect />} />
        <Route path='/chat' element={<MainSection />} />
        <Route path='/' element={<Navigate to='/projects' replace />} />
      </Routes>
    </Layout>
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
