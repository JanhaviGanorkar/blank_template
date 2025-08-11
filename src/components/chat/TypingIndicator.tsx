import React from 'react';
import './TypingIndicator.css';

interface TypingIndicatorProps {
  users: string[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users }) => {
  if (users.length === 0) return null;

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0]} is typing...`;
    } else if (users.length === 2) {
      return `${users[0]} and ${users[1]} are typing...`;
    } else {
      return `${users[0]} and ${users.length - 1} others are typing...`;
    }
  };

  return (
    <div className="typing-indicator">
      <div className="typing-content">
        <div className="typing-avatar">
          <div className="avatar-placeholder">
            {users[0].charAt(0).toUpperCase()}
          </div>
        </div>
        
        <div className="typing-bubble">
          <div className="typing-text">
            {getTypingText()}
          </div>
          
          <div className="typing-dots">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;