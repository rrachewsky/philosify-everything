// AgoraChat - Embeddable global chat (no Modal wrapper)
// Used inside the CommunityHub sidebar's Agora tab.
// Supports reply, edit, copy, delete actions on messages.
import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChatMessage } from './ChatMessage.jsx';
import { ChatInput } from './ChatInput.jsx';
import { ConfirmModal } from '../common/ConfirmModal.jsx';
import { useChat } from '../../hooks/useChat.js';
import '../../styles/chat.css';

export function AgoraChat({ onUserClick }) {
  const { t } = useTranslation();
  const {
    messages,
    loading,
    error,
    hasMore,
    sending,
    sendMessage,
    editMessage,
    deleteMessage,
    loadMore,
    userId,
    editingMessage,
    setEditingMessage,
    replyingTo,
    setReplyingTo,
  } = useChat();

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleDeleteRequest = useCallback((messageId) => {
    setDeleteTarget(messageId);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) {
      deleteMessage(deleteTarget);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteMessage]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const handleReply = useCallback(
    (msg) => {
      setReplyingTo(msg);
      setEditingMessage(null);
    },
    [setReplyingTo, setEditingMessage]
  );

  const handleEditRequest = useCallback(
    (msg) => {
      setEditingMessage(msg);
      setReplyingTo(null);
    },
    [setEditingMessage, setReplyingTo]
  );

  const handleSaveEdit = useCallback(
    (messageId, newText) => {
      editMessage(messageId, newText);
    },
    [editMessage]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null);
  }, [setEditingMessage]);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, [setReplyingTo]);

  const handleSend = useCallback(
    (text, options = {}) => {
      sendMessage(text, options);
    },
    [sendMessage]
  );

  return (
    <div className="agora-chat">
      {error && <div className="chat-error">{error}</div>}

      <div className="chat-messages" ref={messagesContainerRef}>
        {hasMore && messages.length > 0 && (
          <button className="chat-load-more" onClick={loadMore} disabled={loading}>
            {loading ? t('community.agora.loading') : t('community.agora.loadOlder')}
          </button>
        )}

        {messages.length === 0 && !loading && (
          <div className="chat-no-messages">{t('community.agora.noMessages')}</div>
        )}

        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            msg={msg}
            isOwn={msg.user_id === userId}
            onUserClick={onUserClick}
            onDelete={handleDeleteRequest}
            onReply={handleReply}
            onEdit={handleEditRequest}
            isEditing={editingMessage?.id === msg.id}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '0 12px 12px' }}>
        <ChatInput
          onSend={handleSend}
          sending={sending}
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
        />
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t('community.agora.deleteTitle')}
        message={t('community.agora.deleteConfirm')}
        confirmText={t('community.dm.delete')}
        cancelText={t('community.dm.cancel')}
        confirmVariant="danger"
      />
    </div>
  );
}

export default AgoraChat;
