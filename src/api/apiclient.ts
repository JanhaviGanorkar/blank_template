import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { SecureTokenStorage } from '../components/auth/SecureTokenStorage';
import { TokenEncryption } from '../components/auth/TokenEncryption';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add decrypted JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get decrypted JWT access token for API calls
    const token = SecureTokenStorage.getAccessToken();
    
    if (token) {
      // Validate JWT before using
      if (TokenEncryption.isValidJWT(token) && !TokenEncryption.isTokenExpired(token)) {
        config.headers.Authorization = `Bearer ${token}`;
        // console.log('🔑 Valid JWT access token added to request');
      } else {
        console.warn('⚠️ Invalid or expired JWT access token, clearing storage');
        SecureTokenStorage.clearAll();
      }
    }

    // Check if token should be refreshed
    if (SecureTokenStorage.shouldRefreshAccessToken()) {
      console.log('🔄 JWT access token should be refreshed soon');
    }

    // console.log('📤 API Request:', {
    //   method: config.method?.toUpperCase(),
    //   url: config.url,
    //   hasAuth: !!token
    // });

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling JWT token refresh (matching your Django backend)
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // console.log('📥 API Response:', {
    //   status: response.status,
    //   url: response.config.url,
    // });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - JWT token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = SecureTokenStorage.getRefreshToken();
        
        if (refreshToken && TokenEncryption.isValidJWT(refreshToken) && !TokenEncryption.isTokenExpired(refreshToken)) {
          // console.log('🔄 Refreshing JWT tokens...');
          
          // Call refresh endpoint (matching your Django backend)
          const response = await axios.post('http://localhost:8000/api/auth/refresh/', {
            refresh: refreshToken
          });

          const newAccessToken = response.data.access;
          
          // Validate new access token
          if (TokenEncryption.isValidJWT(newAccessToken)) {
            // Store new encrypted access token
            SecureTokenStorage.setAccessToken(newAccessToken);
            
            // console.log('✅ JWT access token refreshed successfully');
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          } else {
            throw new Error('Invalid JWT token received from refresh');
          }
        } else {
          throw new Error('No valid refresh token available');
        }
      } catch (refreshError) {
        console.error('❌ JWT token refresh failed:', refreshError);
        
        // Clear all tokens and redirect to login
        SecureTokenStorage.clearAll();
        
        // Only redirect if we're not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?message=Session expired. Please log in again.';
        }
        
        return Promise.reject(refreshError);
      }
    }

    console.error('❌ API Response Error:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
      url: error.config?.url,
    });

    return Promise.reject(error);
  }
);

