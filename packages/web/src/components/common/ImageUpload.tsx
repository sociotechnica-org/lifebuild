import React, { useState, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext.js'

interface ImageUploadProps {
  onUploadComplete: (url: string) => void
  currentImageUrl?: string | null
  maxSizeMB?: number
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadComplete,
  currentImageUrl,
  maxSizeMB = 5,
}) => {
  const { getCurrentToken } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset error
    setError(null)

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      setError(`File too large. Maximum size is ${maxSizeMB}MB`)
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a JPG, PNG, WebP, or GIF image')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    // Upload to server
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      // Get auth token
      const token = await getCurrentToken()

      // Upload to worker endpoint
      // Convert WebSocket URL to HTTP if needed
      const syncUrl = import.meta.env.VITE_LIVESTORE_SYNC_URL || 'http://localhost:8787'
      const httpUrl = syncUrl.replace(/^ws:/, 'http:').replace(/^wss:/, 'https:')
      const response = await fetch(`${httpUrl}/api/upload-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Upload failed')
      }

      const { url } = await response.json()
      onUploadComplete(url)
      setError(null)
    } catch (error) {
      console.error('Upload error:', error)
      setError(error instanceof Error ? error.message : 'Failed to upload image')
      // Revert preview on error
      setPreview(currentImageUrl || null)
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = () => {
    setPreview(null)
    setError(null)
    onUploadComplete('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className='image-upload'>
      {preview && (
        <div className='image-preview' style={{ marginBottom: '1rem' }}>
          <img
            src={preview}
            alt='Cover preview'
            style={{
              maxWidth: '100%',
              maxHeight: '200px',
              objectFit: 'cover',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
            }}
          />
        </div>
      )}

      {error && (
        <div
          className='error-message'
          style={{
            color: '#d32f2f',
            fontSize: '0.875rem',
            marginBottom: '0.5rem',
          }}
        >
          {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        onChange={handleFileSelect}
        disabled={uploading}
        style={{ display: 'none' }}
      />

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type='button'
          onClick={handleButtonClick}
          disabled={uploading}
          className='btn btn-secondary'
        >
          {uploading ? 'Uploading...' : preview ? 'Change Image' : 'Upload Cover Image'}
        </button>

        {preview && (
          <button
            type='button'
            onClick={handleRemove}
            disabled={uploading}
            className='btn btn-outline'
          >
            Remove
          </button>
        )}
      </div>
    </div>
  )
}
