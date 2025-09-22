import React, { useState } from 'react'
import { makePersistedAdapter } from '@livestore/adapter-web'
import { LiveStoreProvider, useLiveStore } from '@livestore/react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { schema } from './schema'
import Worker from './worker?worker'

const adapter = makePersistedAdapter({
  storage: { type: 'memory' },
  worker: Worker,
})

const syncPayload = { authToken: 'insecure-token-change-me' }

function ProjectApp() {
  const [newProject, setNewProject] = useState('')
  const store = useLiveStore()

  const projects = store.query((db) =>
    db.table('projects').select('*').where({ deletedAt: null })
  ) || []

  const addProject = async () => {
    if (newProject.trim()) {
      const now = new Date()
      await store.mutate([{
        type: 'v1.ProjectCreated',
        id: crypto.randomUUID(),
        name: newProject.trim(),
        description: 'Debug project',
        createdAt: now,
        actorId: 'debug-user',
      }])
      setNewProject('')
    }
  }

  console.log('📋 Current projects:', projects)

  return (
    <div style={{ padding: 20 }}>
      <h1>LiveStore Sync Debug - Projects</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          value={newProject}
          onChange={(e) => setNewProject(e.target.value)}
          placeholder="Add a project..."
          onKeyPress={(e) => e.key === 'Enter' && addProject()}
        />
        <button onClick={addProject}>Add Project</button>
      </div>

      <div>
        <h3>Projects ({projects.length}):</h3>
        {projects.map((project) => (
          <div key={project.id} style={{ marginBottom: 10, border: '1px solid #ccc', padding: 10 }}>
            <strong>{project.name}</strong>
            <div>{project.description}</div>
            <small>Created: {new Date(project.createdAt).toLocaleString()}</small>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, padding: 10, backgroundColor: '#f0f0f0' }}>
        <strong>Debug Info:</strong>
        <div>Total projects: {projects.length}</div>
        <div>Store ID: {store.storeId}</div>
        <div>Sync URL: ws://localhost:8787</div>
        <div>Auth Token: insecure-token-change-me</div>
      </div>
    </div>
  )
}

export default function App() {
  console.log('🏗️ App starting with sync payload:', syncPayload)

  return (
    <LiveStoreProvider
      schema={schema}
      adapter={adapter}
      batchUpdates={batchUpdates}
      storeId="debug-sync-test"
      syncPayload={syncPayload}
      renderLoading={(stage) => <div>Loading LiveStore ({stage.stage})...</div>}
    >
      <ProjectApp />
    </LiveStoreProvider>
  )
}