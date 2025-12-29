import React, { useState, useEffect, useRef } from 'react'
import { Sword } from 'lucide-react'
import { BattleCard } from './BattleCard'
import { ViewBattleModal } from './ViewBattleModal'
import { DeleteBattleModal } from './DeleteBattleModal'
import { BattleSubMenu } from './BattleSubMenu'
import { StatisticsPage } from './StatisticsPage'
import { EditBattleModal } from './EditBattleModal'
import { CampaignsList } from './CampaignsList'
import { NewCampaignModal } from './NewCampaignModal'
import { ViewCampaignModal } from './ViewCampaignModal'
import { EditCampaignModal } from './EditCampaignModal'
import { DeleteCampaignModal } from './DeleteCampaignModal'
import { AddBattlesToCampaignModal } from './AddBattlesToCampaignModal'
import { ListsPage } from './ListsPage'
import { useBattles, Battle } from '../hooks/useBattles'
import { useCampaigns } from '../hooks/useCampaigns'
import { supabase } from '../lib/supabase'

interface BattlesPageProps {
  onBack?: () => void
  onRefetchReady?: (refetchFn: () => void) => void
  initialView?: 'battles' | 'lists' | 'statistics' | 'campaigns'
}

export function BattlesPage({ onBack, onRefetchReady, initialView = 'battles' }: BattlesPageProps) {
  const [activeView, setActiveView] = useState<'battles' | 'lists' | 'statistics' | 'campaigns'>(initialView)
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
  const [newCampaignModal, setNewCampaignModal] = useState(false)
  const [viewCampaignModal, setViewCampaignModal] = useState<{
    isOpen: boolean
    campaign: any | null
  }>({
    isOpen: false,
    campaign: null
  })
  const [editCampaignModal, setEditCampaignModal] = useState<{
    isOpen: boolean
    campaign: any | null
  }>({
    isOpen: false,
    campaign: null
  })
  const [deleteCampaignModal, setDeleteCampaignModal] = useState<{
    isOpen: boolean
    campaignId: string | null
    campaignName: string | null
  }>({
    isOpen: false,
    campaignId: null,
    campaignName: null
  })
  const [deleting, setDeleting] = useState(false)
  const [deletingCampaign, setDeletingCampaign] = useState(false)
  const [addBattlesToCampaignModal, setAddBattlesToCampaignModal] = useState<{
    isOpen: boolean
    campaign: any | null
  }>({
    isOpen: false,
    campaign: null
  })
  const [refreshCampaigns, setRefreshCampaigns] = useState<(() => void) | null>(null)
  const [imageRefreshKey, setImageRefreshKey] = useState(0)
  const { battles, loading, refetch } = useBattles()
  const { fetchCampaigns } = useCampaigns()

  // Update activeView when initialView prop changes
  useEffect(() => {
    setActiveView(initialView)
  }, [initialView])
  
  // Expose the refetch function to parent component only once when component mounts
  useEffect(() => {
    if (onRefetchReady) {
      onRefetchReady(refetch)
    }
  }, [onRefetchReady]) // Only depend on onRefetchReady, not refetch
  

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
    setImageRefreshKey(prev => prev + 1) // Force image refresh
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

  const handleEditCampaign = (campaign: any) => {
    setEditCampaignModal({
      isOpen: true,
      campaign
    })
    setViewCampaignModal({ isOpen: false, campaign: null })
  }

  const handleDeleteCampaign = (campaign: any) => {
    setDeleteCampaignModal({
      isOpen: true,
      campaignId: campaign.id,
      campaignName: campaign.name
    })
    setViewCampaignModal({ isOpen: false, campaign: null })
  }

  const handleConfirmDeleteCampaign = async () => {
    if (!deleteCampaignModal.campaignId) return

    setDeletingCampaign(true)
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', deleteCampaignModal.campaignId)

      if (error) throw error

      // Refresh campaigns and close modal
      if (refreshCampaigns) {
        refreshCampaigns()
      }
      setDeleteCampaignModal({ isOpen: false, campaignId: null, campaignName: null })
    } catch (error) {
      console.error('Error deleting campaign:', error)
    } finally {
      setDeletingCampaign(false)
    }
  }

  const handleCampaignUpdated = async () => {
    if (refreshCampaigns) {
      refreshCampaigns()
    }
    // Update the campaign in the view modal if it's open
    if (viewCampaignModal.isOpen && viewCampaignModal.campaign) {
      const updatedCampaign = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', viewCampaignModal.campaign.id)
        .single()

      if (updatedCampaign.data) {
        setViewCampaignModal({
          isOpen: true,
          campaign: updatedCampaign.data
        })
      }
    }
  }

  const handleAddBattleToCampaign = (campaign: any) => {
    setAddBattlesToCampaignModal({
      isOpen: true,
      campaign
    })
    setViewCampaignModal({ isOpen: false, campaign: null })
  }

  const handleBattlesAddedToCampaign = async () => {
    // Refresh the campaigns list
    if (refreshCampaigns) {
      refreshCampaigns()
    }
    // Refresh battles in case they were removed from the uncategorized list
    refetch()

    // If the ViewCampaignModal is open, refresh the campaign to update battle list
    if (addBattlesToCampaignModal.campaign) {
      const updatedCampaign = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', addBattlesToCampaignModal.campaign.id)
        .single()

      if (updatedCampaign.data) {
        setViewCampaignModal({
          isOpen: true,
          campaign: updatedCampaign.data
        })
      }
    }
  }

  const handleBattleRemoved = async () => {
    // Refresh the campaigns list to update battle counts
    if (refreshCampaigns) {
      refreshCampaigns()
    }
    // Refresh battles list in case we're viewing the battles tab
    refetch()
  }

  return (
    <>
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-title mb-4">BATTLES</h1>
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
      ) : activeView === 'lists' ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
          <ListsPage />
        </div>
      ) : activeView === 'campaigns' ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
          <CampaignsList
            onCreateCampaign={() => setNewCampaignModal(true)}
            onRefreshReady={(refreshFn) => setRefreshCampaigns(() => refreshFn)}
            onViewCampaign={(campaign) => setViewCampaignModal({
              isOpen: true,
              campaign
            })}
          />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
          {/* Battles Content */}



        {/* Battles Grid */}
        <div className="mb-8">
          {loading ? (
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
          ) : battles.length === 0 ? (
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
                    imageRefreshKey={imageRefreshKey}
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

      <NewCampaignModal
        isOpen={newCampaignModal}
        onClose={() => setNewCampaignModal(false)}
        onCampaignCreated={() => {
          if (refreshCampaigns) {
            refreshCampaigns()
          }
          setNewCampaignModal(false)
        }}
      />

      <ViewCampaignModal
        isOpen={viewCampaignModal.isOpen}
        campaign={viewCampaignModal.campaign}
        onClose={() => setViewCampaignModal({
          isOpen: false,
          campaign: null
        })}
        onEdit={handleEditCampaign}
        onDelete={handleDeleteCampaign}
        onAddBattle={handleAddBattleToCampaign}
        onBattleRemoved={handleBattleRemoved}
      />

      <EditCampaignModal
        isOpen={editCampaignModal.isOpen}
        campaign={editCampaignModal.campaign}
        onClose={() => setEditCampaignModal({ isOpen: false, campaign: null })}
        onCampaignUpdated={handleCampaignUpdated}
      />

      <DeleteCampaignModal
        isOpen={deleteCampaignModal.isOpen}
        onClose={() => setDeleteCampaignModal({ isOpen: false, campaignId: null, campaignName: null })}
        onConfirm={handleConfirmDeleteCampaign}
        campaignName={deleteCampaignModal.campaignName || undefined}
        loading={deletingCampaign}
      />

      <AddBattlesToCampaignModal
        isOpen={addBattlesToCampaignModal.isOpen}
        campaign={addBattlesToCampaignModal.campaign}
        onClose={() => setAddBattlesToCampaignModal({ isOpen: false, campaign: null })}
        onBattlesAdded={handleBattlesAddedToCampaign}
      />
    </>
  )
}
