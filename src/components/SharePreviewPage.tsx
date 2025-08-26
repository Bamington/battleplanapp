import React, { useState } from 'react'
import { ArrowLeft, Eye } from 'lucide-react'
import { useModels } from '../hooks/useModels'
import { useAuth } from '../hooks/useAuth'

interface SharePreviewPageProps {
  onBack: () => void
}

export function SharePreviewPage({ onBack }: SharePreviewPageProps) {
  const [selectedModelId, setSelectedModelId] = useState<string>('')
  const { models, loading } = useModels()
  const { user } = useAuth()

  const selectedModel = models.find(model => model.id === selectedModelId)

  const handlePreview = () => {
    // This will be implemented in the next step
    console.log('Preview clicked for model:', selectedModel)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-secondary-text hover:text-text transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Admin Panel</span>
        </button>
        <h1 className="text-4xl font-bold text-title">Share Preview</h1>
        <p className="text-secondary-text mt-2">Select a model to preview its share page</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-bg-card border border-border-custom rounded-lg p-6">
          <div className="space-y-6">
            {/* Model Selection Dropdown */}
            <div>
              <label htmlFor="model-select" className="block text-sm font-medium text-text mb-2">
                Select Model
              </label>
              <select
                id="model-select"
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full bg-bg-secondary border border-border-custom rounded-lg px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent"
                disabled={loading}
              >
                <option value="">Choose a model...</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} {model.game && `(${model.game.name})`}
                  </option>
                ))}
              </select>
              {loading && (
                <p className="text-sm text-secondary-text mt-2">Loading models...</p>
              )}
            </div>

            {/* Selected Model Info */}
            {selectedModel && (
              <div className="bg-bg-secondary border border-border-custom rounded-lg p-4">
                <h3 className="font-semibold text-text mb-2">Selected Model</h3>
                <div className="flex items-center space-x-4">
                  {selectedModel.image_url && (
                    <img
                      src={selectedModel.image_url}
                      alt={selectedModel.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <p className="font-medium text-text">{selectedModel.name}</p>
                    {selectedModel.game && (
                      <p className="text-sm text-secondary-text">{selectedModel.game.name}</p>
                    )}
                    <p className="text-sm text-secondary-text">Count: {selectedModel.count}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Button */}
            <div className="pt-4">
              <button
                onClick={handlePreview}
                disabled={!selectedModelId}
                className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  selectedModelId
                    ? 'bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand)]/90 shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Eye className="w-5 h-5" />
                <span>Preview</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
