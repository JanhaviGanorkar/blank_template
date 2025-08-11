import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { PersonalChat } from '../../types/chat';
import MessageItem from './MessageItem';
import TypingIndicator from './TypingIndicator';
import './ChatWindow.css';

interface ChatWindowProps {
  chat: PersonalChat;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chat }) => {
  const { 
    state, 
    sendMessage, 
    getChatMessages, 
    getTypingUsers, 
    sendTyping,
    markChatRead 
  } = useChat();
  
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const messages = getChatMessages(chat.id);
  const typingUsers = getTypingUsers(chat.id);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when chat opens
  useEffect(() => {
    if (chat && messages.length > 0) {
      markChatRead(chat.id);
    }
  }, [chat, messages.length]);

  // Focus input when chat changes
  useEffect(() => {
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [chat.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const content = messageInput.trim();
    if (!content) return;

    try {
      await sendMessage(content);
      setMessageInput('');
      
      // Stop typing indicator
      if (isTyping) {
        sendTyping(false);
        setIsTyping(false);
      }
      
      // Focus back to input
      messageInputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessageInput(value);

    // Handle typing indicator
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      sendTyping(true);
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      sendTyping(false);
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false);
          sendTyping(false);
        }
      }, 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Send message on Enter (but not Shift+Enter)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatChatName = () => {
    return chat.other_user?.name || 'Unknown User';
  };

  const isOnline = () => {
    // You can implement online status logic here
    return false; // Placeholder
  };

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="chat-window">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-avatar">
            {chat.other_user?.avatar ? (
              <img
                src={chat.other_user.avatar}
                alt={chat.other_user.name}
                className="avatar-image"
              />
            ) : (
              <div className="avatar-placeholder">
                {chat.other_user?.name.charAt(0).toUpperCase()}
              </div>
            )}
            {isOnline() && <div className="online-indicator active"></div>}
          </div>
          
          <div className="chat-details">
            <h3 className="chat-title">{formatChatName()}</h3>
            <div className="chat-status">
              {state.connectionStatus === 'CONNECTED' ? (
                <span className="status-connected">🟢 Connected</span>
              ) : state.connectionStatus === 'CONNECTING' ? (
                <span className="status-connecting">🟡 Connecting...</span>
              ) : (
                <span className="status-disconnected">🔴 Disconnected</span>
              )}
            </div>
          </div>
        </div>

        <div className="chat-actions">
          {/* Add action buttons here (video call, phone call, etc.) */}
          <button className="action-button" title="More options">
            ⋮
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-messages">
            <div className="empty-icon">💬</div>
            <h4>Start your conversation</h4>
            <p>Send a message to {formatChatName()}</p>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((message, index) => {
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const showAvatar = !prevMessage || 
                prevMessage.sender_name !== message.sender_name ||
                new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime() > 300000; // 5 minutes

              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  showAvatar={showAvatar}
                />
              );
            })}
            
            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <TypingIndicator users={typingUsers} />
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="message-input-container">
        <form onSubmit={handleSendMessage} className="message-form">
          <div className="input-wrapper">
            <textarea
              ref={messageInputRef}
              value={messageInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${formatChatName()}...`}
              className="message-input"
              rows={1}
              maxLength={5000}
            />
            
            <div className="input-actions">
              {/* Emoji/File buttons can go here */}
              <button 
                type="submit" 
                disabled={!messageInput.trim()}
                className="send-button"
                title="Send message"
              >
                <span className="send-icon">
                  {messageInput.trim() ? '📤' : '📝'}
                </span>
              </button>
            </div>
          </div>
          
          {/* Character counter for long messages */}
          {messageInput.length > 4000 && (
            <div className="character-counter">
              {messageInput.length}/5000
            </div>
          )}
        </form>
      </div>

      {/* Connection Status Bar */}
      {state.connectionStatus !== 'CONNECTED' && (
        <div className={`connection-status ${state.connectionStatus.toLowerCase()}`}>
          {state.connectionStatus === 'CONNECTING' && '🔄 Connecting to chat...'}
          {state.connectionStatus === 'DISCONNECTED' && '⚠️ Connection lost. Messages may not be delivered.'}
          {state.connectionStatus === 'RECONNECTING' && '🔄 Reconnecting...'}
        </div>
      )}
    </div>
  );
};

export default ChatWindow;