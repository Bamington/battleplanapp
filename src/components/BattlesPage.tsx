import React, { useState } from 'react'
import { Sword, Plus, AlertTriangle } from 'lucide-react'
import { BattleListItem } from './BattleListItem'
import { ViewBattleModal } from './ViewBattleModal'
import { DeleteBattleModal } from './DeleteBattleModal'
import { NewBattleModal } from './NewBattleModal'
import { useBattles } from '../hooks/useBattles'
import { supabase } from '../lib/supabase'

interface BattlesPageProps {
  onBack: () => void
}

export function BattlesPage({ onBack }: BattlesPageProps) {
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    battleId: number | null
  }>({
    isOpen: false,
    battleId: null
  })
  const [viewBattleModal, setViewBattleModal] = useState<{
    isOpen: boolean
    battle: any | null
  }>({
    isOpen: false,
    battle: null
  })
  const [newBattleModal, setNewBattleModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { battles, loading, hasInitialized, refetch } = useBattles()

  const handleDeleteBattle = (battleId: number) => {
    setDeleteModal({
      isOpen: true,
      battleId
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
      setDeleteModal({ isOpen: false, battleId: null })
    } catch (error) {
      console.error('Error deleting battle:', error)
      // You could add error handling UI here
    } finally {
      setDeleting(false)
    }
  }

  const handleBattleCreated = () => {
    refetch()
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-title mb-4">YOUR BATTLES</h1>
        </div>

        {/* Construction Alert Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-amber-800 mb-1">
                Battle tracking is still under construction!
              </h3>
              <p className="text-sm text-amber-700">
                Please feel free to experiment with this feature - but be warned! Your data may be lost as we continue to build this feature.
              </p>
            </div>
          </div>
        </div>

        {/* Battles List */}
        <div className="mb-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Skeleton battle cards */}
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-bg-card rounded-lg shadow-sm border border-border-custom p-4 animate-pulse">
                  {/* Title skeleton */}
                  <div className="h-6 bg-secondary-text opacity-20 rounded w-3/4 mb-3"></div>
                  
                  {/* Game skeleton */}
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-4 h-4 bg-secondary-text opacity-20 rounded"></div>
                    <div className="h-4 bg-secondary-text opacity-20 rounded w-1/3"></div>
                  </div>
                  
                  {/* Date skeleton */}
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-4 h-4 bg-secondary-text opacity-20 rounded"></div>
                    <div className="h-4 bg-secondary-text opacity-20 rounded w-1/2"></div>
                  </div>
                  
                  {/* Location skeleton */}
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-4 h-4 bg-secondary-text opacity-20 rounded"></div>
                    <div className="h-4 bg-secondary-text opacity-20 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : hasInitialized && battles.length === 0 ? (
            <div className="text-center py-12">
              <Sword className="w-16 h-16 text-secondary-text mx-auto mb-4" />
              <p className="text-base text-secondary-text mb-4">No battles logged yet.</p>
              <div className="flex justify-center">
                <button 
                  className="btn-primary"
                  onClick={() => setNewBattleModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Log Your First Battle
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Battles List */}
              <div className="bg-bg-card rounded-lg border border-border-custom overflow-hidden">
                <div className="divide-y divide-border-custom">
                  {battles.map((battle) => (
                    <BattleListItem
                      key={battle.id}
                      battle={battle}
                      onViewBattle={() => handleViewBattle(battle)}
                      onDeleteBattle={handleDeleteBattle}
                    />
                  ))}
                </div>
              </div>
              
              {/* Add Battle FAB */}
              <div className="fixed bottom-20 right-4 z-30">
                <button
                  onClick={() => setNewBattleModal(true)}
                  className="bg-brand hover:bg-brand/90 text-white rounded-full p-4 shadow-lg transition-colors"
                  title="Add New Battle"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <DeleteBattleModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, battleId: null })}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />

      <NewBattleModal
        isOpen={newBattleModal}
        onClose={() => setNewBattleModal(false)}
        onBattleCreated={handleBattleCreated}
      />

      <ViewBattleModal
        isOpen={viewBattleModal.isOpen}
        onClose={() => setViewBattleModal({ isOpen: false, battle: null })}
        onBattleDeleted={handleBattleDeleted}
        onBattleUpdated={handleBattleUpdated}
        battle={viewBattleModal.battle}
      />
    </>
  )
}
