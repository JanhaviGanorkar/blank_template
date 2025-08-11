import { create } from 'zustand';
import { friendService } from '../api/apiclient';

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  avatar_url?: string;
}

interface FriendRequest {
  id: string;
  sender: User;
  receiver: User;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  message: string;
  created_at: string;
  updated_at: string;
}

interface Friend {
  id: string;
  friend: User;
  created_at: string;
}

interface FriendshipStatus {
  is_friend: boolean;
  friend_request_sent: boolean;
  friend_request_received: boolean;
  can_send_request: boolean;
  sent_request_id?: string;
  received_request_id?: string;
}

interface FriendStore {
  // State
  receivedRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  friends: Friend[];
  searchResults: User[];
  requestCounts: {
    received_count: number;
    sent_count: number;
    total_count: number;
  };
  loading: boolean;
  error: string | null;

  // Actions
  fetchReceivedRequests: () => Promise<void>;
  fetchSentRequests: () => Promise<void>;
  fetchFriends: () => Promise<void>;
  fetchRequestCounts: () => Promise<void>;
  searchUsers: (query: string) => Promise<void>;
  sendFriendRequest: (receiverId: number, message?: string) => Promise<boolean>;
  acceptFriendRequest: (requestId: string) => Promise<boolean>;
  rejectFriendRequest: (requestId: string) => Promise<boolean>;
  cancelFriendRequest: (requestId: string) => Promise<boolean>;
  removeFriend: (userId: number) => Promise<boolean>;
  getFriendshipStatus: (userId: number) => Promise<FriendshipStatus | null>;
  clearError: () => void;
  reset: () => void;
}

export const useFriendStore = create<FriendStore>((set, get) => ({
  // Initial state
  receivedRequests: [],
  sentRequests: [],
  friends: [],
  searchResults: [],
  requestCounts: {
    received_count: 0,
    sent_count: 0,
    total_count: 0,
  },
  loading: false,
  error: null,

  // Fetch received friend requests
  fetchReceivedRequests: async () => {
    try {
      set({ loading: true, error: null });
      const response = await friendService.getFriendRequests('received');
      console.log('Received requests response:', response); // Debug log
      
      // Handle paginated response format: {count, next, previous, results}
      let requests = [];
      if (response?.results && Array.isArray(response.results)) {
        requests = response.results;
      } else if (response?.data?.results && Array.isArray(response.data.results)) {
        requests = response.data.results;
      } else if (Array.isArray(response)) {
        requests = response;
      } else if (Array.isArray(response?.data)) {
        requests = response.data;
      }
      
      set({ receivedRequests: requests, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch received requests',
        loading: false,
        receivedRequests: [] 
      });
    }
  },

  // Fetch sent friend requests
  fetchSentRequests: async () => {
    try {
      set({ loading: true, error: null });
      const response = await friendService.getFriendRequests('sent');
      console.log('Sent requests response:', response); // Debug log
      
      // Handle paginated response format: {count, next, previous, results}
      let requests = [];
      if (response?.results && Array.isArray(response.results)) {
        requests = response.results;
      } else if (response?.data?.results && Array.isArray(response.data.results)) {
        requests = response.data.results;
      } else if (Array.isArray(response)) {
        requests = response;
      } else if (Array.isArray(response?.data)) {
        requests = response.data;
      }
      
      set({ sentRequests: requests, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch sent requests',
        loading: false,
        sentRequests: [] 
      });
    }
  },

  // Fetch friends list
  fetchFriends: async () => {
    try {
      set({ loading: true, error: null });
      const response = await friendService.getFriends();
      console.log('Friends response:', response); // Debug log
      
      // Handle paginated response format: {count, next, previous, results}
      let friendsList = [];
      if (response?.results && Array.isArray(response.results)) {
        friendsList = response.results;
      } else if (response?.data?.results && Array.isArray(response.data.results)) {
        friendsList = response.data.results;
      } else if (Array.isArray(response)) {
        friendsList = response;
      } else if (Array.isArray(response?.data)) {
        friendsList = response.data;
      }
      
      set({ friends: friendsList, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch friends',
        loading: false,
        friends: [] 
      });
    }
  },

  // Fetch request counts
  fetchRequestCounts: async () => {
    try {
      const response = await friendService.getFriendRequestCount();
      const counts = response?.data || response || { received_count: 0, sent_count: 0, total_count: 0 };
      set({ requestCounts: counts });
    } catch (error: any) {
      console.error('Failed to fetch request counts:', error);
    }
  },

  // Search users
  searchUsers: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }

    try {
      set({ loading: true, error: null });
      const response = await friendService.searchUsers(query);
      console.log('Search response:', response); // Debug log
      
      // Handle paginated response format: {count, next, previous, results}
      let users = [];
      if (response?.results && Array.isArray(response.results)) {
        users = response.results;
      } else if (response?.data?.results && Array.isArray(response.data.results)) {
        users = response.data.results;
      } else if (Array.isArray(response)) {
        users = response;
      } else if (Array.isArray(response?.data)) {
        users = response.data;
      }
      
      set({ searchResults: users, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to search users',
        loading: false,
        searchResults: []
      });
    }
  },

  // Send friend request
  sendFriendRequest: async (receiverId: number, message?: string) => {
    try {
      set({ loading: true, error: null });
      const response = await friendService.sendFriendRequest(receiverId, message);
      
      // Add to sent requests
      const state = get();
      const newRequest = response?.friend_request || response;
      if (newRequest) {
        set({ 
          sentRequests: [newRequest, ...state.sentRequests],
          loading: false 
        });
      }

      // Update request counts
      get().fetchRequestCounts();
      
      return true;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to send friend request',
        loading: false 
      });
      return false;
    }
  },

  // Accept friend request
  acceptFriendRequest: async (requestId: string) => {
    try {
      set({ loading: true, error: null });
      await friendService.acceptFriendRequest(requestId);
      
      // Remove from received requests
      const state = get();
      set({ 
        receivedRequests: state.receivedRequests.filter(req => req.id !== requestId),
        loading: false 
      });

      // Refresh friends list and counts
      await Promise.all([
        get().fetchFriends(),
        get().fetchRequestCounts()
      ]);
      
      return true;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to accept friend request',
        loading: false 
      });
      return false;
    }
  },

  // Reject friend request
  rejectFriendRequest: async (requestId: string) => {
    try {
      set({ loading: true, error: null });
      await friendService.rejectFriendRequest(requestId);
      
      // Remove from received requests
      const state = get();
      set({ 
        receivedRequests: state.receivedRequests.filter(req => req.id !== requestId),
        loading: false 
      });

      // Update request counts
      get().fetchRequestCounts();
      
      return true;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to reject friend request',
        loading: false 
      });
      return false;
    }
  },

  // Cancel sent friend request
  cancelFriendRequest: async (requestId: string) => {
    try {
      set({ loading: true, error: null });
      await friendService.cancelFriendRequest(requestId);
      
      // Remove from sent requests
      const state = get();
      set({ 
        sentRequests: state.sentRequests.filter(req => req.id !== requestId),
        loading: false 
      });

      // Update request counts
      get().fetchRequestCounts();
      
      return true;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to cancel friend request',
        loading: false 
      });
      return false;
    }
  },

  // Remove friend
  removeFriend: async (userId: number) => {
    try {
      set({ loading: true, error: null });
      await friendService.removeFriend(userId);
      
      // Remove from friends list
      const state = get();
      set({ 
        friends: state.friends.filter(friend => friend.friend.id !== userId),
        loading: false 
      });
      
      return true;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to remove friend',
        loading: false 
      });
      return false;
    }
  },

  // Get friendship status
  getFriendshipStatus: async (userId: number) => {
    try {
      const response = await friendService.getFriendshipStatus(userId);
      return response?.data || response;
    } catch (error: any) {
      console.error('Failed to get friendship status:', error);
      return null;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () => set({
    receivedRequests: [],
    sentRequests: [],
    friends: [],
    searchResults: [],
    requestCounts: {
      received_count: 0,
      sent_count: 0,
      total_count: 0,
    },
    loading: false,
    error: null,
  }),
}));