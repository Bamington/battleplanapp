import React, { useState } from 'react'
import { X, Users } from 'lucide-react'
import { useUnits } from '../hooks/useUnits'
import { getUnitTypesForGame, validateUnit } from '../utils/listUtils'

interface AddUnitModalProps {
  isOpen: boolean
  onClose: () => void
  listId: string
}

export function AddUnitModal({ isOpen, onClose, listId }: AddUnitModalProps) {
  const { createUnit } = useUnits(listId)
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    model_count: '1',
    cost: '',
    notes: ''
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const unitTypes = getUnitTypesForGame()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateUnit({
      name: formData.name,
      type: formData.type || null,
      model_count: parseInt(formData.model_count),
      cost: formData.cost ? parseInt(formData.cost) : null,
      notes: formData.notes || null
    })

    if (validationError) {
      setError(validationError)
      return
    }

    setCreating(true)
    setError(null)

    try {
      const result = await createUnit({
        name: formData.name.trim(),
        type: formData.type || null,
        model_count: parseInt(formData.model_count),
        cost: formData.cost ? parseInt(formData.cost) : 0,
        notes: formData.notes.trim() || null
      })

      if (result) {
        // Reset form
        setFormData({
          name: '',
          type: '',
          model_count: '1',
          cost: '',
          notes: ''
        })
        onClose()
      } else {
        setError('Failed to create unit')
      }
    } catch (err) {
      setError('An error occurred while creating the unit')
    } finally {
      setCreating(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      type: '',
      model_count: '1',
      cost: '',
      notes: ''
    })
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-modal-bg rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-icon" />
            <h2 className="text-lg font-bold text-title">Add Unit</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-secondary-text hover:text-text transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-secondary-text mb-1">
              Unit Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="e.g., Space Marine Intercessors"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input-field"
              >
                <option value="">Select type...</option>
                {unitTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">
                Model Count *
              </label>
              <input
                type="number"
                value={formData.model_count}
                onChange={(e) => setFormData({ ...formData, model_count: e.target.value })}
                className="input-field"
                min="1"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-text mb-1">
              Points Cost
            </label>
            <input
              type="number"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              className="input-field"
              placeholder="e.g., 100"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-text mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field resize-none"
              rows={2}
              placeholder="Optional notes about this unit..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary flex-1"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={creating}
            >
              {creating ? 'Adding...' : 'Add Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
