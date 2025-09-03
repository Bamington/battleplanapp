import React, { useState } from 'react'
import { X, Edit, Trash2, Calendar, User, Gamepad2, Trophy, Image, FileText, MapPin } from 'lucide-react'
import { DeleteBattleModal } from './DeleteBattleModal'
import { EditBattleModal } from './EditBattleModal'
import { formatLocalDate } from '../utils/timezone'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useGameIcons } from '../hooks/useGameIcons'
import { supabase } from '../lib/supabase'

interface Battle {
  id: number
  battle_name: string | null
  battle_notes: string | null
  date_played: string | null
  game_name: string | null
  game_uid: string | null
  game_icon: string | null
  image_url: string | null
  location: string | null
  opp_name: string | null
  opp_id: string[] | null
  result: string | null
  user_id: string | null
  created_at: string
}

interface ViewBattleModalProps {
  isOpen: boolean
  onClose: () => void
  onBattleDeleted?: () => void
  onBattleUpdated?: () => void
  battle: Battle | null
}

export function ViewBattleModal({ isOpen, onClose, onBattleDeleted, onBattleUpdated, battle }: ViewBattleModalProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { getGameIcon, isValidGameIcon } = useGameIcons()
  
  // Get the game icon from cache using game_uid
  const gameIcon = getGameIcon(battle?.game_uid)

  if (!isOpen || !battle) return null

  const getResultColor = (result: string | null) => {
    if (!result) return 'text-secondary-text'
    
    const lowerResult = result.toLowerCase()
    if (lowerResult.includes('win') || lowerResult.includes('victory')) {
      return 'text-green-600'
    } else if (lowerResult.includes('loss') || lowerResult.includes('defeat')) {
      return 'text-red-600'
    } else if (lowerResult.includes('draw') || lowerResult.includes('tie')) {
      return 'text-yellow-600'
    }
    return 'text-secondary-text'
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-0 sm:p-4 z-50 modal-container"
        onClick={handleBackdropClick}
      >
        <div className="bg-modal-bg rounded-none sm:rounded-lg max-w-2xl w-full h-screen sm:h-auto sm:max-h-[90vh] flex flex-col overflow-y-auto p-6 modal-content">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-text font-overpass">
              Battle Details
            </h2>
                         <div className="flex items-center space-x-2">
               <button
                 onClick={() => setShowEditModal(true)}
                 className="text-secondary-text hover:text-text transition-colors p-2 rounded-full hover:bg-bg-secondary"
                 title="Edit Battle"
               >
                 <Edit className="w-5 h-5" />
               </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-50"
                title="Delete Battle"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="text-secondary-text hover:text-text transition-colors p-2 rounded-full hover:bg-bg-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Battle Content */}
          <div className="space-y-6">
            {/* Battle Title */}
            <div>
              <h3 className="text-2xl font-bold text-title mb-2">
                {battle.battle_name || 'Untitled Battle'}
              </h3>
            </div>

                            {/* Battle Image */}
                {battle.image_url && (
                  <div className="col-span-full mb-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <Image className="w-5 h-5 text-icon" />
                      <h3 className="text-lg font-semibold text-text">Battle Image</h3>
                    </div>
                    <div className="relative">
                      <img
                        src={battle.image_url}
                        alt="Battle image"
                        className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Battle Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             {/* Game */}
               <div className="flex items-center space-x-3 p-4 bg-bg-secondary rounded-lg">
                 {isValidGameIcon(gameIcon) ? (
                   <>
                     <img
                       src={gameIcon || ''}
                       alt={`${battle.game_name || 'Unknown Game'} icon`}
                       className="w-10 h-10 object-contain rounded flex-shrink-0"
                       onError={(e) => {
                         const target = e.target as HTMLImageElement
                         console.warn('Game icon failed to load:', gameIcon, 'Falling back to letter icon')
                         // Hide the broken image and show fallback
                         target.style.display = 'none'
                         const fallback = target.nextElementSibling as HTMLElement
                         if (fallback && fallback.classList.contains('icon-fallback')) {
                           fallback.style.display = 'flex'
                         }
                       }}
                       onLoad={(e) => {
                         // Hide fallback when image loads successfully
                         const target = e.target as HTMLImageElement
                         const fallback = target.nextElementSibling as HTMLElement
                         if (fallback && fallback.classList.contains('icon-fallback')) {
                           fallback.style.display = 'none'
                         }
                       }}
                     />
                     <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center icon-fallback flex-shrink-0">
                       <span className="text-white text-sm font-bold">
                         {battle.game_name?.charAt(0) || '?'}
                       </span>
                     </div>
                   </>
                 ) : (
                   <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                     <span className="text-white text-sm font-bold">
                       {battle.game_name?.charAt(0) || '?'}
                     </span>
                   </div>
                 )}
                 <div>
                   <p className="text-sm text-secondary-text">Game</p>
                   <p className="font-medium text-text">{battle.game_name || 'Unknown Game'}</p>
                 </div>
               </div>

              {/* Date */}
              <div className="flex items-center space-x-3 p-4 bg-bg-secondary rounded-lg">
                <Calendar className="w-10 h-10 text-icon flex-shrink-0" />
                <div>
                  <p className="text-sm text-secondary-text">Date Played</p>
                  <p className="font-medium text-text">
                    {battle.date_played ? formatLocalDate(battle.date_played, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'No date'}
                  </p>
                </div>
              </div>

              {/* Opponent */}
              <div className="flex items-center space-x-3 p-4 bg-bg-secondary rounded-lg">
                <User className="w-10 h-10 text-icon flex-shrink-0" />
                <div>
                  <p className="text-sm text-secondary-text">Opponent</p>
                  <p className="font-medium text-text">{battle.opp_name || 'No opponent'}</p>
                </div>
              </div>

              {/* Result */}
              <div className="flex items-center space-x-3 p-4 bg-bg-secondary rounded-lg">
                <Trophy className="w-10 h-10 text-icon flex-shrink-0" />
                <div>
                  <p className="text-sm text-secondary-text">Result</p>
                  <p className={`font-medium ${getResultColor(battle.result)}`}>
                    {battle.result || 'No result recorded'}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center space-x-3 p-4 bg-bg-secondary rounded-lg">
                <MapPin className="w-10 h-10 text-icon flex-shrink-0" />
                <div>
                  <p className="text-sm text-secondary-text">Location</p>
                  <p className="font-medium text-text">{battle.location || 'No location'}</p>
                </div>
              </div>
            </div>

            {/* Battle Notes - only show if notes exist */}
            {battle.battle_notes && (
              <div className="bg-bg-secondary rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <FileText className="w-5 h-5 text-icon" />
                  <h3 className="text-lg font-semibold text-text">Battle Notes</h3>
                </div>
                <div className="prose prose-sm max-w-none text-text">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0 text-base text-text">{children}</p>,
                      h1: ({ children }) => <h1 className="text-base font-bold mb-2 text-text">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-text">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-base font-bold mb-1 text-text">{children}</h3>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="text-base text-text">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-text">{children}</strong>,
                      em: ({ children }) => <em className="italic text-text">{children}</em>,
                      code: ({ children }) => <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                      pre: ({ children }) => <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono overflow-x-auto mb-2">{children}</pre>,
                      blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-3 italic mb-2 text-text">{children}</blockquote>,
                    }}
                  >
                    {battle.battle_notes}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Created Date */}
            <div className="pt-4 border-t border-border-custom">
              <p className="text-sm text-secondary-text">
                Battle logged on {formatLocalDate(battle.created_at, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteBattleModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        battleName={battle.battle_name || undefined}
        onConfirm={async () => {
          if (!battle) return
          
          setDeleting(true)
          try {
            // Perform the actual deletion
            const { error } = await supabase
              .from('battles')
              .delete()
              .eq('id', battle.id)

            if (error) throw error

            // Call the callback to refresh the battles list
            onBattleDeleted?.()
            setShowDeleteModal(false)
            onClose()
          } catch (error) {
            console.error('Error deleting battle:', error)
            // You could add error handling UI here
          } finally {
            setDeleting(false)
          }
        }}
                 loading={deleting}
       />

       {/* Edit Modal */}
       <EditBattleModal
         isOpen={showEditModal}
         onClose={() => setShowEditModal(false)}
         battle={battle}
         onBattleUpdated={() => {
           onBattleUpdated?.()
           setShowEditModal(false)
         }}
       />
     </>
   )
 }
