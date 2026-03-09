// ChatModal - Full global chat modal with messages + input
import { useRef, useEffect } from 'react';
import { Modal } from '../common/Modal.jsx';
import { ChatMessage } from './ChatMessage.jsx';
import { ChatInput } from './ChatInput.jsx';
import { useChat } from '../../hooks/useChat.js';
import '../../styles/chat.css';

export function ChatModal({ isOpen, onClose }) {
  const { messages, loading, error, hasMore, sending, sendMessage, loadMore, userId } = useChat();

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Global Chat"
      subtitle="Talk with the community"
      maxWidth="400px"
    >
      <div className="chat-modal-content">
        {error && <div className="chat-error">{error}</div>}

        <div className="chat-messages" ref={messagesContainerRef}>
          {hasMore && messages.length > 0 && (
            <button className="chat-load-more" onClick={loadMore} disabled={loading}>
              {loading ? 'LOADING...' : '↑ LOAD OLDER'}
            </button>
          )}

          {messages.length === 0 && !loading && (
            <div className="chat-no-messages">No messages yet. Start the conversation!</div>
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} msg={msg} isOwn={msg.user_id === userId} />
          ))}

          <div ref={messagesEndRef} />
        </div>

        <ChatInput onSend={sendMessage} sending={sending} />
      </div>
    </Modal>
  );
}

export default ChatModal;
