import React, { useState } from 'react'
import { ArrowLeft, Eye, Layers, Package } from 'lucide-react'
import { useModels } from '../hooks/useModels'
import { useBoxes } from '../hooks/useBoxes'
import { useAuth } from '../hooks/useAuth'
import { PublicModelView } from './PublicModelView'
import { PublicCollectionView } from './PublicCollectionView'

interface SharePreviewPageProps {
  onBack: () => void
}

export function SharePreviewPage({ onBack }: SharePreviewPageProps) {
  const [activeTab, setActiveTab] = useState<'model' | 'collection'>('model')
  const [selectedModelId, setSelectedModelId] = useState<string>('')
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('')
  const [currentView, setCurrentView] = useState<'selection' | 'model-preview' | 'collection-preview'>('selection')
  const { models, loading: modelsLoading } = useModels()
  const { boxes, loading: boxesLoading } = useBoxes()
  const { user } = useAuth()

  const selectedModel = models.find(model => model.id === selectedModelId)
  const selectedCollection = boxes.find(box => box.id === selectedCollectionId)

  const handlePreview = () => {
    if (activeTab === 'model') {
      setCurrentView('model-preview')
    } else {
      setCurrentView('collection-preview')
    }
  }

  const handleBackFromPreview = () => {
    setCurrentView('selection')
  }

  const isPreviewDisabled = () => {
    if (activeTab === 'model') {
      return !selectedModelId
    } else {
      return !selectedCollectionId
    }
  }

  // Show model preview
  if (currentView === 'model-preview' && selectedModelId) {
    return <PublicModelView modelId={selectedModelId} onBack={handleBackFromPreview} />
  }

  // Show collection preview
  if (currentView === 'collection-preview' && selectedCollectionId) {
    return <PublicCollectionView collectionId={selectedCollectionId} onBack={handleBackFromPreview} />
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
        <p className="text-secondary-text mt-2">Select a model or collection to preview its share page</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-bg-card border border-border-custom rounded-lg p-6">
          {/* Tab Selector */}
          <div className="flex space-x-1 bg-bg-secondary rounded-lg p-1 mb-6">
            <button
              onClick={() => {
                setActiveTab('model')
                setSelectedModelId('')
                setSelectedCollectionId('')
              }}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'model'
                  ? 'bg-white text-text shadow-sm'
                  : 'text-secondary-text hover:text-text'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Model</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('collection')
                setSelectedModelId('')
                setSelectedCollectionId('')
              }}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'collection'
                  ? 'bg-white text-text shadow-sm'
                  : 'text-secondary-text hover:text-text'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Collection</span>
            </button>
          </div>

          <div className="space-y-6">
            {/* Model Selection Dropdown */}
            {activeTab === 'model' && (
              <div>
                <label htmlFor="model-select" className="block text-sm font-medium text-text mb-2">
                  Select Model
                </label>
                <select
                  id="model-select"
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="w-full bg-bg-secondary border border-border-custom rounded-lg px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent"
                  disabled={modelsLoading}
                >
                  <option value="">Choose a model...</option>
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} {model.game && `(${model.game.name})`}
                    </option>
                  ))}
                </select>
                {modelsLoading && (
                  <p className="text-sm text-secondary-text mt-2">Loading models...</p>
                )}
              </div>
            )}

            {/* Collection Selection Dropdown */}
            {activeTab === 'collection' && (
              <div>
                <label htmlFor="collection-select" className="block text-sm font-medium text-text mb-2">
                  Select Collection
                </label>
                <select
                  id="collection-select"
                  value={selectedCollectionId}
                  onChange={(e) => setSelectedCollectionId(e.target.value)}
                  className="w-full bg-bg-secondary border border-border-custom rounded-lg px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent"
                  disabled={boxesLoading}
                >
                  <option value="">Choose a collection...</option>
                  {boxes.map((box) => (
                    <option key={box.id} value={box.id}>
                      {box.name} {box.game && `(${box.game.name})`}
                    </option>
                  ))}
                </select>
                {boxesLoading && (
                  <p className="text-sm text-secondary-text mt-2">Loading collections...</p>
                )}
              </div>
            )}

            {/* Selected Item Info */}
            {activeTab === 'model' && selectedModel && (
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

            {activeTab === 'collection' && selectedCollection && (
              <div className="bg-bg-secondary border border-border-custom rounded-lg p-4">
                <h3 className="font-semibold text-text mb-2">Selected Collection</h3>
                <div className="flex items-center space-x-4">
                  {selectedCollection.image_url && (
                    <img
                      src={selectedCollection.image_url}
                      alt={selectedCollection.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <p className="font-medium text-text">{selectedCollection.name}</p>
                    {selectedCollection.game && (
                      <p className="text-sm text-secondary-text">{selectedCollection.game.name}</p>
                    )}
                    <p className="text-sm text-secondary-text">
                      Purchase Date: {new Date(selectedCollection.purchase_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-secondary-text">
                      Public: {selectedCollection.public ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Button */}
            <div className="pt-4">
              <button
                onClick={handlePreview}
                disabled={isPreviewDisabled()}
                className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  !isPreviewDisabled()
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
