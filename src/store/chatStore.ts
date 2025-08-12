import { create } from 'zustand'
import { chatService } from '../api/apiclient'
// import { toast } from "sonner" // Assuming you have sonner installed and imported correctly

export interface PersonalChat {
  id: string
  user1: { id: number; name: string; email: string; avatar: string | null }
  user2: { id: number; name: string; email: string; avatar: string | null }
  other_user: { id: number; name: string; email: string; avatar: string | null }
  participants: Array<{ id: number; name: string; email: string; avatar: string | null; is_self?: boolean }>
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

interface ChatState {
  chats: PersonalChat[]
  currentChat: PersonalChat | null
  messages: { [chatId: string]: ChatMessage[] }
  typingUsers: { [chatId: string]: string[] }
  isLoading: boolean
  error: string | null
  connectionStatus: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING'

  loadUserChats: () => Promise<void>
  createChat: (receiverId: number) => Promise<PersonalChat | null>
  setCurrentChat: (chat: PersonalChat | null) => void
  loadChatMessages: (chatId: string) => Promise<void>
  sendMessage: (chatId: string, content: string, messageType?: string) => Promise<void>
  addMessage: (chatId: string, message: ChatMessage) => void
  markChatRead: (chatId: string) => Promise<void>
  sendTyping: (chatId: string, isTyping: boolean) => void
  getTypingUsers: (chatId: string) => string[]
  clearError: () => void
  setConnectionStatus: (status: ChatState['connectionStatus']) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  currentChat: null,
  messages: {},
  typingUsers: {},
  isLoading: false,
  error: null,
  connectionStatus: 'DISCONNECTED',

  loadUserChats: async () => {
    try {
      set({ isLoading: true, error: null })
      const response = await chatService.getUserChats()
      // Fix: Access the 'results' property from the API response
      set({ chats: response.results, isLoading: false })
    } catch (error) {
      console.error('❌ Error loading chats:', error)
      set({ error: 'Failed to load chats', isLoading: false })
      // toast.error('Failed to load chats.')
    }
  },

  createChat: async (receiverId: number) => {
    try {
      set({ isLoading: true, error: null })
      const response = await chatService.createPersonalChat(receiverId)
      // toast.success('Chat created successfully!')

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
      // toast.error('Failed to create chat.')
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
      // toast.error('Failed to load messages.')
    }
  },

  sendMessage: async (chatId: string, content: string, messageType: string = 'text') => {
    try {
      await chatService.sendPersonalMessage(chatId, content, messageType)
      await get().loadChatMessages(chatId)
    } catch (error) {
      console.error('❌ Error sending message:', error)
      set({ error: 'Failed to send message' })
      // toast.error('Failed to send message.')
    }
  },

  addMessage: (chatId: string, message: ChatMessage) => {
    const currentMessages = get().messages[chatId] || []
    if (!currentMessages.some(msg => msg.id === message.id)) {
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
      // toast.success('Messages marked as read.')
    } catch (error) {
      console.error('❌ Error marking messages as read:', error)
      // toast.error('Failed to mark messages as read.')
    }
  },

  sendTyping: (chatId: string, isTyping: boolean) => {
    const currentTyping = get().typingUsers[chatId] || []
    const myName = "You" 

    if (isTyping && !currentTyping.includes(myName)) {
      set({
        typingUsers: {
          ...get().typingUsers,
          [chatId]: [...currentTyping, myName]
        }
      })
    } else if (!isTyping) {
      set({
        typingUsers: {
          ...get().typingUsers,
          [chatId]: currentTyping.filter(user => user !== myName)
        }
      })
    }
  },

  getTypingUsers: (chatId: string) => get().typingUsers[chatId] || [],

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  clearError: () => set({ error: null })
}))

export const useChat = () => {
  const store = useChatStore()
  return {
    ...store,
    getChatMessages: (chatId: string) => store.messages[chatId] || []
  }
}