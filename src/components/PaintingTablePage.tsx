import React, { useState } from 'react'
import { Plus, Palette, Info, Trash2 } from 'lucide-react'
import { ModelCard } from './ModelCard'

interface PaintingTablePageProps {
  onSelectModel: () => void
  paintingTableModels: any[]
  onRemoveModel: (modelId: string) => void
  onViewModel: (model: any) => void
  onViewBox?: (box: any) => void
}

export function PaintingTablePage({ onSelectModel, paintingTableModels, onRemoveModel, onViewModel, onViewBox }: PaintingTablePageProps) {
  const maxModels = 3
  const [confirmRemove, setConfirmRemove] = useState<{
    isOpen: boolean
    modelId: string
    modelName: string
  }>({
    isOpen: false,
    modelId: '',
    modelName: ''
  })

  const handleRemoveClick = (model: any) => {
    setConfirmRemove({
      isOpen: true,
      modelId: model.id,
      modelName: model.name
    })
  }

  const handleConfirmRemove = () => {
    onRemoveModel(confirmRemove.modelId)
    setConfirmRemove({
      isOpen: false,
      modelId: '',
      modelName: ''
    })
  }

  const handleCancelRemove = () => {
    setConfirmRemove({
      isOpen: false,
      modelId: '',
      modelName: ''
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-3 bg-brand/10 rounded-full">
            <Palette className="w-8 h-8 text-brand" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-title mb-2">Painting Table</h1>
        <p className="text-secondary-text max-w-2xl mx-auto">
          Track up to 3 models you're currently working on. Select models from your collection to keep track of your painting progress.
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Your Personal Painting Workspace
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Select models from your collection that you're currently painting to keep track of your progress. You can have up to {maxModels} models on your painting table at once.
            </p>
          </div>
        </div>
      </div>

      {/* Add Model Button */}
      {paintingTableModels.length < maxModels && (
        <div className="mb-8 text-center">
          <button
            onClick={onSelectModel}
            className="btn-primary btn-with-icon"
          >
            <Plus className="w-4 h-4" />
            <span>Add a model to your painting table</span>
          </button>
          <p className="text-xs text-secondary-text mt-2">
            {paintingTableModels.length}/{maxModels} slots used
          </p>
        </div>
      )}

      {/* Painting Table Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[400px]">
        {/* Model cards with remove functionality */}
        {paintingTableModels.map((model, index) => (
          <div key={model.id || index} className="relative">
            <ModelCard
              model={model}
              name={model.name}
              boxName={model.box?.name || 'Unknown Collection'}
              gameName={model.game?.name || model.box?.game?.name || 'Unknown Game'}
              gameIcon={model.game?.icon || model.box?.game?.icon}
              status={model.status || 'None'}
              count={model.count || 1}
              imageUrl={model.image_url}
              paintedDate={model.painted_date}
              onViewModel={() => onViewModel(model)}
              onViewBox={onViewBox}
            />
            {/* Remove button overlay */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveClick(model)
              }}
              className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors z-10 m-1"
              title="Remove from painting table"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Empty State when no add tile is shown (at capacity) */}
      {paintingTableModels.length >= maxModels && (
        <div className="text-center py-8 bg-bg-card rounded-lg border border-border-custom">
          <Palette className="w-12 h-12 text-icon mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-title mb-2">Painting Table Full</h3>
          <p className="text-secondary-text">
            You have {maxModels} models on your painting table. Remove a model to add a new one.
          </p>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmRemove.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-modal-bg rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-title">Remove from Painting Table</h3>
            </div>

            <p className="text-text mb-6">
              Are you sure you want to remove <strong>{confirmRemove.modelName}</strong> from your painting table?
              This will not delete the model from your collection.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={handleConfirmRemove}
                className="btn-danger flex-1"
              >
                Remove
              </button>
              <button
                onClick={handleCancelRemove}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}