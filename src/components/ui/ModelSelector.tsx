import React from 'react'
import { supportedModels, getModelById } from '../../util/models.js'

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (modelId: string) => void
  className?: string
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  className = '',
}) => {
  const selectedModelInfo = getModelById(selectedModel)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label htmlFor='model-selector' className='text-sm font-medium text-gray-700'>
        Model:
      </label>
      <select
        id='model-selector'
        value={selectedModel}
        onChange={e => onModelChange(e.target.value)}
        className='flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
      >
        {supportedModels.map(model => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
      {selectedModelInfo && (
        <div className='text-xs text-gray-500'>{selectedModelInfo.provider}</div>
      )}
    </div>
  )
}
