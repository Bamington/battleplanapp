import React, { useState } from 'react'
import { X, Settings } from 'lucide-react'

interface RecentViewSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (settings: RecentViewSettings) => void
  currentSettings: RecentViewSettings
}

export interface RecentViewSettings {
  // Model filters - which painted statuses to show
  showPainted: boolean
  showPartiallyPainted: boolean
  showPrimed: boolean
  showAssembled: boolean
  showUnassembled: boolean
  
  // Model sort order
  sortOrder: 'mostRecentlyAdded' | 'mostRecentlyPainted'
}

export function RecentViewSettingsModal({ isOpen, onClose, onSave, currentSettings }: RecentViewSettingsModalProps) {
  const [settings, setSettings] = useState<RecentViewSettings>(currentSettings)

  const handleSave = () => {
    onSave(settings)
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] modal-container"
      onClick={handleBackdropClick}
    >
      <div className="bg-modal-bg rounded-none sm:rounded-lg max-w-lg w-full h-screen sm:h-auto sm:max-h-[90vh] flex flex-col transition-all duration-300 ease-out transform">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0 p-6 pb-4 shadow-sm bg-modal-bg rounded-t-lg">
          <div className="flex items-center space-x-3">
            <Settings className="w-5 h-5 text-icon" />
            <h2 className="text-xl font-semibold text-text font-overpass">
              Recent View Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6">
          <div className="py-4 space-y-8">
            
            {/* Recent Models Settings Section */}
            <div className="space-y-6">
              
              {/* Painted Status Filters */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-text">Show Models by Status</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.showPainted}
                      onChange={(e) => setSettings({...settings, showPainted: e.target.checked})}
                      className="w-4 h-4 text-brand bg-bg-primary border-border-custom rounded focus:ring-brand focus:ring-2"
                    />
                    <span className="text-sm text-text">Painted</span>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.showPartiallyPainted}
                      onChange={(e) => setSettings({...settings, showPartiallyPainted: e.target.checked})}
                      className="w-4 h-4 text-brand bg-bg-primary border-border-custom rounded focus:ring-brand focus:ring-2"
                    />
                    <span className="text-sm text-text">Partially Painted</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.showPrimed}
                      onChange={(e) => setSettings({...settings, showPrimed: e.target.checked})}
                      className="w-4 h-4 text-brand bg-bg-primary border-border-custom rounded focus:ring-brand focus:ring-2"
                    />
                    <span className="text-sm text-text">Primed</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.showAssembled}
                      onChange={(e) => setSettings({...settings, showAssembled: e.target.checked})}
                      className="w-4 h-4 text-brand bg-bg-primary border-border-custom rounded focus:ring-brand focus:ring-2"
                    />
                    <span className="text-sm text-text">Assembled</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.showUnassembled}
                      onChange={(e) => setSettings({...settings, showUnassembled: e.target.checked})}
                      className="w-4 h-4 text-brand bg-bg-primary border-border-custom rounded focus:ring-brand focus:ring-2"
                    />
                    <span className="text-sm text-text">Unassembled</span>
                  </label>
                </div>
              </div>

              {/* Model Sorting Options */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-text">Model Sort Order</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="sortOrder"
                      value="mostRecentlyAdded"
                      checked={settings.sortOrder === 'mostRecentlyAdded'}
                      onChange={(e) => setSettings({...settings, sortOrder: e.target.value as 'mostRecentlyAdded' | 'mostRecentlyPainted'})}
                      className="w-4 h-4 text-brand bg-bg-primary border-border-custom focus:ring-brand focus:ring-2"
                    />
                    <div>
                      <span className="text-sm text-text font-medium">Most Recently Added</span>
                      <p className="text-xs text-secondary-text">Show models by creation date</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="sortOrder"
                      value="mostRecentlyPainted"
                      checked={settings.sortOrder === 'mostRecentlyPainted'}
                      onChange={(e) => setSettings({...settings, sortOrder: e.target.value as 'mostRecentlyAdded' | 'mostRecentlyPainted'})}
                      className="w-4 h-4 text-brand bg-bg-primary border-border-custom focus:ring-brand focus:ring-2"
                    />
                    <div>
                      <span className="text-sm text-text font-medium">Most Recently Painted</span>
                      <p className="text-xs text-secondary-text">Show models by painted date</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>


          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 shadow-sm bg-modal-bg rounded-b-lg flex-shrink-0">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 btn-primary"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}