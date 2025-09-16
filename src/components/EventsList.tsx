import React, { useState, useEffect } from 'react'
import { Calendar, MapPin, Users, Plus, Edit, Trash2, MoreVertical } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Tables } from '../lib/database.types'
import { formatLocalDate } from '../utils/timezone'

type Event = Tables<'events'>

interface EventsListProps {
  onCreateEvent: () => void
}

export function EventsList({ onCreateEvent }: EventsListProps) {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchEvents()
    }
  }, [user])

  const fetchEvents = async () => {
    if (!user) return

    try {
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

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This will not delete the battles, but will remove them from the event.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (error) throw error

      setEvents(events.filter(event => event.id !== eventId))
      setSelectedEvent(null)
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate && !endDate) return 'No dates set'
    if (!endDate) return formatLocalDate(startDate!, { month: 'short', day: 'numeric', year: 'numeric' })
    if (startDate === endDate) return formatLocalDate(startDate, { month: 'short', day: 'numeric', year: 'numeric' })

    const start = formatLocalDate(startDate!, { month: 'short', day: 'numeric' })
    const end = formatLocalDate(endDate, { month: 'short', day: 'numeric', year: 'numeric' })
    return `${start} - ${end}`
  }

  const getBattleCount = async (eventId: string): Promise<number> => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text">Events</h2>
        <button
          onClick={onCreateEvent}
          className="btn-primary btn-with-icon"
        >
          <Plus className="w-4 h-4" />
          <span>New Event</span>
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-secondary-text mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text mb-2">No Events Yet</h3>
          <p className="text-secondary-text mb-4">
            Create events to group your battles by tournaments, campaigns, or other occasions.
          </p>
          <button
            onClick={onCreateEvent}
            className="btn-primary btn-with-icon"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Event</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isSelected={selectedEvent === event.id}
              onSelect={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
              onDelete={() => deleteEvent(event.id)}
              getBattleCount={getBattleCount}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface EventCardProps {
  event: Event
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  getBattleCount: (eventId: string) => Promise<number>
}

function EventCard({ event, isSelected, onSelect, onDelete, getBattleCount }: EventCardProps) {
  const [battleCount, setBattleCount] = useState<number | null>(null)

  useEffect(() => {
    getBattleCount(event.id).then(setBattleCount)
  }, [event.id, getBattleCount])

  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate && !endDate) return 'No dates set'
    if (!endDate) return formatLocalDate(startDate!, { month: 'short', day: 'numeric', year: 'numeric' })
    if (startDate === endDate) return formatLocalDate(startDate, { month: 'short', day: 'numeric', year: 'numeric' })

    const start = formatLocalDate(startDate!, { month: 'short', day: 'numeric' })
    const end = formatLocalDate(endDate, { month: 'short', day: 'numeric', year: 'numeric' })
    return `${start} - ${end}`
  }

  return (
    <div className="bg-bg-secondary border border-border-custom rounded-lg p-4 hover:border-brand/30 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-text mb-2">{event.name}</h3>

          <div className="flex flex-wrap gap-4 text-sm text-secondary-text mb-3">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDateRange(event.start_date, event.end_date)}</span>
            </div>

            {event.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{battleCount !== null ? `${battleCount} battles` : 'Loading...'}</span>
            </div>
          </div>

          {event.description && (
            <p className="text-secondary-text text-sm">{event.description}</p>
          )}
        </div>

        <div className="relative">
          <button
            onClick={onSelect}
            className="p-2 rounded-md hover:bg-bg-tertiary transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-secondary-text" />
          </button>

          {isSelected && (
            <div className="absolute right-0 top-full mt-1 bg-bg-secondary border border-border-custom rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
              <button
                onClick={() => {/* TODO: Implement edit */}}
                className="w-full px-3 py-2 text-left text-sm text-text hover:bg-bg-tertiary flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={onDelete}
                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-bg-tertiary flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}