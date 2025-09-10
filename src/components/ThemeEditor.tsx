import React, { useState } from 'react'
import { ArrowLeft, Palette, Plus } from 'lucide-react'
import { ThemeList } from './ThemeList'
import { ThemeEditPage } from './ThemeEditPage'
import { themes, getAllThemes, type Theme, type ThemeId } from '../themes'

interface ThemeEditorProps {
  onBack: () => void
}

export function ThemeEditor({ onBack }: ThemeEditorProps) {
  const [currentView, setCurrentView] = useState<'list' | 'edit' | 'create'>('list')
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null)

  // Get all themes from the new theme system
  const defaultThemes = getAllThemes()

  const handleEditTheme = (theme: Theme) => {
    setSelectedTheme(theme)
    setCurrentView('edit')
  }

  const handleCreateTheme = () => {
    const newTheme: Theme = {
      id: '' as ThemeId,
      name: '',
      colors: {
        gradientColor: '114, 77, 221',
        borderColor: 'rgba(114, 77, 221, 1)'
      },
      fonts: {
        titleFont: 'bold 48px Arvo, serif',
        bodyFont: '32px Overpass, sans-serif',
        smallFont: '28px Overpass, sans-serif',
        tinyFont: '24px Overpass, sans-serif'
      },
      renderOptions: {
        renderStandardLayout: async () => {},
        loadFonts: async () => {}
      },
      isDefault: false
    }
    setSelectedTheme(newTheme)
    setCurrentView('create')
  }

  const handleBackToList = () => {
    setCurrentView('list')
    setSelectedTheme(null)
  }

  const handleSaveTheme = (theme: Theme) => {
    // TODO: Implement save to database
    console.log('Saving theme:', theme)
    setCurrentView('list')
    setSelectedTheme(null)
  }

  if (currentView === 'edit' || currentView === 'create') {
    return (
      <>
        <div className="mb-8">
          <button
            onClick={handleBackToList}
            className="flex items-center space-x-2 text-secondary-text hover:text-text transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Themes</span>
          </button>
          <h1 className="text-4xl font-bold text-title">
            {currentView === 'create' ? 'CREATE THEME' : `EDIT ${selectedTheme?.name?.toUpperCase()}`}
          </h1>
        </div>

        {selectedTheme && (
          <ThemeEditPage
            theme={selectedTheme}
            isCreate={currentView === 'create'}
            onSave={handleSaveTheme}
            onCancel={handleBackToList}
          />
        )}
      </>
    )
  }

  return (
    <>
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-secondary-text hover:text-text transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Admin</span>
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-title">THEME EDITOR</h1>
          <button
            onClick={handleCreateTheme}
            className="btn-primary btn-with-icon"
          >
            <Plus className="w-4 h-4" />
            <span>Create Theme</span>
          </button>
        </div>
      </div>

      <ThemeList 
        themes={defaultThemes}
        onEditTheme={handleEditTheme}
      />
    </>
  )
}