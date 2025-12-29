import React, { useState } from 'react'
import { Plus, ClipboardList } from 'lucide-react'
import { ListCard } from './ListCard'
import { NewListModal } from './NewListModal'
import { ViewListModal } from './ViewListModal'
import { useLists, type ListWithGame } from '../hooks/useLists'

export function ListsPage() {
  const { lists, isLoading } = useLists()
  const [showNewListModal, setShowNewListModal] = useState(false)
  const [viewListModal, setViewListModal] = useState<{
    isOpen: boolean
    list: ListWithGame | null
  }>({
    isOpen: false,
    list: null
  })

  const handleViewList = (list: ListWithGame) => {
    setViewListModal({
      isOpen: true,
      list
    })
  }

  const handleCloseViewModal = () => {
    setViewListModal({
      isOpen: false,
      list: null
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-secondary-text">Loading lists...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ClipboardList className="w-6 h-6 text-icon" />
          <h2 className="text-2xl font-bold text-title">Army Lists</h2>
        </div>
        <button
          onClick={() => setShowNewListModal(true)}
          className="btn-primary btn-with-icon"
        >
          <Plus className="w-4 h-4" />
          <span>New List</span>
        </button>
      </div>

      {/* Lists Grid */}
      {lists.length === 0 ? (
        <div className="text-center py-12 bg-bg-primary rounded-lg border border-border-custom">
          <ClipboardList className="w-16 h-16 text-icon mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-title mb-2">No Lists Yet</h3>
          <p className="text-secondary-text mb-6">
            Create your first army list to get started
          </p>
          <button
            onClick={() => setShowNewListModal(true)}
            className="btn-primary btn-with-icon"
          >
            <Plus className="w-4 h-4" />
            <span>Create List</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              onClick={handleViewList}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <NewListModal
        isOpen={showNewListModal}
        onClose={() => setShowNewListModal(false)}
      />

      <ViewListModal
        isOpen={viewListModal.isOpen}
        onClose={handleCloseViewModal}
        list={viewListModal.list}
      />
    </div>
  )
}
