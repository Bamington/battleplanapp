import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type Unit = Database['public']['Tables']['units']['Row']
type UnitInsert = Database['public']['Tables']['units']['Insert']
type UnitUpdate = Database['public']['Tables']['units']['Update']

export interface UnitWithModels extends Unit {
  models?: {
    id: string
    name: string
    image_url: string | null
    status: string | null
  }[]
}

export function useUnits(listId: string | null) {
  const [units, setUnits] = useState<UnitWithModels[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchUnits = async () => {
    try {
      if (!listId) {
        setUnits([])
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('units')
        .select(`
          *,
          unit_models:unit_models(
            model:models(id, name, image_url, status)
          )
        `)
        .eq('list_id', listId)
        .order('display_order', { ascending: true })

      if (error) {
        console.error('Error fetching units:', error)
        setUnits([])
      } else {
        // Transform the data to flatten the models
        const unitsWithModels = (data || []).map(unit => ({
          ...unit,
          models: unit.unit_models?.map((um: any) => um.model).filter(Boolean) || []
        }))
        setUnits(unitsWithModels)
      }
    } catch (error) {
      console.error('Error fetching units:', error)
      setUnits([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUnits()
  }, [listId])

  const createUnit = async (unitData: Omit<UnitInsert, 'list_id'>): Promise<Unit | null> => {
    try {
      if (!listId) throw new Error('List ID is required')

      // Get the next display order
      const { data: existingUnits } = await supabase
        .from('units')
        .select('display_order')
        .eq('list_id', listId)
        .order('display_order', { ascending: false })
        .limit(1)

      const nextOrder = existingUnits && existingUnits.length > 0
        ? (existingUnits[0].display_order || 0) + 1
        : 0

      const { data, error } = await supabase
        .from('units')
        .insert({
          ...unitData,
          list_id: listId,
          display_order: nextOrder
        })
        .select()
        .single()

      if (error) throw error

      await fetchUnits()
      return data
    } catch (error) {
      console.error('Error creating unit:', error)
      return null
    }
  }

  const updateUnit = async (id: string, updates: UnitUpdate): Promise<Unit | null> => {
    try {
      const { data, error } = await supabase
        .from('units')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await fetchUnits()
      return data
    } catch (error) {
      console.error('Error updating unit:', error)
      return null
    }
  }

  const deleteUnit = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchUnits()
      return true
    } catch (error) {
      console.error('Error deleting unit:', error)
      return false
    }
  }

  const reorderUnits = async (orderedUnitIds: string[]): Promise<boolean> => {
    try {
      if (!listId) throw new Error('List ID is required')

      // Update each unit with its new display order
      const updates = orderedUnitIds.map((unitId, index) =>
        supabase
          .from('units')
          .update({ display_order: index })
          .eq('id', unitId)
          .eq('list_id', listId)
      )

      await Promise.all(updates)
      await fetchUnits()
      return true
    } catch (error) {
      console.error('Error reordering units:', error)
      return false
    }
  }

  const addModelToUnit = async (unitId: string, modelId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('unit_models')
        .insert({
          unit_id: unitId,
          model_id: modelId
        })

      if (error) throw error

      await fetchUnits()
      return true
    } catch (error) {
      console.error('Error adding model to unit:', error)
      return false
    }
  }

  const removeModelFromUnit = async (unitId: string, modelId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('unit_models')
        .delete()
        .eq('unit_id', unitId)
        .eq('model_id', modelId)

      if (error) throw error

      await fetchUnits()
      return true
    } catch (error) {
      console.error('Error removing model from unit:', error)
      return false
    }
  }

  return {
    units,
    isLoading,
    createUnit,
    updateUnit,
    deleteUnit,
    reorderUnits,
    addModelToUnit,
    removeModelFromUnit,
    refreshUnits: fetchUnits
  }
}
