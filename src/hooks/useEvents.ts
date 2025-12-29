import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { Tables } from '../lib/database.types'

type Event = Tables<'events'>

export function useEvents() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchEvents()
    } else {
      setEvents([])
      setLoading(false)
    }
  }, [user])

  const fetchEvents = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const createEvent = async (eventData: {
    name: string
    description?: string | null
    location?: string | null
    start_date?: string | null
    end_date?: string | null
  }) => {
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('events')
      .insert({
        ...eventData,
        user_id: user.id
      })
      .select()
      .single()

    if (error) throw error

    setEvents(prev => [data, ...prev])
    return data
  }

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    setEvents(prev => prev.map(event =>
      event.id === id ? data : event
    ))
    return data
  }

  const deleteEvent = async (id: string) => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (error) throw error

    setEvents(prev => prev.filter(event => event.id !== id))
  }

  const getEventBattleCount = async (eventId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('battles')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error fetching battle count:', error)
      return 0
    }
  }

  return {
    events,
    loading,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventBattleCount
  }
}