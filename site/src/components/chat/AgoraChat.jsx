// AgoraChat - Embeddable global chat (no Modal wrapper)
// Used inside the CommunityHub sidebar's Agora tab.
// Supports reply, edit, copy, delete actions on messages.
import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChatMessage } from './ChatMessage.jsx';
import { ChatInput } from './ChatInput.jsx';
import { ConfirmModal } from '../common/ConfirmModal.jsx';
import { AgoraRulesModal } from './AgoraRulesModal.jsx';
import { useChat } from '../../hooks/useChat.js';
import '../../styles/chat.css';

// Bump this when the Agora Principles change so everyone must re-accept.
const AGORA_RULES_VERSION = 'v1';
const agoraRulesKey = (uid) => `philosify.agora.rules.${AGORA_RULES_VERSION}.${uid || 'anon'}`;

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

  // Agora Principles gate: users must commit to the rules before posting.
  // null = unknown (still resolving), true = accepted, false = not yet accepted.
  const [rulesAccepted, setRulesAccepted] = useState(null);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let accepted = false;
    try {
      accepted = localStorage.getItem(agoraRulesKey(userId)) === '1';
    } catch {
      accepted = false;
    }
    setRulesAccepted(accepted);
    setShowRules(!accepted);
  }, [userId]);

  const handleAcceptRules = useCallback(() => {
    try {
      localStorage.setItem(agoraRulesKey(userId), '1');
    } catch {
      /* storage unavailable — accept for this session only */
    }
    setRulesAccepted(true);
    setShowRules(false);
  }, [userId]);

  const handleDeclineRules = useCallback(() => {
    // Hide the modal but keep posting gated; the gate bar can reopen it.
    setShowRules(false);
  }, []);

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
      if (!rulesAccepted) {
        setShowRules(true);
        return;
      }
      sendMessage(text, options);
    },
    [sendMessage, rulesAccepted]
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
        {rulesAccepted ? (
          <ChatInput
            onSend={handleSend}
            sending={sending}
            replyingTo={replyingTo}
            onCancelReply={handleCancelReply}
          />
        ) : rulesAccepted === false ? (
          <button
            type="button"
            className="agora-rules-gate-bar"
            onClick={() => setShowRules(true)}
          >
            {t(
              'community.agora.rules.gateBar',
              'Accept the Agora Principles to join the conversation'
            )}
          </button>
        ) : null}
      </div>

      <AgoraRulesModal
        isOpen={showRules}
        onAccept={handleAcceptRules}
        onClose={handleDeclineRules}
      />

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
