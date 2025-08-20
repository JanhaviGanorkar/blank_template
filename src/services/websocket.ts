import { useCallback } from 'react'
import { useAuthStore } from '../store/store'
import { SecureTokenStorage } from '../components/auth/SecureTokenStorage'

class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectInterval: number | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private isManualClose = false
  
  connect() {
    // Don't connect if already connected or connecting
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      console.log('⚠️ WebSocket already connected or connecting')
      return
    }

    // Check current status to avoid unnecessary state updates
    const currentStatus = useAuthStore.getState().connectionStatus
    if (currentStatus === 'CONNECTING' || currentStatus === 'CONNECTED') {
      console.log('⚠️ Already connecting or connected')
      return
    }

    const token = SecureTokenStorage.getAccessToken()
    if (!token) {
      console.error('❌ No auth token for WebSocket connection')
      if (currentStatus !== 'DISCONNECTED') {
        useAuthStore.getState().setConnectionStatus('DISCONNECTED')
      }
      return
    }

    try {
      // Close existing connection if any
      if (this.ws) {
        this.ws.close()
      }

      // Reset manual close flag
      this.isManualClose = false
      
      // Update connection status only if changed
      // Set to CONNECTING only if not already CONNECTING or CONNECTED
      useAuthStore.getState().setConnectionStatus('CONNECTING')
      
      console.log('🔌 Attempting WebSocket connection...')
      
      // Create WebSocket connection with JWT token
      this.ws = new WebSocket(`ws://localhost:8000/ws/chat/?token=${token}`)
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected successfully')
        const currentStatus = useAuthStore.getState().connectionStatus
        if (currentStatus !== 'CONNECTED') {
          useAuthStore.getState().setConnectionStatus('CONNECTED')
        }
        this.reconnectAttempts = 0
        
        if (this.reconnectInterval) {
          clearInterval(this.reconnectInterval)
          this.reconnectInterval = null
        }
      }
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📨 WebSocket message received:', data)
          this.handleMessage(data)
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error)
        }
      }
      
      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket closed:', { 
          code: event.code, 
          reason: event.reason, 
          wasClean: event.wasClean 
        })
        
        // Only set to disconnected if not already in another state
        const currentStatus = useAuthStore.getState().connectionStatus
        if (currentStatus !== 'RECONNECTING') {
          useAuthStore.getState().setConnectionStatus('DISCONNECTED')
        }
        
        // Don't reconnect if it was a manual close or if we're already at max attempts
        if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          // Wait a bit before reconnecting to avoid rapid reconnection attempts
          setTimeout(() => {
            this.reconnect()
          }, 1000)
        }
      }
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        useAuthStore.getState().setConnectionStatus('DISCONNECTED')
      }
      
    } catch (error) {
      console.error('❌ Error creating WebSocket connection:', error)
      useAuthStore.getState().setConnectionStatus('DISCONNECTED')
    }
  }
  
  disconnect() {
    this.isManualClose = true
    
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval)
      this.reconnectInterval = null
    }
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    // Only update state if not already disconnected
    const currentStatus = useAuthStore.getState().connectionStatus
    if (currentStatus !== 'DISCONNECTED') {
      useAuthStore.getState().setConnectionStatus('DISCONNECTED')
    }
  }
  
  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max WebSocket reconnection attempts reached')
      useAuthStore.getState().setConnectionStatus('DISCONNECTED')
      return
    }
    
    // Don't reconnect if manually closed
    if (this.isManualClose) {
      return
    }

    this.reconnectAttempts++
    useAuthStore.getState().setConnectionStatus('RECONNECTING')
    
    console.log(`🔄 Attempting WebSocket reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
    
    // Clear any existing reconnection timer
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval)
    }
    
    // Exponential backoff: 2^attempt seconds (2s, 4s, 8s, 16s, 32s)
    const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000, 30000) // Max 30 seconds
    
    this.reconnectInterval = window.setTimeout(() => {
      // Check if we still need to reconnect
      if (!this.isManualClose && this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.connect()
      }
    }, delay)
  }
  
  private handleMessage(data: any) {
    switch (data.type) {
      case 'chat.message':
        // Add new message to chat
        if (data.chat_id && data.message) {
          useAuthStore.getState().addMessage(data.chat_id, data.message)
        }
        break
        
      case 'chat.typing':
        // Handle typing indicators
        console.log('👀 User typing:', data)
        break
        
      case 'chat.delivery_status':
        // Handle message delivery status updates
        console.log('📨 Message delivery status:', data)
        break
        
      case 'error':
        console.error('❌ WebSocket error message:', data.message)
        break
        
      default:
        console.log('📝 Unknown WebSocket message type:', data.type)
    }
  }
  
  sendMessage(chatId: string, content: string, messageType: string = 'text') {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket not connected')
      return
    }
    
    const message = {
      type: 'chat.message',
      chat_id: chatId,
      content,
      message_type: messageType
    }
    
    this.ws.send(JSON.stringify(message))
  }
  
  sendTypingIndicator(chatId: string, isTyping: boolean) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return
    }
    
    const message = {
      type: 'chat.typing',
      chat_id: chatId,
      is_typing: isTyping
    }
    
    this.ws.send(JSON.stringify(message))
  }
  
  getConnectionStatus() {
    if (!this.ws) return 'DISCONNECTED'
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING'
      case WebSocket.OPEN:
        return 'CONNECTED'
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        return 'DISCONNECTED'
      default:
        return 'DISCONNECTED'
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService()

// Hook for using WebSocket in components
export const useWebSocket = () => {
  const connectionStatus = useAuthStore(state => state.connectionStatus)
  
  const connect = useCallback(() => websocketService.connect(), [])
  const disconnect = useCallback(() => websocketService.disconnect(), [])
  const sendMessage = useCallback((chatId: string, content: string, messageType?: string) => 
    websocketService.sendMessage(chatId, content, messageType), [])
  const sendTypingIndicator = useCallback((chatId: string, isTyping: boolean) => 
    websocketService.sendTypingIndicator(chatId, isTyping), [])
  
  return {
    connect,
    disconnect,
    sendMessage,
    sendTypingIndicator,
    connectionStatus,
    isConnected: connectionStatus === 'CONNECTED'
  }
}