import React, { useState } from 'react'
import { ArrowLeft, BarChart3, Activity, Package, FolderOpen, Gamepad2, Sword, List, Trophy, Crown, TrendingUp, Clock, User } from 'lucide-react'
import { useUserLeaderboards, useRecentActivity } from '../hooks/useAdminActivity'
import { formatLocalDate } from '../utils/timezone'

interface AdminActivityPageProps {
  onBack: () => void
}

export function AdminActivityPage({ onBack }: AdminActivityPageProps) {
  const { leaderboards, loading: leaderboardsLoading, error: leaderboardsError } = useUserLeaderboards()
  const { activities, loading: activitiesLoading, error: activitiesError } = useRecentActivity()
  const [selectedMetric, setSelectedMetric] = useState<'total' | 'models' | 'collections' | 'battles' | 'games' | 'lists'>('total')
  const [activityFilter, setActivityFilter] = useState<'all' | 'model' | 'collection' | 'battle' | 'game' | 'list'>('all')

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'models':
        return Package
      case 'collections':
        return FolderOpen
      case 'battles':
        return Sword
      case 'games':
        return Gamepad2
      case 'lists':
        return List
      default:
        return Trophy
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'model':
        return Package
      case 'collection':
        return FolderOpen
      case 'battle':
        return Sword
      case 'game':
        return Gamepad2
      case 'list':
        return List
      default:
        return Activity
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'model':
        return 'text-blue-600 bg-blue-100'
      case 'collection':
        return 'text-purple-600 bg-purple-100'
      case 'battle':
        return 'text-red-600 bg-red-100'
      case 'game':
        return 'text-green-600 bg-green-100'
      case 'list':
        return 'text-orange-600 bg-orange-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getSortedLeaderboards = () => {
    if (!leaderboards.length) return []
    
    return [...leaderboards].sort((a, b) => {
      switch (selectedMetric) {
        case 'models':
          return b.models_count - a.models_count
        case 'collections':
          return b.collections_count - a.collections_count
        case 'battles':
          return b.battles_count - a.battles_count
        case 'games':
          return b.games_count - a.games_count
        case 'lists':
          return b.lists_count - a.lists_count
        default:
          return b.total_count - a.total_count
      }
    }).slice(0, 10)
  }

  const getFilteredActivities = () => {
    if (activityFilter === 'all') {
      return activities
    }
    return activities.filter(activity => activity.type === activityFilter)
  }

  const formatActivityDate = (dateString: string) => {
    return formatLocalDate(dateString, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMetricValue = (user: typeof leaderboards[0]) => {
    switch (selectedMetric) {
      case 'models':
        return user.models_count
      case 'collections':
        return user.collections_count
      case 'battles':
        return user.battles_count
      case 'games':
        return user.games_count
      case 'lists':
        return user.lists_count
      default:
        return user.total_count
    }
  }

  const getMetricLabel = () => {
    switch (selectedMetric) {
      case 'models':
        return 'Models'
      case 'collections':
        return 'Collections'
      case 'battles':
        return 'Battles'
      case 'games':
        return 'Games'
      case 'lists':
        return 'Lists'
      default:
        return 'Total Objects'
    }
  }

  if (leaderboardsLoading || activitiesLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-base text-secondary-text">Loading activity data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-secondary-text hover:text-text transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Admin</span>
        </button>
        <h1 className="text-4xl font-bold text-title">APP ACTIVITY</h1>
        <p className="text-secondary-text mt-2">View user leaderboards and recent activity across the app</p>
      </div>

      {(leaderboardsError || activitiesError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">
            {leaderboardsError || activitiesError || 'Failed to load activity data'}
          </p>
        </div>
      )}

      {/* Leaderboards Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Trophy className="w-6 h-6 text-icon" />
            <h2 className="text-2xl font-semibold text-text font-overpass">User Leaderboards</h2>
          </div>
        </div>

        {/* Metric Selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['total', 'models', 'collections', 'battles', 'games', 'lists'] as const).map((metric) => {
            const Icon = metric === 'total' ? Trophy : getMetricIcon(metric)
            return (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  selectedMetric === metric
                    ? 'bg-brand/10 text-brand border-brand/20'
                    : 'bg-bg-card border-border-custom text-secondary-text hover:text-text hover:bg-bg-secondary'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="capitalize">{metric === 'total' ? 'Total' : metric}</span>
              </button>
            )
          })}
        </div>

        {/* Leaderboard Table */}
        <div className="bg-bg-card border border-border-custom rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-secondary border-b border-border-custom">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">{getMetricLabel()}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Models</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Collections</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Battles</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Games</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Lists</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom">
                {getSortedLeaderboards().map((user, index) => {
                  const MetricIcon = getMetricIcon(selectedMetric)
                  return (
                    <tr key={user.user_id} className="hover:bg-bg-secondary transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {index === 0 ? (
                            <Crown className="w-5 h-5 text-yellow-500" />
                          ) : (
                            <span className="text-sm font-medium text-secondary-text">#{index + 1}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-icon" />
                          <div>
                            <div className="text-sm font-medium text-text">
                              {user.user_name_public || user.email}
                            </div>
                            {user.user_name_public && (
                              <div className="text-xs text-secondary-text">{user.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <MetricIcon className="w-4 h-4 text-brand" />
                          <span className="text-sm font-semibold text-text">{getMetricValue(user)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-text">{user.models_count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-text">{user.collections_count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-text">{user.battles_count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-text">{user.games_count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-text">{user.lists_count}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-text">{user.total_count}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {getSortedLeaderboards().length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-secondary-text mx-auto mb-4 opacity-50" />
              <p className="text-base text-secondary-text">No user data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Log Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-icon" />
            <h2 className="text-2xl font-semibold text-text font-overpass">Recent Activity (Last 30 Days)</h2>
          </div>
        </div>

        {/* Activity Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', 'model', 'collection', 'battle', 'game', 'list'] as const).map((filter) => {
            const Icon = filter === 'all' ? Activity : getActivityIcon(filter)
            return (
              <button
                key={filter}
                onClick={() => setActivityFilter(filter)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  activityFilter === filter
                    ? 'bg-brand/10 text-brand border-brand/20'
                    : 'bg-bg-card border-border-custom text-secondary-text hover:text-text hover:bg-bg-secondary'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="capitalize">{filter}</span>
              </button>
            )
          })}
        </div>

        {/* Activity List */}
        <div className="bg-bg-card border border-border-custom rounded-lg overflow-hidden">
          <div className="divide-y divide-border-custom">
            {getFilteredActivities().map((activity) => {
              const ActivityIcon = getActivityIcon(activity.type)
              return (
                <div key={`${activity.type}-${activity.id}`} className="p-4 hover:bg-bg-secondary transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                      <ActivityIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-text capitalize">{activity.type}</span>
                        <span className="text-sm font-semibold text-text">{activity.object_name}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-secondary-text">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{activity.user_name || activity.user_email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatActivityDate(activity.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {getFilteredActivities().length === 0 && (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-secondary-text mx-auto mb-4 opacity-50" />
              <p className="text-base text-secondary-text">No recent activity found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

