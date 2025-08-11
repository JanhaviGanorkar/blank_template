import React, { useEffect, useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { PersonalChat } from '../../types/chat';
import './ChatList.css';

interface ChatListProps {
  onChatSelect: (chat: PersonalChat) => void;
  selectedChatId?: string;
}

const ChatList: React.FC<ChatListProps> = ({ onChatSelect, selectedChatId }) => {
  const { state, loadUserChats } = useChat();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUserChats();
  }, []);

  // Filter chats based on search query
  const filteredChats = state.chats.filter(chat =>
    chat.other_user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.last_message?.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatLastMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;
      
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const truncateMessage = (message: string, maxLength: number = 50) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  if (state.loading) {
    return (
      <div className="chat-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading chats...</p>
      </div>
    );
  }

  return (
    <div className="chat-list">
      {/* Search Bar */}
      <div className="chat-search">
        <div className="search-input-container">
          <i className="search-icon">🔍</i>
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Chat List Header */}
      <div className="chat-list-header">
        <h2>Messages</h2>
        <span className="chat-count">({filteredChats.length})</span>
      </div>

      {/* Chat Items */}
      <div className="chat-items">
        {filteredChats.length === 0 ? (
          <div className="no-chats">
            {searchQuery ? (
              <div className="no-search-results">
                <p>No chats found for "{searchQuery}"</p>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <h3>No conversations yet</h3>
                <p>Start a new conversation to begin chatting</p>
              </div>
            )}
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${selectedChatId === chat.id ? 'selected' : ''}`}
              onClick={() => onChatSelect(chat)}
            >
              {/* Avatar */}
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
                {/* Online indicator (if user is online) */}
                {/* <div className="online-indicator active"></div> */}
              </div>

              {/* Chat Info */}
              <div className="chat-info">
                <div className="chat-header">
                  <h4 className="chat-name">{chat.other_user?.name}</h4>
                  <span className="message-time">
                    {chat.last_message && formatLastMessageTime(chat.last_message.timestamp)}
                  </span>
                </div>

                <div className="chat-preview">
                  <div className="last-message">
                    {chat.last_message ? (
                      <span className={chat.last_message.is_own_message ? 'own-message' : 'other-message'}>
                        {chat.last_message.is_own_message && (
                          <span className="message-indicator">You: </span>
                        )}
                        {chat.last_message.message_type === 'text' 
                          ? truncateMessage(chat.last_message.content)
                          : `📎 ${chat.last_message.message_type}`
                        }
                      </span>
                    ) : (
                      <span className="no-messages">No messages yet</span>
                    )}
                  </div>

                  {/* Unread badge */}
                  {chat.unread_count > 0 && (
                    <div className="unread-badge">
                      {chat.unread_count > 99 ? '99+' : chat.unread_count}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="error-message">
          <p>❌ {state.error}</p>
          <button onClick={loadUserChats} className="retry-button">
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatList;