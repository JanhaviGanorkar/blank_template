import { useState, useEffect, useCallback } from 'react';
import { friendService } from '../api/apiclient';

interface FriendRequest {
  id: string;
  sender: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  receiver: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  status: string;
  message: string;
  created_at: string;
}

interface Friend {
  id: string;
  friend: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  created_at: string;
}

interface SearchUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  is_friend: boolean;
  friend_request_status: 'sent' | 'received' | null;
}

export const useFriends = () => {
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requestCount, setRequestCount] = useState({ received_count: 0, sent_count: 0, total_count: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load friend requests count
  const loadRequestCount = useCallback(async () => {
    try {
      const count = await friendService.getFriendRequestCount();
      setRequestCount(count);
    } catch (error) {
      console.error('Failed to load request count:', error);
    }
  }, []);

  // Load received friend requests
  const loadReceivedRequests = useCallback(async () => {
    setLoading(true);
    try {
      const requests = await friendService.getFriendRequests('received');
      setReceivedRequests(requests);
    } catch (error) {
      console.error('Failed to load received requests:', error);
      setError('Failed to load received requests');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load sent friend requests
  const loadSentRequests = useCallback(async () => {
    setLoading(true);
    try {
      const requests = await friendService.getFriendRequests('sent');
      setSentRequests(requests);
    } catch (error) {
      console.error('Failed to load sent requests:', error);
      setError('Failed to load sent requests');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load friends list
  const loadFriends = useCallback(async () => {
    setLoading(true);
    try {
      const friendsList = await friendService.getFriends();
      setFriends(friendsList);
    } catch (error) {
      console.error('Failed to load friends:', error);
      setError('Failed to load friends');
    } finally {
      setLoading(false);
    }
  }, []);

  // Send friend request
  const sendFriendRequest = useCallback(async (receiverId: number, message?: string) => {
    try {
      await friendService.sendFriendRequest(receiverId, message);
      await loadRequestCount();
      await loadSentRequests();
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to send friend request';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [loadRequestCount, loadSentRequests]);

  // Accept friend request
  const acceptRequest = useCallback(async (requestId: string) => {
    try {
      await friendService.acceptFriendRequest(requestId);
      await loadReceivedRequests();
      await loadFriends();
      await loadRequestCount();
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to accept friend request';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [loadReceivedRequests, loadFriends, loadRequestCount]);

  // Reject friend request
  const rejectRequest = useCallback(async (requestId: string) => {
    try {
      await friendService.rejectFriendRequest(requestId);
      await loadReceivedRequests();
      await loadRequestCount();
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to reject friend request';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [loadReceivedRequests, loadRequestCount]);

  // Remove friend
  const removeFriend = useCallback(async (userId: number) => {
    try {
      await friendService.removeFriend(userId);
      await loadFriends();
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to remove friend';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [loadFriends]);

  // Search users
  const searchUsers = useCallback(async (query: string): Promise<SearchUser[]> => {
    if (query.length < 2) return [];
    
    try {
      const results = await friendService.searchUsers(query);
      return results;
    } catch (error) {
      console.error('Failed to search users:', error);
      setError('Failed to search users');
      return [];
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load initial data
  useEffect(() => {
    loadRequestCount();
  }, [loadRequestCount]);

  return {
    // State
    receivedRequests,
    sentRequests,
    friends,
    requestCount,
    loading,
    error,

    // Actions
    sendFriendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    searchUsers,
    
    // Data loading
    loadReceivedRequests,
    loadSentRequests,
    loadFriends,
    loadRequestCount,
    
    // Utility
    clearError
  };
};