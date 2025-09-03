import React, { useState, useEffect, useRef } from 'react'
import { Sword } from 'lucide-react'
import { BattleCard } from './BattleCard'
import { ViewBattleModal } from './ViewBattleModal'
import { DeleteBattleModal } from './DeleteBattleModal'
import { BattleSubMenu } from './BattleSubMenu'
import { StatisticsPage } from './StatisticsPage'
import { EditBattleModal } from './EditBattleModal'
import { useBattles } from '../hooks/useBattles'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

// Use the Battle type from database types
type Battle = Database['public']['Tables']['battles']['Row'] & {
  game_icon?: string | null // Optional since it's added by the hook
}

interface BattlesPageProps {
  onBack?: () => void
  onRefetchReady?: (refetchFn: () => void) => void
}

export function BattlesPage({ onBack, onRefetchReady }: BattlesPageProps) {
  const [activeView, setActiveView] = useState<'battles' | 'statistics'>('battles')
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    battleId: number | null
    battleName: string | null
  }>({
    isOpen: false,
    battleId: null,
    battleName: null
  })
  const [viewBattleModal, setViewBattleModal] = useState<{
    isOpen: boolean
    battle: any | null
  }>({
    isOpen: false,
    battle: null
  })
  const [editBattleModal, setEditBattleModal] = useState<{
    isOpen: boolean
    battle: any | null
  }>({
    isOpen: false,
    battle: null
  })
  const [deleting, setDeleting] = useState(false)
  const { battles, loading, hasInitialized, refetch } = useBattles()
  
  // Expose the refetch function to parent component only once when component mounts
  useEffect(() => {
    if (onRefetchReady) {
      onRefetchReady(refetch)
    }
  }, [onRefetchReady]) // Only depend on onRefetchReady, not refetch
  
  // Debug logging to help identify the issue
  console.log('BattlesPage render:', { loading, hasInitialized, battlesLength: battles.length })

  const handleDeleteBattle = (battle: Battle) => {
    setDeleteModal({
      isOpen: true,
      battleId: battle.id,
      battleName: battle.battle_name
    })
  }

  const handleEditBattle = (battle: any) => {
    setEditBattleModal({
      isOpen: true,
      battle
    })
  }

  const handleConfirmDelete = async () => {
    if (!deleteModal.battleId) return

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('battles')
        .delete()
        .eq('id', deleteModal.battleId)

      if (error) throw error

      // Refresh battles and close modal
      await refetch()
      setDeleteModal({ isOpen: false, battleId: null, battleName: null })
    } catch (error) {
      console.error('Error deleting battle:', error)
      // You could add error handling UI here
    } finally {
      setDeleting(false)
    }
  }



  const handleViewBattle = (battle: any) => {
    setViewBattleModal({
      isOpen: true,
      battle
    })
  }

  const handleBattleDeleted = () => {
    refetch()
  }

  const handleBattleUpdated = async () => {
    await refetch()
    // Update the battle in the view modal if it's open
    if (viewBattleModal.isOpen && viewBattleModal.battle) {
      const updatedBattles = await supabase
        .from('battles')
        .select('*')
        .eq('id', viewBattleModal.battle.id)
        .single()
      
      if (updatedBattles.data) {
        setViewBattleModal({
          isOpen: true,
          battle: updatedBattles.data
        })
      }
    }
  }

  return (
    <>
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-title mb-4">YOUR BATTLES</h1>
        </div>
      </div>

      {/* Sub Navigation */}
      <BattleSubMenu
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {/* Content based on active view */}
      {activeView === 'statistics' ? (
        <StatisticsPage />
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
          {/* Battles Content */}



        {/* Battles Grid */}
        <div className="mb-8">
          {loading || !hasInitialized ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Skeleton battle cards */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-bg-card rounded-lg shadow-sm border border-border-custom overflow-hidden animate-pulse">
                  {/* Image skeleton */}
                  <div className="h-48 bg-secondary-text opacity-20"></div>
                  
                  {/* Content skeleton */}
                  <div className="p-4">
                    {/* Title skeleton */}
                    <div className="h-6 bg-secondary-text opacity-20 rounded w-3/4 mb-3"></div>
                    
                    {/* Game skeleton */}
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-4 h-4 bg-secondary-text opacity-20 rounded"></div>
                      <div className="h-4 bg-secondary-text opacity-20 rounded w-1/3"></div>
                    </div>
                    
                    {/* Date skeleton */}
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-4 h-4 bg-secondary-text opacity-20 rounded"></div>
                      <div className="h-4 bg-secondary-text opacity-20 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !loading && hasInitialized && battles.length === 0 ? (
            <div className="text-center py-16">
              <Sword className="w-20 h-20 text-secondary-text mx-auto mb-6" />
              <p className="text-xl text-secondary-text mb-4">No battles logged yet.</p>
              <p className="text-base text-secondary-text">Use the action button in the tab bar to log your first battle.</p>
            </div>
          ) : (
            <>
              {/* Battles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {battles.map((battle) => (
                  <BattleCard
                    key={battle.id}
                    battle={battle}
                    onViewBattle={() => handleViewBattle(battle)}
                    onDeleteBattle={handleDeleteBattle}
                    onEditBattle={handleEditBattle}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        </div>
      )}

      <DeleteBattleModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, battleId: null, battleName: null })}
        onConfirm={handleConfirmDelete}
        battleName={deleteModal.battleName || undefined}
        loading={deleting}
      />



      <ViewBattleModal
        isOpen={viewBattleModal.isOpen}
        battle={viewBattleModal.battle}
        onClose={() => setViewBattleModal({ isOpen: false, battle: null })}
        onBattleDeleted={handleBattleDeleted}
        onBattleUpdated={handleBattleUpdated}
      />

      <EditBattleModal
        isOpen={editBattleModal.isOpen}
        battle={editBattleModal.battle}
        onClose={() => setEditBattleModal({ isOpen: false, battle: null })}
        onBattleUpdated={handleBattleUpdated}
      />
    </>
  )
}
