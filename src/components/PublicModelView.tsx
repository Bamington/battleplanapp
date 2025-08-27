import React, { useState, useEffect } from 'react'
import { Calendar, Package, Users, Globe, User, Moon, Sun, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useDarkMode } from '../hooks/useDarkMode'
import battleplanLogo from '/Battleplan-Logo-Purple.svg'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { formatLocalDate } from '../utils/timezone'
import { Footer } from './Footer'

interface PublicModelViewProps {
  modelId: string
  onBack?: () => void
  breadcrumbs?: {
    collectionName: string
    collectionId: string
  }
}

interface Model {
  id: string
  name: string
  status: string
  count: number
  image_url: string
  notes: string | null
  public: boolean | null
  game: {
    id: string
    name: string
    icon: string | null
  } | null
  box: {
    id: string
    name: string
    purchase_date: string
    game: {
      id: string
      name: string
      icon: string | null
      image: string | null
    } | null
  } | null
}

export function PublicModelView({ modelId, onBack, breadcrumbs }: PublicModelViewProps) {
  const [model, setModel] = useState<Model | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (isProfileMenuOpen && !target.closest('.profile-dropdown')) {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileMenuOpen])

  useEffect(() => {
    fetchModel()
  }, [modelId])

  const fetchModel = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch the model details - only public models
      const { data: modelData, error: modelError } = await supabase
        .from('models')
        .select(`
          id,
          name,
          status,
          count,
          image_url,
          notes,
          public,
          game:games(
            id,
            name,
            icon
          ),
          box:boxes(
            id,
            name,
            purchase_date,
            game:games(id, name, icon, image)
          )
        `)
        .eq('id', modelId)
        .eq('public', true)
        .single()

      if (modelError) {
        if (modelError.code === 'PGRST116') {
          // No rows returned - model not found or not public
          setError('Model not found or not publicly accessible')
        } else {
          throw modelError
        }
        return
      }

      // Transform the data to handle array responses from Supabase
      const transformedModel = {
        ...modelData,
        game: modelData.game && Array.isArray(modelData.game) ? modelData.game[0] : modelData.game,
        box: modelData.box && Array.isArray(modelData.box) ? modelData.box[0] : modelData.box
      }

      setModel(transformedModel)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load model')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return formatLocalDate(dateString, {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-secondary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-300 rounded mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !model) {
    return (
      <div className="min-h-screen bg-bg-secondary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text mb-4">Model Not Found</h1>
            <p className="text-secondary-text mb-6">
              {error || 'The requested model could not be found.'}
            </p>
            <button
              onClick={onBack}
              className="bg-[var(--color-brand)] text-white px-6 py-2 rounded-lg hover:bg-[var(--color-brand)]/90 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
         <div className="min-h-screen bg-bg-secondary px-[10%] pt-6">
      {/* Preview Banner */}
      {onBack && (
        <div className="bg-[var(--color-brand)] text-white px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-white hover:text-white/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <span className="text-sm font-medium">This is just a preview.</span>
            <div className="w-16"></div> {/* Spacer for centering */}
          </div>
        </div>
             )}

              {/* Breadcrumbs */}
              {breadcrumbs && (
                <div className="mb-4">
                  <nav className="flex items-center space-x-2 text-sm text-secondary-text">
                    <a 
                      href={`/shared/collection/${breadcrumbs.collectionId}`}
                      className="hover:text-text transition-colors"
                    >
                      {breadcrumbs.collectionName}
                    </a>
                    <span>/</span>
                    <span className="text-text">{model?.name || 'Loading...'}</span>
                  </nav>
                </div>
              )}

              {/* Main Content */}
        <main>
                    {/* Full-width Hero Image */}
                     {model.image_url && (
             <div className="w-full relative">
                              <img
                  src={model.image_url}
                  alt={model.name}
                  className="w-full max-h-[70vh] object-contain rounded-lg"
                />
             </div>
           )}

          {/* Content Container */}
          <div className="max-w-4xl mx-auto py-8">
           {/* Model Header */}
           <div className="bg-bg-card border border-border-custom rounded-lg p-6 mb-8">
             <div className="text-center">
               <h1 className="text-3xl font-bold text-title mb-2">{model.name}</h1>
               {model.game && (
                 <div className="flex items-center justify-center space-x-2 mb-3">
                   {model.game.icon && (
                     <img
                       src={model.game.icon}
                       alt={model.game.name}
                       className="w-6 h-6"
                     />
                   )}
                   <span className="text-secondary-text">{model.game.name}</span>
                 </div>
               )}
               <div className="flex items-center justify-center space-x-4 text-sm text-secondary-text">
                 <span>Status: {model.status}</span>
                 <span>Count: {model.count}</span>
               </div>
             </div>
           </div>

                   {/* Model Details */}
           {model.notes && (
             <div className="bg-bg-card border border-border-custom rounded-lg p-6">
               <h2 className="text-xl font-semibold text-title mb-4">Notes</h2>
               <div className="prose prose-sm max-w-none text-text">
                 <ReactMarkdown remarkPlugins={[remarkGfm]}>
                   {model.notes}
                 </ReactMarkdown>
               </div>
             </div>
           )}

           <Footer />
         </div>
       </main>
    </div>
  )
}
