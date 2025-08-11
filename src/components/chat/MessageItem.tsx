import React from 'react';
import { ChatMessage } from '../../types/chat';
import './MessageItem.css';

interface MessageItemProps {
  message: ChatMessage;
  showAvatar?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, showAvatar = true }) => {
  
  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getDeliveryStatus = () => {
    if (!message.is_own_message) return null;
    
    if (message.delivery_status.read) {
      return <span className="delivery-status read" title="Read">✓✓</span>;
    } else if (message.delivery_status.delivered) {
      return <span className="delivery-status delivered" title="Delivered">✓</span>;
    } else {
      return <span className="delivery-status sending" title="Sending">⏳</span>;
    }
  };

  const renderMessageContent = () => {
    switch (message.message_type) {
      case 'text':
        return (
          <div className="message-text">
            {message.content}
          </div>
        );
      case 'image':
        return (
          <div className="message-image">
            <img src={message.content} alt="Shared image" />
          </div>
        );
      case 'file':
        return (
          <div className="message-file">
            <div className="file-icon">📎</div>
            <div className="file-info">
              <span className="file-name">{message.content}</span>
            </div>
          </div>
        );
      case 'audio':
        return (
          <div className="message-audio">
            <audio controls>
              <source src={message.content} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        );
      default:
        return (
          <div className="message-text">
            {message.content}
          </div>
        );
    }
  };

  return (
    <div className={`message-item ${message.is_own_message ? 'own-message' : 'other-message'}`}>
      {/* Avatar (only for other users' messages and when showAvatar is true) */}
      {!message.is_own_message && showAvatar && (
        <div className="message-avatar">
          {message.sender_avatar ? (
            <img
              src={message.sender_avatar}
              alt={message.sender_name}
              className="avatar-image"
            />
          ) : (
            <div className="avatar-placeholder">
              {message.sender_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* Message Content */}
      <div className="message-content">
        {/* Sender name (only for other users' messages and when showAvatar is true) */}
        {!message.is_own_message && showAvatar && (
          <div className="message-sender">
            {message.sender_name}
          </div>
        )}

        {/* Message bubble */}
        <div className="message-bubble">
          {renderMessageContent()}
          
          {/* Message time and delivery status */}
          <div className="message-meta">
            <span className="message-time">
              {formatMessageTime(message.timestamp)}
            </span>
            {getDeliveryStatus()}
          </div>
        </div>
      </div>

      {/* Spacer for own messages to push them to the right */}
      {message.is_own_message && <div className="message-spacer"></div>}
    </div>
  );
};

export default MessageItem;