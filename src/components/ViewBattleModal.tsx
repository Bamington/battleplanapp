import React, { useState } from 'react'
import { X, Edit, Trash2, Calendar, User, Gamepad2, Trophy, Image } from 'lucide-react'
import { DeleteBattleModal } from './DeleteBattleModal'
import { EditBattleModal } from './EditBattleModal'
import { formatLocalDate } from '../utils/timezone'

interface Battle {
  id: number
  battle_name: string | null
  date_played: string | null
  game_name: string | null
  game_uid: string | null
  game_icon: string | null
  image_url: string | null
  opp_name: string | null
  opp_id: string[] | null
  result: string | null
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

  const isValidGameIcon = (iconUrl: string | null | undefined): boolean => {
    return !!(iconUrl && 
      typeof iconUrl === 'string' &&
      iconUrl.trim() !== '' && 
      iconUrl !== 'undefined' && 
      iconUrl !== 'null' &&
      iconUrl.startsWith('http') &&
      iconUrl.includes('game-assets'))
  }

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
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={handleBackdropClick}
      >
        <div className="bg-modal-bg rounded-lg max-w-2xl w-full p-6 overflow-y-auto transition-all duration-300 ease-out transform
          fixed inset-0 sm:relative sm:inset-auto sm:max-w-2xl sm:h-auto sm:rounded-lg sm:max-h-[90vh] h-screen w-screen sm:w-full overflow-y-auto rounded-none sm:rounded-lg p-6 sm:p-6">
          
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
                 {isValidGameIcon(battle.game_icon) ? (
                   <>
                     <img
                       src={battle.game_icon || ''}
                       alt={`${battle.game_name || 'Unknown Game'} icon`}
                       className="w-10 h-10 object-contain rounded flex-shrink-0"
                       onError={(e) => {
                         const target = e.target as HTMLImageElement
                         console.warn('Game icon failed to load:', battle.game_icon, 'Falling back to letter icon')
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
            </div>

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
        onConfirm={async () => {
          setDeleting(true)
          try {
            // The actual delete logic is handled by the parent component
            // This modal just triggers the callback
            onBattleDeleted?.()
            setShowDeleteModal(false)
            onClose()
          } catch (error) {
            console.error('Error deleting battle:', error)
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
