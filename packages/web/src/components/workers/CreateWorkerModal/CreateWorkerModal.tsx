import React, { useState, useEffect } from 'react'
import { useStore } from '@livestore/react'
import { events } from '@work-squared/shared/schema'
import { generateRandomWorkerName, systemPromptTemplates } from '../../../util/workerNames.js'
import { ModelSelector } from '../../ui/ModelSelector/ModelSelector.js'
import { DEFAULT_MODEL } from '../../../util/models.js'
import { EmojiPicker } from '../EmojiPicker/EmojiPicker.js'

interface CreateWorkerModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CreateWorkerModal: React.FC<CreateWorkerModalProps> = ({ isOpen, onClose }) => {
  const { store } = useStore()
  const [name, setName] = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [avatar, setAvatar] = useState('🤖')
  const [defaultModel, setDefaultModel] = useState<string>(DEFAULT_MODEL)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; systemPrompt?: string }>({})

  // Generate random name when modal opens
  useEffect(() => {
    if (isOpen && !name) {
      setName(generateRandomWorkerName())
    }
  }, [isOpen, name])

  const validateForm = () => {
    const newErrors: { name?: string; systemPrompt?: string } = {}

    if (!name.trim()) {
      newErrors.name = 'Worker name is required'
    }

    if (!systemPrompt.trim()) {
      newErrors.systemPrompt = 'System prompt is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const workerId = crypto.randomUUID()
      const createdAt = new Date()

      // Create the worker
      store.commit(
        events.workerCreated({
          id: workerId,
          name: name.trim(),
          roleDescription: roleDescription.trim() || undefined,
          systemPrompt: systemPrompt.trim(),
          avatar: avatar.trim() || undefined,
          defaultModel,
          createdAt,
        })
      )

      // Reset form and close modal
      resetForm()
      onClose()
    } catch (error) {
      console.error('Error creating worker:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setName('')
    setRoleDescription('')
    setSystemPrompt('')
    setAvatar('🤖')
    setDefaultModel(DEFAULT_MODEL)
    setSelectedTemplate('')
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateName = e.target.value
    setSelectedTemplate(templateName)

    if (templateName) {
      const template = systemPromptTemplates.find(t => t.name === templateName)
      if (template) {
        setSystemPrompt(template.prompt)
      }
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    if (errors.name) {
      setErrors({ ...errors, name: undefined })
    }
  }

  const handleSystemPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSystemPrompt(e.target.value)
    if (errors.systemPrompt) {
      setErrors({ ...errors, systemPrompt: undefined })
    }
  }

  const generateNewName = () => {
    setName(generateRandomWorkerName())
  }

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  return (
    <div
      className='fixed inset-0 backdrop-blur-sm flex items-start justify-center pt-5 px-4 z-50'
      onClick={handleBackdropClick}
    >
      <div className='bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-start justify-between p-6 border-b border-gray-200'>
          <h3 className='text-lg font-semibold leading-6 text-gray-900'>Create New Worker</h3>
          <button
            onClick={handleClose}
            className='text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100'
            aria-label='Close modal'
          >
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className='p-6'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Worker Name */}
            <div>
              <label htmlFor='worker-name' className='block text-sm font-medium text-gray-900 mb-2'>
                Name *
              </label>
              <div className='flex gap-2'>
                <input
                  type='text'
                  id='worker-name'
                  value={name}
                  onChange={handleNameChange}
                  className={`flex-1 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder='Enter worker name'
                  autoFocus
                />
                <button
                  type='button'
                  onClick={generateNewName}
                  className='px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors'
                >
                  Generate
                </button>
              </div>
              {errors.name && <p className='mt-1 text-sm text-red-600'>{errors.name}</p>}
            </div>

            {/* Role Description */}
            <div>
              <label
                htmlFor='role-description'
                className='block text-sm font-medium text-gray-900 mb-2'
              >
                Role Description
              </label>
              <input
                type='text'
                id='role-description'
                value={roleDescription}
                onChange={e => setRoleDescription(e.target.value)}
                className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='e.g., Frontend Developer, Project Manager'
              />
            </div>

            {/* Avatar */}
            <div>
              <label htmlFor='avatar' className='block text-sm font-medium text-gray-900 mb-2'>
                Avatar (emoji)
              </label>
              <EmojiPicker value={avatar} onChange={setAvatar} className='w-full' id='avatar' />
            </div>

            {/* Default Model */}
            <div>
              <label
                htmlFor='default-model'
                className='block text-sm font-medium text-gray-900 mb-2'
              >
                Default Model
              </label>
              <ModelSelector
                selectedModel={defaultModel}
                onModelChange={setDefaultModel}
                className='w-full'
              />
              <p className='mt-1 text-sm text-gray-500'>
                This model will be used by default for new conversations with this worker. Users can
                still change the model per conversation.
              </p>
            </div>

            {/* System Prompt Template */}
            <div>
              <label htmlFor='template' className='block text-sm font-medium text-gray-900 mb-2'>
                System Prompt Template
              </label>
              <select
                id='template'
                value={selectedTemplate}
                onChange={handleTemplateChange}
                className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              >
                <option value=''>Select a template...</option>
                {systemPromptTemplates.map(template => (
                  <option key={template.name} value={template.name}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {/* System Prompt */}
            <div>
              <label
                htmlFor='system-prompt'
                className='block text-sm font-medium text-gray-900 mb-2'
              >
                System Prompt *
              </label>
              <textarea
                id='system-prompt'
                rows={6}
                value={systemPrompt}
                onChange={handleSystemPromptChange}
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical min-h-[150px] ${
                  errors.systemPrompt ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='Define how this worker should behave and respond to user queries...'
              />
              {errors.systemPrompt && (
                <p className='mt-1 text-sm text-red-600'>{errors.systemPrompt}</p>
              )}
            </div>

            {/* Actions */}
            <div className='flex justify-end space-x-3 pt-4'>
              <button
                type='button'
                onClick={handleClose}
                className='px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={isSubmitting}
                className='px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors'
              >
                {isSubmitting ? 'Creating...' : 'Create Worker'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
