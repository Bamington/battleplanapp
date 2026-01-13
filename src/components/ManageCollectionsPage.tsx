import React, { useState, useEffect } from 'react'
import { ArrowLeft, Package, Edit, Search, Save, X, Users, Filter, ChevronDown, CheckSquare, Square } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { MultiSelectDropdown } from './MultiSelectDropdown'
import { SingleSelectDropdown } from './SingleSelectDropdown'
import { useAuth } from '../hooks/useAuth'

interface User {
  id: string
  email: string
  user_name_public?: string | null
}

interface Collection {
  id: string
  name: string
  user_id: string
  created_at: string
  public: boolean
  type: string
  models_count: number
  user: {
    email: string
    user_name_public?: string | null
  }
  game: {
    name: string
  } | null
}

interface ManageCollectionsPageProps {
  onBack: () => void
}

export function ManageCollectionsPage({ onBack }: ManageCollectionsPageProps) {
  const { user: currentUser } = useAuth()
  const [collections, setCollections] = useState<Collection[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingCollection, setEditingCollection] = useState<string | null>(null)
  const [newUserId, setNewUserId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter and sort states
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedGames, setSelectedGames] = useState<string[]>([])
  const [sortOrder, setSortOrder] = useState('created_at_desc')
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
  const [publicFilter, setPublicFilter] = useState<'all' | 'public' | 'private'>('all')

  // Selection and bulk actions
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<Set<string>>(new Set())
  const [bulkTypeChange, setBulkTypeChange] = useState<string>('')
  const [bulkGameChange, setBulkGameChange] = useState<string>('')
  const [games, setGames] = useState<Array<{ id: string; name: string }>>([])
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)

  useEffect(() => {
    fetchCollections()
    fetchUsers()
    fetchGames()
  }, [])

  const fetchCollections = async () => {
    try {
      setLoading(true)

      console.log('Current user admin status:', currentUser?.is_admin)
      console.log('Current user ID:', currentUser?.id)

      // Try to fetch all collections using a more explicit approach
      // First, let's see if we can get a count of all boxes
      const { count: totalBoxCount, error: countError } = await supabase
        .from('boxes')
        .select('*', { count: 'exact', head: true })

      console.log('Total boxes in database (bypassing RLS?):', totalBoxCount)
      console.log('Count error:', countError)

      // First, fetch collections with games and model counts (all collections, not just current user's)
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('boxes')
        .select(`
          id,
          name,
          user_id,
          created_at,
          public,
          type,
          game_id,
          game:games(name),
          model_boxes(
            model:models(count)
          )
        `)
        .order('created_at', { ascending: false })

      console.log('Fetched collections count:', collectionsData?.length)
      console.log('Sample collections:', collectionsData?.slice(0, 3))
      console.log('Collections error:', collectionsError)

      if (collectionsError) throw collectionsError

      // Get unique user IDs
      const userIds = [...new Set((collectionsData || []).map(collection => collection.user_id))]
      console.log('Unique user IDs from collections:', userIds)

      // Fetch user data separately
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, user_name_public')
        .in('id', userIds)

      console.log('Fetched users data:', usersData)

      if (usersError) throw usersError

      // Create a user lookup map
      const userMap = new Map(usersData?.map(user => [user.id, user]) || [])

      // Transform data and calculate model counts
      const transformedCollections = (collectionsData || []).map(collection => {
        const modelBoxes = Array.isArray(collection.model_boxes) ? collection.model_boxes : []
        const totalCount = modelBoxes.reduce((sum, modelBox) => {
          const modelCount = modelBox.model?.count || 0
          return sum + modelCount
        }, 0)

        const user = userMap.get(collection.user_id)

        return {
          ...collection,
          models_count: totalCount,
          user: user || { email: 'Unknown User', user_name_public: null }
        }
      })

      setCollections(transformedCollections)
    } catch (err) {
      console.error('Error fetching collections:', err)
      setError('Failed to fetch collections')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, user_name_public')
        .order('user_name_public', { ascending: true })

      console.log('All users in database:', data)
      console.log('Total users count:', data?.length)

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error('Error fetching users:', err)
    }
  }

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('id, name')
        .order('name', { ascending: true })

      if (error) throw error
      setGames(data || [])
    } catch (err) {
      console.error('Error fetching games:', err)
    }
  }

  const handleReassignCollection = async (collectionId: string, newOwnerId: string) => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('boxes')
        .update({ user_id: newOwnerId })
        .eq('id', collectionId)

      if (error) throw error

      // Refresh collections
      await fetchCollections()
      setEditingCollection(null)
      setNewUserId('')
    } catch (err) {
      console.error('Error reassigning collection:', err)
      setError('Failed to reassign collection')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleSelection = (collectionId: string) => {
    const newSelection = new Set(selectedCollectionIds)
    if (newSelection.has(collectionId)) {
      newSelection.delete(collectionId)
    } else {
      newSelection.add(collectionId)
    }
    setSelectedCollectionIds(newSelection)
  }

  const handleSelectAll = () => {
    if (selectedCollectionIds.size === filteredCollections.length) {
      setSelectedCollectionIds(new Set())
    } else {
      setSelectedCollectionIds(new Set(filteredCollections.map(c => c.id)))
    }
  }

  const handleBulkTypeChange = async () => {
    if (!bulkTypeChange || selectedCollectionIds.size === 0) return

    try {
      setIsBulkUpdating(true)
      setError(null)

      const { error } = await supabase
        .from('boxes')
        .update({ type: bulkTypeChange })
        .in('id', Array.from(selectedCollectionIds))

      if (error) throw error

      // Refresh collections and clear selection
      await fetchCollections()
      setSelectedCollectionIds(new Set())
      setBulkTypeChange('')
    } catch (err) {
      console.error('Error updating collection types:', err)
      setError('Failed to update collection types')
    } finally {
      setIsBulkUpdating(false)
    }
  }

  const handleBulkGameChange = async () => {
    if (!bulkGameChange || selectedCollectionIds.size === 0) return

    try {
      setIsBulkUpdating(true)
      setError(null)

      // If "None" is selected, set game_id to null, otherwise use the selected game_id
      const updateData = bulkGameChange === 'none' 
        ? { game_id: null }
        : { game_id: bulkGameChange }

      const { error } = await supabase
        .from('boxes')
        .update(updateData)
        .in('id', Array.from(selectedCollectionIds))

      if (error) throw error

      // Refresh collections and clear selection
      await fetchCollections()
      setSelectedCollectionIds(new Set())
      setBulkGameChange('')
    } catch (err) {
      console.error('Error updating collection games:', err)
      setError('Failed to update collection games')
    } finally {
      setIsBulkUpdating(false)
    }
  }

  const getUserDisplayName = (user: User) => {
    return user.user_name_public || user.email
  }

  // Get unique games from collections for filtering
  const getAvailableGames = () => {
    const gameMap = new Map()
    // Add "No Game" option if there are any collections without a game
    const hasNoGameCollections = collections.some(collection => !collection.game)
    if (hasNoGameCollections) {
      gameMap.set('__no_game__', {
        id: '__no_game__',
        name: 'No Game / Unknown'
      })
    }
    collections.forEach(collection => {
      if (collection.game) {
        gameMap.set(collection.game.name, {
          id: collection.game.name,
          name: collection.game.name
        })
      }
    })
    return Array.from(gameMap.values())
  }

  // Get available users for filtering
  const getAvailableUsers = () => {
    const userMap = new Map()
    collections.forEach(collection => {
      if (collection.user) {
        userMap.set(collection.user_id, {
          id: collection.user_id,
          name: getUserDisplayName(collection.user)
        })
      }
    })
    return Array.from(userMap.values())
  }

  // Clear all filters
  const clearFilters = () => {
    setSelectedUsers([])
    setSelectedGames([])
    setSearchQuery('')
    setPublicFilter('all')
    setSortOrder('created_at_desc')
  }

  // Filter and sort collections
  const getFilteredAndSortedCollections = () => {
    let filtered = collections.filter(collection => {
      // Search filter
      const searchMatch = !searchQuery ||
        collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        collection.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (collection.user.user_name_public || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (collection.game?.name || '').toLowerCase().includes(searchQuery.toLowerCase())

      // User filter
      const userMatch = selectedUsers.length === 0 || selectedUsers.includes(collection.user_id)

      // Game filter
      const gameMatch = selectedGames.length === 0 ||
        (selectedGames.includes('__no_game__') && !collection.game) ||
        (collection.game && selectedGames.includes(collection.game.name))

      // Public filter
      const publicMatch = publicFilter === 'all' ||
        (publicFilter === 'public' && collection.public) ||
        (publicFilter === 'private' && !collection.public)

      return searchMatch && userMatch && gameMatch && publicMatch
    })

    // Sort collections
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'name_asc':
          return a.name.localeCompare(b.name)
        case 'name_desc':
          return b.name.localeCompare(a.name)
        case 'created_at_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'created_at_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'models_count_asc':
          return a.models_count - b.models_count
        case 'models_count_desc':
          return b.models_count - a.models_count
        case 'user_name_asc':
          return getUserDisplayName(a.user).localeCompare(getUserDisplayName(b.user))
        case 'user_name_desc':
          return getUserDisplayName(b.user).localeCompare(getUserDisplayName(a.user))
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    return filtered
  }

  const filteredCollections = getFilteredAndSortedCollections()
  const hasActiveFilters = selectedUsers.length > 0 || selectedGames.length > 0 || searchQuery.length > 0 || publicFilter !== 'all'

  return (
    <div className="min-h-screen bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-secondary-text hover:text-text transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Admin Panel</span>
          </button>
          <h1 className="text-4xl font-bold text-title">Collection Manager</h1>
          <p className="text-secondary-text mt-2">Manage and reassign user collections</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search collections by name, owner, or game..."
              className="w-full pl-10 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent text-sm bg-bg-primary text-text"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="bg-bg-card border border-border-custom rounded-lg">
            <button
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-bg-secondary transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-icon" />
                <span className="text-sm font-medium text-text">Filters</span>
                {hasActiveFilters && (
                  <span className="px-2 py-1 bg-brand text-white text-xs rounded-full">
                    Active
                  </span>
                )}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-icon transition-transform ${
                  isFiltersExpanded ? 'transform rotate-180' : ''
                }`}
              />
            </button>

            {isFiltersExpanded && (
              <div className="px-4 pb-4 border-t border-border-custom space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  {/* User Filter */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-text mb-2">
                      Filter by User
                    </label>
                    <MultiSelectDropdown
                      options={getAvailableUsers()}
                      selectedOptions={selectedUsers}
                      onSelectionChange={setSelectedUsers}
                      placeholder="All Users"
                      type="role"
                    />
                  </div>

                  {/* Game Filter */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-text mb-2">
                      Filter by Game
                    </label>
                    <MultiSelectDropdown
                      options={getAvailableGames()}
                      selectedOptions={selectedGames}
                      onSelectionChange={setSelectedGames}
                      placeholder="All Games"
                      type="game"
                    />
                  </div>

                  {/* Public/Private Filter */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-text mb-2">
                      Visibility
                    </label>
                    <SingleSelectDropdown
                      options={[
                        { id: 'all', name: 'All Collections' },
                        { id: 'public', name: 'Public Only' },
                        { id: 'private', name: 'Private Only' }
                      ]}
                      selectedOption={publicFilter}
                      onSelectionChange={(value) => setPublicFilter(value as 'all' | 'public' | 'private')}
                      placeholder="All Collections"
                    />
                  </div>

                  {/* Sort Order */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-text mb-2">
                      Sort By
                    </label>
                    <SingleSelectDropdown
                      options={[
                        { id: 'created_at_desc', name: 'Newest First' },
                        { id: 'created_at_asc', name: 'Oldest First' },
                        { id: 'name_asc', name: 'Name A-Z' },
                        { id: 'name_desc', name: 'Name Z-A' },
                        { id: 'models_count_desc', name: 'Most Models' },
                        { id: 'models_count_asc', name: 'Least Models' },
                        { id: 'user_name_asc', name: 'Owner A-Z' },
                        { id: 'user_name_desc', name: 'Owner Z-A' }
                      ]}
                      selectedOption={sortOrder}
                      onSelectionChange={setSortOrder}
                      placeholder="Sort Order"
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <div className="pt-2 border-t border-border-custom">
                    <button
                      onClick={clearFilters}
                      className="flex items-center space-x-2 text-sm text-secondary-text hover:text-text transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Clear all filters</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {!loading && selectedCollectionIds.size > 0 && (
          <div className="bg-bg-card border border-border-custom rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-text">
                  {selectedCollectionIds.size} collection{selectedCollectionIds.size !== 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center space-x-2 flex-wrap gap-2">
                  <label className="text-sm text-secondary-text">Change type to:</label>
                  <select
                    value={bulkTypeChange}
                    onChange={(e) => setBulkTypeChange(e.target.value)}
                    className="px-3 py-2 border border-border-custom rounded-lg text-sm bg-bg-primary text-text focus:ring-2 focus:ring-brand focus:border-transparent"
                    disabled={isBulkUpdating}
                  >
                    <option value="">Select type...</option>
                    <option value="Collection">Collection</option>
                    <option value="Box">Box</option>
                  </select>
                  <button
                    onClick={handleBulkTypeChange}
                    disabled={!bulkTypeChange || isBulkUpdating}
                    className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {isBulkUpdating ? 'Updating...' : 'Update Type'}
                  </button>
                  <label className="text-sm text-secondary-text ml-2">Change game to:</label>
                  <select
                    value={bulkGameChange}
                    onChange={(e) => setBulkGameChange(e.target.value)}
                    className="px-3 py-2 border border-border-custom rounded-lg text-sm bg-bg-primary text-text focus:ring-2 focus:ring-brand focus:border-transparent"
                    disabled={isBulkUpdating}
                  >
                    <option value="">Select game...</option>
                    <option value="none">None</option>
                    {games.map((game) => (
                      <option key={game.id} value={game.id}>
                        {game.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleBulkGameChange}
                    disabled={!bulkGameChange || isBulkUpdating}
                    className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {isBulkUpdating ? 'Updating...' : 'Update Game'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCollectionIds(new Set())
                      setBulkTypeChange('')
                      setBulkGameChange('')
                    }}
                    disabled={isBulkUpdating}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors text-sm"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-bg-card rounded-lg border border-border-custom p-4">
              <div className="text-2xl font-bold text-title">
                {filteredCollections.length}
                {filteredCollections.length !== collections.length && (
                  <span className="text-sm text-secondary-text ml-1">
                    / {collections.length}
                  </span>
                )}
              </div>
              <div className="text-sm text-secondary-text">
                {hasActiveFilters ? 'Filtered Collections' : 'Total Collections'}
              </div>
            </div>
            <div className="bg-bg-card rounded-lg border border-border-custom p-4">
              <div className="text-2xl font-bold text-title">
                {filteredCollections.filter(c => c.public).length}
                {filteredCollections.length !== collections.length && (
                  <span className="text-sm text-secondary-text ml-1">
                    / {collections.filter(c => c.public).length}
                  </span>
                )}
              </div>
              <div className="text-sm text-secondary-text">Public Collections</div>
            </div>
            <div className="bg-bg-card rounded-lg border border-border-custom p-4">
              <div className="text-2xl font-bold text-title">
                {filteredCollections.reduce((sum, c) => sum + c.models_count, 0)}
                {filteredCollections.length !== collections.length && (
                  <span className="text-sm text-secondary-text ml-1">
                    / {collections.reduce((sum, c) => sum + c.models_count, 0)}
                  </span>
                )}
              </div>
              <div className="text-sm text-secondary-text">
                {hasActiveFilters ? 'Models in Filtered' : 'Total Models'}
              </div>
            </div>
            <div className="bg-bg-card rounded-lg border border-border-custom p-4">
              <div className="text-2xl font-bold text-title">
                {new Set(filteredCollections.map(c => c.user_id)).size}
                {filteredCollections.length !== collections.length && (
                  <span className="text-sm text-secondary-text ml-1">
                    / {new Set(collections.map(c => c.user_id)).size}
                  </span>
                )}
              </div>
              <div className="text-sm text-secondary-text">
                {hasActiveFilters ? 'Users in Filtered' : 'Unique Users'}
              </div>
            </div>
          </div>
        )}

        {/* Collections List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-bg-card rounded-lg border border-border-custom p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-secondary-text opacity-20 rounded w-48"></div>
                    <div className="h-3 bg-secondary-text opacity-20 rounded w-32"></div>
                  </div>
                  <div className="h-8 bg-secondary-text opacity-20 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Select All Checkbox */}
            {filteredCollections.length > 0 && (
              <div className="bg-bg-card rounded-lg border border-border-custom p-4">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center space-x-2 text-sm text-secondary-text hover:text-text transition-colors"
                >
                  {selectedCollectionIds.size === filteredCollections.length ? (
                    <CheckSquare className="w-5 h-5 text-brand" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                  <span>
                    {selectedCollectionIds.size === filteredCollections.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </span>
                </button>
              </div>
            )}

            {filteredCollections.map((collection) => (
              <div key={collection.id} className="bg-bg-card rounded-lg border border-border-custom p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleSelection(collection.id)}
                      className="flex-shrink-0 text-secondary-text hover:text-text transition-colors"
                    >
                      {selectedCollectionIds.has(collection.id) ? (
                        <CheckSquare className="w-5 h-5 text-brand" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <Package className="w-5 h-5 text-secondary-text flex-shrink-0" />
                        <h3 className="text-lg font-semibold text-title truncate">{collection.name}</h3>
                        {collection.public && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Public</span>
                        )}
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {collection.type || 'Collection'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm text-secondary-text">
                        <div>
                          <span className="font-medium">Type: </span>
                          <span className="text-text">{collection.type || 'Collection'}</span>
                        </div>
                        <div>
                          <span className="font-medium">Owner: </span>
                          <span className="text-text">{getUserDisplayName(collection.user)}</span>
                        </div>
                        <div>
                          <span className="font-medium">Email: </span>
                          <span className="text-text">{collection.user.email}</span>
                        </div>
                        <div>
                          <span className="font-medium">Game: </span>
                          <span className="text-text">{collection.game?.name || 'No Game'}</span>
                        </div>
                        <div>
                          <span className="font-medium">Models: </span>
                          <span className="text-text">{collection.models_count}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-secondary-text">
                        <span>Created: {new Date(collection.created_at).toLocaleDateString()}</span>
                        <span>ID: {collection.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {editingCollection === collection.id ? (
                      <div className="flex items-center space-x-2">
                        <select
                          value={newUserId}
                          onChange={(e) => setNewUserId(e.target.value)}
                          className="px-3 py-2 border border-border-custom rounded-lg text-sm bg-bg-primary text-text focus:ring-2 focus:ring-brand focus:border-transparent"
                          disabled={saving}
                        >
                          <option value="">Select new owner...</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {getUserDisplayName(user)}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleReassignCollection(collection.id, newUserId)}
                          disabled={!newUserId || saving}
                          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {saving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingCollection(null)
                            setNewUserId('')
                          }}
                          disabled={saving}
                          className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingCollection(collection.id)
                          setNewUserId(collection.user_id)
                        }}
                        className="flex items-center space-x-2 px-3 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
                      >
                        <Users className="w-4 h-4" />
                        <span>Reassign</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredCollections.length === 0 && !loading && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-secondary-text mx-auto mb-4" />
                <p className="text-secondary-text">
                  {searchQuery ? 'No collections found matching your search.' : 'No collections found.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}