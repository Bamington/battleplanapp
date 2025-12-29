import React, { useState } from 'react'
import { useFriends, Friend, FriendRequest } from '../hooks/useFriends'
import { AddFriendModal } from './AddFriendModal'
import { FriendListItem } from './FriendListItem'
import { FriendPublicCollection } from './FriendPublicCollection'

export function FriendsPage() {
  const {
    friends,
    pendingRequests,
    loading,
    error,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend
  } = useFriends()

  const [showAddFriendModal, setShowAddFriendModal] = useState(false)
  const [viewingFriendCollection, setViewingFriendCollection] = useState<{
    friendId: string
    friendName: string
  } | null>(null)

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId)
    } catch (error) {
      console.error('Error accepting friend request:', error)
    }
  }

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await declineFriendRequest(requestId)
    } catch (error) {
      console.error('Error declining friend request:', error)
    }
  }

  const handleCancelRequest = async (requestId: string) => {
    try {
      await cancelFriendRequest(requestId)
    } catch (error) {
      console.error('Error canceling friend request:', error)
    }
  }

  const handleRemoveFriend = async (friendshipId: string) => {
    try {
      await removeFriend(friendshipId)
    } catch (error) {
      console.error('Error removing friend:', error)
    }
  }

  const handleViewCollection = (friendId: string, friendName: string) => {
    setViewingFriendCollection({ friendId, friendName })
  }

  const incomingRequests = pendingRequests.filter(req => req.direction === 'incoming')
  const outgoingRequests = pendingRequests.filter(req => req.direction === 'outgoing')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading friends...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-red-500">Error loading friends: {error}</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Friends</h1>
        <button
          onClick={() => setShowAddFriendModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Friend
        </button>
      </div>

      {/* Incoming Friend Requests */}
      {incomingRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Friend Requests ({incomingRequests.length})
          </h2>
          <div className="space-y-3">
            {incomingRequests.map((request) => (
              <div key={request.request_id} className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 dark:text-yellow-400 font-medium text-sm">
                        {(request.requester_name || request.requester_email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {request.requester_name || 'Unknown User'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {request.requester_email}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAcceptRequest(request.request_id)}
                      className="px-3 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/20 rounded-md transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(request.request_id)}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-md transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outgoing Friend Requests */}
      {outgoingRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Pending Requests ({outgoingRequests.length})
          </h2>
          <div className="space-y-3">
            {outgoingRequests.map((request) => (
              <div key={request.request_id} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                        {(request.requester_name || request.requester_email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {request.requester_name || 'Unknown User'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {request.requester_email}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Sent {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancelRequest(request.request_id)}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Friends ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No friends yet. Send some friend requests to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {friends.map((friend) => (
              <FriendListItem
                key={friend.friendship_id}
                friend={friend}
                onRemoveFriend={handleRemoveFriend}
                onViewCollection={handleViewCollection}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Friend Modal */}
      <AddFriendModal
        isOpen={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
      />

      {/* TODO: Add FriendPublicCollection modal/page when viewingFriendCollection is set */}
      {viewingFriendCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {viewingFriendCollection.friendName}'s Public Collection
                </h2>
                <button
                  onClick={() => setViewingFriendCollection(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>Friend's public collection view will be implemented in the next step.</p>
                <p className="text-sm mt-2">Friend ID: {viewingFriendCollection.friendId}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