// Auth service matching your Django backend structure
export const authService = {
  async login(credentials: { email: string; password: string }) {
    const response = await api.post('/auth/login/', credentials);
    
    // Store encrypted JWT tokens (matching your Django response structure)
    if (response.data.access && TokenEncryption.isValidJWT(response.data.access)) {
      SecureTokenStorage.setAccessToken(response.data.access);
      // console.log('🔒 JWT access token encrypted and stored');
    }
    
    if (response.data.refresh && TokenEncryption.isValidJWT(response.data.refresh)) {
      SecureTokenStorage.setRefreshToken(response.data.refresh);
      // console.log('🔒 JWT refresh token encrypted and stored');
    }

    // Store user data (matching your Django user structure)
    if (response.data.user) {
      SecureTokenStorage.setUserData(response.data.user);
      // console.log('🔒 User data encrypted and stored');
    }
    
    return response.data;
  },

  async register(userData: {
    name: string;
    email: string;
    password: string;
    password_confirm: string;
  }) {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },

  async logout() {
    try {
      const refreshToken = SecureTokenStorage.getRefreshToken();
      if (refreshToken) {
        // Call Django logout endpoint to blacklist the token
        await api.post('/auth/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear local JWT tokens and user data
      SecureTokenStorage.clearAll();
      console.log('🗑️ All JWT tokens and user data cleared from storage');
    }
  },

  async verifyEmail(token: string) {
    const response = await api.post('/auth/verify-email/', { token });
    return response.data;
  },

  async resendVerification(email: string) {
    const response = await api.post('/auth/resend-verification/', { email });
    return response.data;
  },

  async requestPasswordReset(email: string) {
    const response = await api.post('/auth/password-reset-request/', { email });
    return response.data;
  },

  async confirmPasswordReset(token: string, password: string, password_confirm: string) {
    const response = await api.post('/auth/password-reset-confirm/', {
      token,
      password,
      password_confirm
    });
    return response.data;
  },

  async changePassword(oldPassword: string, newPassword: string, newPasswordConfirm: string) {
    const response = await api.post('/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm
    });
    return response.data;
  },

  async getUserProfile() {
    const response = await api.get('/auth/profile/');
    // console.log(response.data)
    return response.data;
  },


  // Get current user info from stored token
  getCurrentUser() {
    return SecureTokenStorage.getUserFromStoredToken();
  },

  // Get user data from storage (from Django response)
  getStoredUserData() {
    return SecureTokenStorage.getUserData();
  },

  // Check comprehensive token status
  getTokenInfo() {
    return SecureTokenStorage.getAuthInfo();
  },

  // Check if user is authenticated with valid JWT
  isAuthenticated(): boolean {
    return SecureTokenStorage.hasValidToken();
  },

  // Debug method to check auth state
  debugAuth() {
    SecureTokenStorage.debugAuthStorage();
    return this.getTokenInfo();
  },

  // Refresh access token manually
  async refreshToken() {
    const refreshToken = SecureTokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post('/auth/refresh/', {
      refresh: refreshToken
    });

    if (response.data.access) {
      SecureTokenStorage.setAccessToken(response.data.access);
      // console.log('🔄 Access token refreshed manually');
    }

    return response.data;
  }
};

// 💬 Chat service for encrypted personal messaging (matching Django backend URLs)
export const chatService = {
  // Create or get personal chat between two users
  async createPersonalChat(receiverId: number) {
    const response = await api.post('/Newchat/chats/create/', {
      receiver_id: receiverId
    });
    return response.data;
  },

  // Send encrypted message to personal chat
  async sendPersonalMessage(chatId: string, content: string, messageType: string = 'text') {
    const response = await api.post(`/Newchat/chats/${chatId}/send/`, {
      content,
      message_type: messageType
    });
    return response.data;
  },

  // Get messages from personal chat (decrypted automatically)
  async getPersonalChatMessages(chatId: string, limit: number = 50) {
    const response = await api.get(`/Newchat/chats/${chatId}/messages/?limit=${limit}`);
    return response.data;
  },

  // Get all user's personal chats
  async getUserChats() {
    const response = await api.get('/Newchat/chats/');
    console.log("NEw Chat api",response)
    return response.data;
  },

  // Mark messages in chat as read
  async markChatRead(chatId: string, messageIds?: number[]) {
    const response = await api.patch(`/Newchat/chats/${chatId}/read/`, {
      message_ids: messageIds || []
    });
    return response.data;
  },

  // Get chat info
  async getChatInfo(chatId: string) {
    const response = await api.get(`/Newchat/chats/${chatId}/info/`);
    return response.data;
  },

  // Get unread message count
  async getUnreadCount() {
    const response = await api.get('/Newchat/unread-count/');
    return response.data;
  }
};

// 🔔 Notification service (integrates with your existing notification system)
export const notificationService = {
  // Get user notifications
  async getNotifications(page: number = 1, pageSize: number = 20) {
    const response = await api.get(`/notifications/?page=${page}&page_size=${pageSize}`);
    return response.data;
  },

  // Save push subscription for browser notifications
  async savePushSubscription(subscription: any) {
    const response = await api.post('/notifications/push-subscription/', {
      endpoint: subscription.endpoint,
      p256dh_key: subscription.keys?.p256dh,
      auth_key: subscription.keys?.auth
    });
    return response.data;
  },

  // Mark notification as read
  async markNotificationRead(notificationId: number) {
    const response = await api.patch(`/notifications/${notificationId}/read/`);
    return response.data;
  },

  // Mark all notifications as read
  async markAllNotificationsRead() {
    const response = await api.post('/notifications/mark-all-read/');
    return response.data;
  },

  // Get notification statistics
  async getNotificationStats() {
    const response = await api.get('/notifications/stats/');
    return response.data;
  }
};

// 🤝 Friend service for managing friendships and friend requests
export const friendService = {
  // Send a friend request
  sendFriendRequest: async (receiverId: number, message?: string) => {
    const response = await api.post('/friends/friend-requests/send/', {
      receiver_id: receiverId,
      message: message || ''
    });
    return response.data;
  },

  // Get friend requests (received or sent)
  getFriendRequests: async (type: 'received' | 'sent' = 'received') => {
    const response = await api.get(`/friends/friend-requests/?type=${type}`);
    return response.data;
  },

  // Accept a friend requests
  acceptFriendRequest: async (requestId: string) => {
    const response = await api.patch(`/friends/friend-requests/${requestId}/action/`, {
      action: 'accept'
    });
    return response.data;
  },

  // Reject a friend request
  rejectFriendRequest: async (requestId: string) => {
    const response = await api.patch(`/friends/friend-requests/${requestId}/action/`, {
      action: 'reject'
    });
    return response.data;
  },

  // Cancel a sent friend request
  cancelFriendRequest: async (requestId: string) => {
    const response = await api.delete(`/friends/friend-requests/${requestId}/cancel/`);
    return response.data;
  },

  // Get all friends
  getFriends: async () => {
    const response = await api.get('/friends/friends/');
    return response.data;
  },

  // Search users
  searchUsers: async (query: string) => {
    const response = await api.get(`/friends/users/search/?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Remove a friend
  removeFriend: async (userId: number) => {
    const response = await api.delete(`/friends/friends/remove/${userId}/`);
    return response.data;
  },

  // Get friend request count
  getFriendRequestCount: async () => {
    const response = await api.get('/friends/friend-requests/count/');
    return response.data;
  },

  // Get friendship status with a specific user
  getFriendshipStatus: async (userId: number) => {
    const response = await api.get(`/friends/friendship-status/${userId}/`);
    return response.data;
  },

  // Get friend request counts
  getRequestCounts: () => 
    api.get('/friends/requests/counts/')
};

export default api;