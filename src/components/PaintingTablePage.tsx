import React, { useState } from 'react'
import { Plus, Palette, Info, Lightbulb, X } from 'lucide-react'
import { PaintingInspirationModal } from './PaintingInspirationModal'

interface PaintingTablePageProps {
  onSelectModel: () => void
  paintingTableModels: any[]
  onRemoveModel: (modelId: string) => void
}

export function PaintingTablePage({ onSelectModel, paintingTableModels, onRemoveModel }: PaintingTablePageProps) {
  const maxModels = 3
  const [inspirationModal, setInspirationModal] = useState<{
    isOpen: boolean
    modelName: string
    gameName: string
  }>({
    isOpen: false,
    modelName: '',
    gameName: ''
  })

  const showInspiration = (model: any) => {
    setInspirationModal({
      isOpen: true,
      modelName: model.name,
      gameName: model.game?.name || model.box?.game?.name || 'Unknown Game'
    })
  }

  const closeInspiration = () => {
    setInspirationModal({
      isOpen: false,
      modelName: '',
      gameName: ''
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
        {/* Model tiles */}
        {paintingTableModels.map((model, index) => (
          <div 
            key={model.id || index} 
            className="bg-bg-card rounded-lg shadow-sm border border-border-custom overflow-hidden max-w-[380px] flex flex-col h-full hover:shadow-[0_8px_25px_rgba(114,77,221,0.25)] hover:-translate-y-1 transition-all duration-300 cursor-pointer min-h-[300px]"
          >
            {/* Model image area - placeholder for now */}
            <div className="h-48 bg-bg-secondary flex items-center justify-center">
              <Palette className="w-12 h-12 text-icon" />
            </div>

            {/* Model info */}
            <div className="flex-1 p-6 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-title text-lg flex-1">{model.name}</h3>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      showInspiration(model)
                    }}
                    className="text-secondary-text hover:text-brand transition-colors p-1 rounded"
                    title="Get painting inspiration"
                  >
                    <Lightbulb className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveModel(model.id)
                    }}
                    className="text-secondary-text hover:text-red-500 transition-colors p-1 rounded"
                    title="Remove from painting table"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-secondary-text text-sm flex-1">Painting in progress...</p>
            </div>

            {/* Footer with progress info */}
            <div className="px-6 py-4 bg-bg-secondary border-t border-border-custom">
              <div className="flex items-center justify-between">
                <div className="text-xs text-secondary-text font-medium">
                  Status
                </div>
                <div className="text-xs text-yellow-600 font-bold bg-yellow-100 rounded-full px-2 py-1">
                  In Progress
                </div>
              </div>
            </div>
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

      {/* Painting Inspiration Modal */}
      <PaintingInspirationModal
        isOpen={inspirationModal.isOpen}
        onClose={closeInspiration}
        modelName={inspirationModal.modelName}
        gameName={inspirationModal.gameName}
      />
    </div>
  )
}