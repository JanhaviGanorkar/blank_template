import { useEffect } from 'react';
import { useFriendStore } from '../store/friendStore';

/**
 * Hook to manage friend requests with automatic data fetching
 */
export const useFriendRequests = () => {
  const store = useFriendStore();

  // Automatically fetch counts on mount
  useEffect(() => {
    store.fetchRequestCounts();
  }, []);

  return {
    // Data
    receivedRequests: store.receivedRequests,
    sentRequests: store.sentRequests,
    friends: store.friends,
    searchResults: store.searchResults,
    requestCounts: store.requestCounts,
    loading: store.loading,
    error: store.error,

    // Actions
    sendFriendRequest: store.sendFriendRequest,
    acceptFriendRequest: store.acceptFriendRequest,
    rejectFriendRequest: store.rejectFriendRequest,
    cancelFriendRequest: store.cancelFriendRequest,
    removeFriend: store.removeFriend,
    searchUsers: store.searchUsers,
    
    // Data fetching
    fetchReceivedRequests: store.fetchReceivedRequests,
    fetchSentRequests: store.fetchSentRequests,
    fetchFriends: store.fetchFriends,
    fetchRequestCounts: store.fetchRequestCounts,
    
    // Utility
    clearError: store.clearError,
    reset: store.reset,

    // Helper methods
    hasUnreadRequests: () => store.requestCounts.received_count > 0,
    getTotalRequestCount: () => store.requestCounts.total_count,
    
    // Check if user is already a friend or has pending request
    getUserStatus: async (userId: number) => {
      return await store.getFriendshipStatus(userId);
    }
  };
};