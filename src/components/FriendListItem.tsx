import React, { useState } from 'react'
import { Friend } from '../hooks/useFriends'

interface FriendListItemProps {
  friend: Friend
  onRemoveFriend: (friendshipId: string) => void
  onViewCollection: (friendId: string, friendName: string) => void
}

export function FriendListItem({ friend, onRemoveFriend, onViewCollection }: FriendListItemProps) {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

  const handleRemove = () => {
    onRemoveFriend(friend.friendship_id)
    setShowRemoveConfirm(false)
  }

  const handleViewCollection = () => {
    onViewCollection(friend.friend_user_id, friend.friend_name || friend.friend_email)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">
              {(friend.friend_name || friend.friend_email).charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {friend.friend_name || 'Unknown User'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {friend.friend_email}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Friends since {new Date(friend.friendship_created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleViewCollection}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
          >
            View Collection
          </button>
          
          {showRemoveConfirm ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRemove}
                className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-md transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowRemoveConfirm(false)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowRemoveConfirm(true)}
              className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  )
}




