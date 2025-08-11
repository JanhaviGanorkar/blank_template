import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SecureTokenStorage } from '../components/auth/SecureTokenStorage';
import { chatService } from '../api/apiclient';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// Chat Types
export interface PersonalChat {
  id: string
  user1: User
  user2: User
  other_user: User
  participants: User[]
  created_at: string
  last_message_at: string
  last_message: {
    content: string
    timestamp: string
    sender_name: string
    message_type: string
    is_own_message: boolean
  } | null
  unread_count: number
  is_active: boolean
}

export interface ChatMessage {
  id: string
  sender_name: string
  sender_avatar: string | null
  content: string
  message_type: 'text' | 'image' | 'file' | 'audio'
  timestamp: string
  is_own_message: boolean
  delivered_at: string | null
  read_at: string | null
  delivery_status: {
    delivered: boolean
    read: boolean
    delivered_at: string | null
    read_at: string | null
  }
}

// Store interface
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  checkAuthStatus: () => void;
  updateUser: (userData: Partial<User>) => void;
}

// Chat Store interface
interface ChatState {
  chats: PersonalChat[]
  currentChat: PersonalChat | null
  messages: { [chatId: string]: ChatMessage[] }
  isLoading: boolean
  error: string | null
  connectionStatus: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING'
  
  // Actions
  loadUserChats: () => Promise<void>
  createChat: (receiverId: number) => Promise<PersonalChat | null>
  setCurrentChat: (chat: PersonalChat | null) => void
  loadChatMessages: (chatId: string) => Promise<void>
  sendMessage: (chatId: string, content: string, messageType?: string) => Promise<void>
  addMessage: (chatId: string, message: ChatMessage) => void
  markChatRead: (chatId: string) => Promise<void>
  clearError: () => void
  setConnectionStatus: (status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING') => void
}

// Create store
export const useAuthStore = create<AuthState & ChatState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      chats: [],
      currentChat: null,
      messages: {},
      isLoading: false,
      error: null,
      connectionStatus: 'DISCONNECTED',

      login: (user: User) => {
        set({ user, isAuthenticated: true });
        console.log('👤 User logged in:', user.name);
      },

