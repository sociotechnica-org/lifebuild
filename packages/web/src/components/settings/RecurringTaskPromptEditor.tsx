import React, { useState, useEffect } from 'react'
import { validatePromptTemplate, getAvailableVariables } from '@work-squared/shared'

interface RecurringTaskPromptEditorProps {
  value: string
  onChange: (value: string) => void
}

export const RecurringTaskPromptEditor: React.FC<RecurringTaskPromptEditorProps> = ({
  value,
  onChange,
}) => {
  const [showVariablesHelp, setShowVariablesHelp] = useState(false)
  const [validation, setValidation] = useState({ isValid: true, errors: [] as string[] })

  // Validate template on change
  useEffect(() => {
    const result = validatePromptTemplate(value)
    setValidation({ isValid: result.isValid, errors: result.errors })
  }, [value])

  const availableVariables = getAvailableVariables()

  return (
    <div>
      <div className='relative'>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={8}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-y min-h-[200px] ${
            validation.isValid
              ? 'border-gray-300 focus:border-blue-500'
              : 'border-red-300 focus:border-red-500 focus:ring-red-500'
          }`}
          placeholder='Enter custom prompt template for recurring tasks... 

Example:
You are executing the recurring task "{{name}}".

Task Details:
- Description: {{description}}
- Instructions: {{prompt}}

Please follow these task-specific instructions carefully.'
        />
      </div>

      {/* Validation Errors */}
      {!validation.isValid && (
        <div className='mt-2 text-sm text-red-600'>
          <div className='font-medium'>Template errors:</div>
          <ul className='mt-1 list-disc list-inside'>
            {validation.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Variables Help */}
      <div className='mt-3'>
        <button
          type='button'
          onClick={() => setShowVariablesHelp(!showVariablesHelp)}
          className='text-sm text-blue-600 hover:text-blue-800 focus:outline-none'
        >
          {showVariablesHelp ? '▼' : '▶'} Available Variables
        </button>

        {showVariablesHelp && (
          <div className='mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md'>
            <div className='text-sm text-gray-700'>
              <p className='font-medium mb-2'>Use these variables in your template:</p>
              <div className='grid grid-cols-2 gap-2 text-xs font-mono'>
                {availableVariables.map((variable: string) => (
                  <div key={variable} className='flex items-center'>
                    <code className='bg-gray-200 px-1 rounded text-blue-700'>
                      {`{{${variable}}}`}
                    </code>
                    <span className='ml-2 text-gray-600 capitalize'>
                      {variable.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
              <div className='mt-3 pt-3 border-t border-gray-300 text-xs text-gray-500'>
                <p>
                  <strong>Note:</strong> Variables will be replaced with actual task data during
                  execution. Null values will show as "[field not set]".
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
