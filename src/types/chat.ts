// Chat Types for Personal Encrypted Messaging
export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  is_self?: boolean;
}

export interface PersonalChat {
  id: string;
  user1: User;
  user2: User;
  other_user: User;
  participants: User[];
  created_at: string;
  last_message_at: string;
  last_message: {
    content: string;
    timestamp: string;
    sender_name: string;
    message_type: string;
    is_own_message: boolean;
  } | null;
  unread_count: number;
  is_active: boolean;
}

export interface ChatMessage {
  id: string;
  sender_name: string;
  sender_avatar: string | null;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'audio';
  timestamp: string;
  is_own_message: boolean;
  delivered_at: string | null;
  read_at: string | null;
  delivery_status: {
    delivered: boolean;
    read: boolean;
    delivered_at: string | null;
    read_at: string | null;
  };
}

export interface SendMessageData {
  content: string;
  message_type?: 'text' | 'image' | 'file' | 'audio';
}

export interface CreateChatResponse {
  chat: PersonalChat;
  created: boolean;
  message: string;
}

export interface ChatMessagesResponse {
  chat: PersonalChat;
  messages: ChatMessage[];
  count: number;
}

export interface UserChatsResponse {
  chats: PersonalChat[];
  count: number;
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: 'personal_message' | 'typing' | 'user_status' | 'connected' | 'error';
  data?: any;
  message?: string;
  chat_id?: string;
  user_id?: number;
}

export interface TypingData {
  chat_id: string;
  user_id: number;
  user_name: string;
  is_typing: boolean;
}

export interface PersonalMessageData {
  id: string;
  chat_id: string;
  sender_id: number;
  sender_name: string;
  sender_avatar: string | null;
  content: string;
  message_type: string;
  timestamp: string;
  is_own_message: boolean;
}