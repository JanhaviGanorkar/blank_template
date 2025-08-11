import { SecureTokenStorage } from '../components/auth/SecureTokenStorage';
import { WebSocketMessage, PersonalMessageData, TypingData } from '../types/chat';

class ChatWebSocketService {
  private ws: WebSocket | null = null;
  private chatId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<string, Function[]> = new Map();
  private typingTimeout: NodeJS.Timeout | null = null;

  // Connection management
  connect(chatId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const token = SecureTokenStorage.getAccessToken();
        if (!token) {
          reject(new Error('No authentication token available'));
          return;
        }

        this.chatId = chatId;
        const wsUrl = `ws://localhost:8000/ws/personal-chat/?token=${token}&chat_id=${chatId}`;
        
        console.log('🔌 Connecting to personal chat WebSocket:', chatId);
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ Personal chat WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = (event) => {
          console.log('❌ Personal chat WebSocket disconnected:', event.code);
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('❌ Personal chat WebSocket error:', error);
          reject(error);
        };

      } catch (error) {
        console.error('❌ Failed to connect to personal chat WebSocket:', error);
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      console.log('🔌 Disconnecting personal chat WebSocket');
      this.ws.close(1000, 'User initiated disconnect');
      this.ws = null;
      this.chatId = null;
    }
  }

  // Message handling
  private handleMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      console.log('📨 WebSocket message received:', message);

      // Trigger handlers for message type
      const handlers = this.messageHandlers.get(message.type) || [];
      handlers.forEach(handler => handler(message));

    } catch (error) {
      console.error('❌ Error parsing WebSocket message:', error);
    }
  }

  // Send messages
  sendMessage(content: string, messageType: string = 'text') {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'personal_message',
        data: {
          content,
          message_type: messageType
        }
      };
      
      console.log('📤 Sending message:', message);
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('❌ WebSocket not connected, cannot send message');
    }
  }

  // Typing indicators
  sendTyping(isTyping: boolean) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'typing',
        data: {
          isTyping
        }
      };
      
      this.ws.send(JSON.stringify(message));
      
      // Auto-stop typing after 3 seconds
      if (isTyping) {
        if (this.typingTimeout) {
          clearTimeout(this.typingTimeout);
        }
        
        this.typingTimeout = setTimeout(() => {
          this.sendTyping(false);
        }, 3000);
      }
    }
  }

  // Mark messages as read
  markAsRead(messageIds?: number[]) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'mark_read',
        data: {
          message_ids: messageIds || []
        }
      };
      
      this.ws.send(JSON.stringify(message));
    }
  }

  // Ping/Pong for connection health
  ping() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'ping',
        timestamp: Date.now()
      };
      
      this.ws.send(JSON.stringify(message));
    }
  }

  // Event handlers
  onPersonalMessage(handler: (data: PersonalMessageData) => void) {
    this.addHandler('personal_message', handler);
  }

  onTyping(handler: (data: TypingData) => void) {
    this.addHandler('typing', handler);
  }

  onConnected(handler: (data: any) => void) {
    this.addHandler('connected', handler);
  }

  onError(handler: (data: any) => void) {
    this.addHandler('error', handler);
  }

  onPong(handler: (data: any) => void) {
    this.addHandler('pong', handler);
  }

  // Helper methods
  private addHandler(type: string, handler: Function) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  removeHandler(type: string, handler: Function) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.chatId) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (this.chatId) {
          this.connect(this.chatId).catch(error => {
            console.error('❌ Reconnection failed:', error);
          });
        }
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached or no chat ID');
    }
  }

  // Connection status
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionState(): string {
    if (!this.ws) return 'DISCONNECTED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'CONNECTED';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'DISCONNECTED';
      default: return 'UNKNOWN';
    }
  }

  // Cleanup
  destroy() {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    this.disconnect();
    this.messageHandlers.clear();
  }
}

// Export singleton instance
export const chatWebSocket = new ChatWebSocketService();
export default chatWebSocket;