import React, { useState, useRef } from 'react';
import { useChatStore } from '../../store/chatStore';

interface ChatWindowProps {
  chat: {
    id: string;
    name: string;
    messages: { id: string; content: string; sender: string; timestamp: string }[];
  };
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ chat }) => {
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);

  const { sendMessage, sendTyping } = useChatStore();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    const content = messageInput.trim();
    if (!content) return;

    try {
      await sendMessage(chat.id, content); // ✅ Pass chat.id
      setMessageInput('');

      // Stop typing indicator
      if (isTyping) {
        sendTyping(chat.id, false); // ✅ Pass chat.id
        setIsTyping(false);
      }

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
      sendTyping(chat.id, true); // ✅ Pass chat.id
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      sendTyping(chat.id, false); // ✅ Pass chat.id
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false);
          sendTyping(chat.id, false); // ✅ Pass chat.id
        }
      }, 2000);
    }
  };

  return (
    <div className="chat-window">
      <div className="messages">
        {chat.messages.map((msg) => (
          <div key={msg.id} className="message">
            <span className="sender">{msg.sender}:</span> {msg.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage} className="message-input-form">
        <textarea
          ref={messageInputRef}
          value={messageInput}
          onChange={handleInputChange}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};
