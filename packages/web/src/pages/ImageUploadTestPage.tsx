import React, { useState } from 'react'
import { useStore } from '@livestore/react'
import { events } from '@work-squared/shared/schema'
import { useAuth } from '../contexts/AuthContext.js'
import { ImageUpload } from '../components/common/ImageUpload.js'

/**
 * Test page for image upload functionality
 * Navigate to /test-image-upload to test R2 image uploads
 */
export const ImageUploadTestPage: React.FC = () => {
  const { store } = useStore()
  const { user } = useAuth()
  const [uploadedUrl, setUploadedUrl] = useState<string>('')
  const [testProjectId] = useState(() => crypto.randomUUID())

  const handleUploadComplete = async (url: string) => {
    setUploadedUrl(url)

    if (url) {
      // Commit the event to test the full flow
      await store.commit(
        events.projectCoverImageSet({
          projectId: testProjectId,
          coverImageUrl: url,
          updatedAt: new Date(),
          actorId: user?.id,
        })
      )
      console.log('✅ projectCoverImageSet event committed successfully')
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>Image Upload Test Page</h1>

      <div
        style={{
          padding: '1.5rem',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          marginBottom: '1rem',
        }}
      >
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Upload Test</h2>

        <ImageUpload onUploadComplete={handleUploadComplete} currentImageUrl={uploadedUrl} />

        {uploadedUrl && (
          <div style={{ marginTop: '1.5rem' }}>
            <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Upload successful!</p>
            <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              URL: <code>{uploadedUrl}</code>
            </p>
            <p style={{ fontSize: '0.875rem', color: '#666' }}>
              Test Project ID: <code>{testProjectId}</code>
            </p>
          </div>
        )}
      </div>

      <div
        style={{
          padding: '1.5rem',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>How to Test:</h3>
        <ol style={{ marginLeft: '1.5rem', fontSize: '0.875rem', lineHeight: '1.6' }}>
          <li>Click "Upload Cover Image" button</li>
          <li>Select an image (JPEG, PNG, WebP, or GIF, max 5MB)</li>
          <li>Image will upload to R2 and display preview</li>
          <li>Event will be committed to LiveStore</li>
          <li>Check browser console for success message</li>
          <li>Click "Change Image" to upload a different image</li>
          <li>Click "Remove" to clear the image</li>
        </ol>

        <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '1rem' }}>
          Technical Details:
        </h3>
        <ul style={{ marginLeft: '1.5rem', fontSize: '0.875rem', lineHeight: '1.6' }}>
          <li>
            <strong>Upload Endpoint:</strong> POST /api/upload-image
          </li>
          <li>
            <strong>Retrieval:</strong> GET /api/images/:key
          </li>
          <li>
            <strong>Storage:</strong> Cloudflare R2 (local simulator in dev mode)
          </li>
          <li>
            <strong>Event:</strong> v1.ProjectCoverImageSet
          </li>
          <li>
            <strong>Max Size:</strong> 5MB
          </li>
          <li>
            <strong>Allowed Types:</strong> JPEG, PNG, WebP, GIF
          </li>
        </ul>

        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>
            <strong>Note:</strong> In local development, images are stored in Wrangler's ephemeral
            R2 simulator. They will be cleared when you restart the dev server.
          </p>
        </div>
      </div>
    </div>
  )
}