      logout: () => {
        // Clear encrypted tokens and user data
        SecureTokenStorage.clearAll();
        set({ user: null, isAuthenticated: false });
        console.log('👋 User logged out - all encrypted data cleared');
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          set({ user: updatedUser });
          
          // Update stored user data
          const storedData = SecureTokenStorage.getUserData();
          if (storedData) {
            SecureTokenStorage.setUserData({ ...storedData, ...userData });
          }
          
          console.log('👤 User updated:', updatedUser);
        }
      },

      checkAuthStatus: () => {
        // Check if we have valid encrypted tokens
        const hasValidToken = SecureTokenStorage.hasValidToken();
        const currentState = get();
        
        if (!hasValidToken && currentState.isAuthenticated) {
          // Token missing/expired but store says authenticated - clear state
          set({ user: null, isAuthenticated: false });
          console.log('🔍 Auth check: Token invalid/expired, clearing auth state');
        } else if (hasValidToken && !currentState.isAuthenticated) {
          // Token exists but not authenticated - restore from token
          const userData = SecureTokenStorage.getUserData();
          if (userData) {
            set({ 
              user: {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                avatar: userData.avatar
              }, 
              isAuthenticated: true 
            });
            console.log('🔍 Auth check: Restored user from valid token');
          }
        }
        
        // Debug auth status
        console.log('🔍 Auth Status:', {
          hasValidToken,
          isAuthenticated: get().isAuthenticated,
          user: get().user?.name || 'none'
        });
      },

      loadUserChats: async () => {
        try {
          set({ isLoading: true, error: null })
          const response = await chatService.getUserChats()
          set({ chats: response.chats, isLoading: false })
        } catch (error) {
          console.error('❌ Error loading chats:', error)
          set({ error: 'Failed to load chats', isLoading: false })
        }
      },

      createChat: async (receiverId: number) => {
        try {
          set({ isLoading: true, error: null })
          const response = await chatService.createPersonalChat(receiverId)
          
          const currentChats = get().chats
          const existingIndex = currentChats.findIndex(chat => chat.id === response.chat.id)
          
          if (existingIndex > -1) {
            const updatedChats = [...currentChats]
            updatedChats[existingIndex] = response.chat
            set({ chats: updatedChats, isLoading: false })
          } else {
            set({ chats: [response.chat, ...currentChats], isLoading: false })
          }
          
          return response.chat
        } catch (error) {
          console.error('❌ Error creating chat:', error)
          set({ error: 'Failed to create chat', isLoading: false })
          return null
        }
      },

      setCurrentChat: (chat: PersonalChat | null) => {
        set({ currentChat: chat })
        if (chat) {
          get().loadChatMessages(chat.id)
        }
      },

      loadChatMessages: async (chatId: string) => {
        try {
          const response = await chatService.getPersonalChatMessages(chatId)
          set({ 
            messages: { 
              ...get().messages, 
              [chatId]: response.messages 
            } 
          })
        } catch (error) {
          console.error('❌ Error loading messages:', error)
          set({ error: 'Failed to load messages' })
        }
      },

      sendMessage: async (chatId: string, content: string, messageType: string = 'text') => {
        try {
          await chatService.sendPersonalMessage(chatId, content, messageType)
          // Message will be added via WebSocket or manual refresh
        } catch (error) {
          console.error('❌ Error sending message:', error)
          set({ error: 'Failed to send message' })
        }
      },

      addMessage: (chatId: string, message: ChatMessage) => {
        const currentMessages = get().messages[chatId] || []
        const messageExists = currentMessages.some(msg => msg.id === message.id)
        
        if (!messageExists) {
          set({
            messages: {
              ...get().messages,
              [chatId]: [...currentMessages, message]
            }
          })
        }
      },

      markChatRead: async (chatId: string) => {
        try {
          await chatService.markChatRead(chatId)
          // Update local state
          const currentMessages = get().messages[chatId] || []
          const updatedMessages = currentMessages.map(msg => ({
            ...msg,
            delivery_status: {
              ...msg.delivery_status,
              read: true,
              read_at: new Date().toISOString()
            }
          }))
          
          set({
            messages: {
              ...get().messages,
              [chatId]: updatedMessages
            }
          })
        } catch (error) {
          console.error('❌ Error marking messages as read:', error)
        }
      },

      clearError: () => set({ error: null }),

      setConnectionStatus: (status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING') => {
        set({ connectionStatus: status })
      }
    }),
    {
      name: 'chatapp-auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Convenience hooks
export const useAuth = () => {
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const login = useAuthStore(state => state.login);
  const logout = useAuthStore(state => state.logout);
  const checkAuthStatus = useAuthStore(state => state.checkAuthStatus);
  const updateUser = useAuthStore(state => state.updateUser);
  
  return {
    user,
    isAuthenticated,
    login,
    logout,
    checkAuthStatus,
    updateUser,
  };
};

// Chat convenience hooks
export const useChat = () => {
  const chats = useAuthStore(state => state.chats)
  const currentChat = useAuthStore(state => state.currentChat)
  const messages = useAuthStore(state => state.messages)
  const isLoading = useAuthStore(state => state.isLoading)
  const error = useAuthStore(state => state.error)
  const connectionStatus = useAuthStore(state => state.connectionStatus)
  
  const loadUserChats = useAuthStore(state => state.loadUserChats)
  const createChat = useAuthStore(state => state.createChat)
  const setCurrentChat = useAuthStore(state => state.setCurrentChat)
  const loadChatMessages = useAuthStore(state => state.loadChatMessages)
  const sendMessage = useAuthStore(state => state.sendMessage)
  const addMessage = useAuthStore(state => state.addMessage)
  const markChatRead = useAuthStore(state => state.markChatRead)
  const clearError = useAuthStore(state => state.clearError)
  const setConnectionStatus = useAuthStore(state => state.setConnectionStatus)
  
  return {
    chats,
    currentChat,
    messages,
    isLoading,
    error,
    connectionStatus,
    loadUserChats,
    createChat,
    setCurrentChat,
    loadChatMessages,
    sendMessage,
    addMessage,
    markChatRead,
    clearError,
    setConnectionStatus,
    getChatMessages: (chatId: string) => messages[chatId] || []
  }
}