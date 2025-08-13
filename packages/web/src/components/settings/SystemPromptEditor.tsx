import React, { useState } from 'react'
import { Markdown } from '../markdown/Markdown.js'

interface SystemPromptEditorProps {
  value: string
  onChange: (value: string) => void
}

export const SystemPromptEditor: React.FC<SystemPromptEditorProps> = ({ value, onChange }) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')

  return (
    <div className='border border-gray-300 rounded-lg overflow-hidden'>
      {/* Tab Headers */}
      <div className='flex border-b border-gray-300 bg-gray-50'>
        <button
          type='button'
          onClick={() => setActiveTab('edit')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'edit'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          Edit
        </button>
        <button
          type='button'
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'preview'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          Preview
        </button>
      </div>

      {/* Tab Content */}
      <div className='min-h-[300px]'>
        {activeTab === 'edit' ? (
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            className='w-full h-80 p-4 text-sm font-mono border-none resize-none focus:outline-none focus:ring-0'
            placeholder='Enter your system prompt here...'
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace' }}
          />
        ) : (
          <div className='p-4 prose prose-sm max-w-none'>
            {value.trim() ? (
              <Markdown content={value} />
            ) : (
              <p className='text-gray-500 italic'>No content to preview</p>
            )}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className='px-4 py-3 bg-gray-50 border-t border-gray-200'>
        <p className='text-xs text-gray-600'>
          This system prompt will be used for all AI chats unless overridden by a specific worker's
          prompt. You can use markdown formatting for better readability.
        </p>
      </div>
    </div>
  )
}
