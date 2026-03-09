// ChatView - DM conversation chat interface (direct + group)
// Group: shows sender names, member count, add/leave options
// Direct: block user, delete messages
// Includes on-demand translate button on each message
// Action bar with Reply, Edit, Copy, Forward, Delete (Phase 1)
import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmModal } from '../common/ConfirmModal.jsx';
import { TranslateButton } from '../common/TranslateButton.jsx';

function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatDateLabel(isoString, t) {
  const date = new Date(isoString);
  const now = new Date();
  if (isSameDay(date, now)) return t('community.dm.today');
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return t('community.dm.yesterday');
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Custom SVG Icons for action bar (16x16, inline)
const Icons = {
  Reply: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 17 4 12 9 7" />
      <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
  ),
  Edit: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Copy: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Forward: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 17 20 12 15 7" />
      <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
    </svg>
  ),
  Delete: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
};

// Philosophical reaction definitions
const REACTIONS = [
  { type: 'reason', emoji: '\u2696\uFE0F', school: 'Objectivism' },
  { type: 'dialectic', emoji: '\u2694\uFE0F', school: 'Marxism' },
  { type: 'reflect', emoji: '\uD83E\uDDD8', school: 'Stoicism' },
  { type: 'provoke', emoji: '\u26A1', school: 'Nietzsche' },
  { type: 'absurd', emoji: '\uD83C\uDF00', school: 'Existentialism' },
  { type: 'virtue', emoji: '\uD83C\uDFDB\uFE0F', school: 'Classical' },
];

// Analysis share card - renders a rich preview card for shared analyses
function AnalysisShareCard({ metadata, t }) {
  if (!metadata) return null;
  const { songName, artist, philosophicalNote, classification, analysisId, shareSlug } = metadata;

  const handleViewAnalysis = () => {
    // Navigate to the shared analysis page
    if (shareSlug) {
      window.open(`/a/${shareSlug}`, '_blank', 'noopener');
    } else if (analysisId) {
      window.open(`/shared/${analysisId}`, '_blank', 'noopener');
    }
  };

  return (
    <div className="dm-analysis-card" onClick={handleViewAnalysis} role="button" tabIndex={0}>
      <div className="dm-analysis-card__icon">P</div>
      <div className="dm-analysis-card__content">
        <div className="dm-analysis-card__song">{songName}</div>
        <div className="dm-analysis-card__artist">{artist}</div>
        {(philosophicalNote || classification) && (
          <div className="dm-analysis-card__stats">
            {philosophicalNote && (
              <span className="dm-analysis-card__note">
                {philosophicalNote.length > 80
                  ? philosophicalNote.substring(0, 80) + '...'
                  : philosophicalNote}
              </span>
            )}
            {classification && (
              <span className="dm-analysis-card__classification">{classification}</span>
            )}
          </div>
        )}
        <div className="dm-analysis-card__cta">{t('community.dm.viewAnalysis')}</div>
      </div>
    </div>
  );
}

// Philosophical reactions bar below message bubble
function PhilosophicalReactions({ message, onToggleReaction, t }) {
  const reactions = message.reactions || {};
  const myReactions = message.myReactions || [];
  const hasAnyReactions = Object.keys(reactions).length > 0;

  return (
    <div
      className={`dm-message__reactions ${hasAnyReactions ? 'dm-message__reactions--has-some' : ''}`}
    >
      {REACTIONS.map(({ type, emoji }) => {
        const count = reactions[type] || 0;
        const isActive = myReactions.includes(type);
        const showCount = count > 0;

        return (
          <button
            key={type}
            className={`dm-reaction ${isActive ? 'dm-reaction--active' : ''} ${showCount ? 'dm-reaction--has-count' : ''}`}
            onClick={() => onToggleReaction(message.id, type)}
            title={t(`community.dm.reactions.${type}`)}
            aria-label={t(`community.dm.reactions.${type}`)}
          >
            <span className="dm-reaction__emoji">{emoji}</span>
            {showCount && <span className="dm-reaction__count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

// Action bar component - always visible above message bubble
function MessageActions({ isMine, onReply, onEdit, onCopy, onForward, onDelete }) {
  return (
    <div
      className={`dm-message__actions ${isMine ? 'dm-message__actions--mine' : 'dm-message__actions--theirs'}`}
    >
      <button
        className="dm-message__action"
        onClick={onReply}
        title="Reply"
        aria-label="Reply to message"
      >
        <Icons.Reply />
      </button>
      {isMine && (
        <button
          className="dm-message__action"
          onClick={onEdit}
          title="Edit"
          aria-label="Edit message"
        >
          <Icons.Edit />
        </button>
      )}
      <button
        className="dm-message__action"
        onClick={onCopy}
        title="Copy"
        aria-label="Copy message"
      >
        <Icons.Copy />
      </button>
      <button
        className="dm-message__action"
        onClick={onForward}
        title="Forward"
        aria-label="Forward message"
      >
        <Icons.Forward />
      </button>
      {isMine && (
        <button
          className="dm-message__action dm-message__action--danger"
          onClick={onDelete}
          title="Delete"
          aria-label="Delete message"
        >
          <Icons.Delete />
        </button>
      )}
    </div>
  );
}

function MessageBubble({
  message,
  isGroup,
  onDelete,
  onReply,
  onEdit,
  onForward,
  onToggleReaction,
  isEditing,
  onSaveEdit,
  onCancelEdit,
  t,
}) {
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [editText, setEditText] = useState(message.message || '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.message);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = message.message;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    }
  };

  const handleReply = () => {
    onReply?.(message);
  };

  const handleEdit = () => {
    onEdit?.(message);
  };

  const handleForward = () => {
    // Phase 4: Will open forward modal
    onForward?.(message);
  };

  const handleDelete = () => {
    onDelete(message.id);
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editText.trim() !== message.message) {
      onSaveEdit?.(message.id, editText.trim());
    } else {
      onCancelEdit?.();
    }
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      onCancelEdit?.();
    }
  };

  return (
    <div className={`dm-message ${message.isMine ? 'dm-message--mine' : 'dm-message--theirs'}`}>
      {/* Action bar - always visible above bubble */}
      {!isEditing && (
        <MessageActions
          isMine={message.isMine}
          onReply={handleReply}
          onEdit={handleEdit}
          onCopy={handleCopy}
          onForward={handleForward}
          onDelete={handleDelete}
        />
      )}
      {/* Reply preview - shows what message this is replying to */}
      {message.replyPreview && (
        <div className="dm-message__reply-preview">
          <span className="dm-message__reply-author">{message.replyPreview.senderName}</span>
          <span className="dm-message__reply-text">{message.replyPreview.message}</span>
        </div>
      )}
      {/* Forwarded indicator */}
      {message.isForwarded && (
        <div className="dm-message__forwarded">{t('community.dm.forwarded')}</div>
      )}
      {/* Show sender name in group conversations (for other people's messages) */}
      {isGroup && !message.isMine && message.senderName && (
        <div className="dm-message__sender">{message.senderName}</div>
      )}
      <div
        className={`dm-message__bubble ${message.messageType === 'analysis_share' ? 'dm-message__bubble--analysis' : ''}`}
      >
        {message.messageType === 'analysis_share' && message.metadata ? (
          <AnalysisShareCard metadata={message.metadata} t={t} />
        ) : isEditing ? (
          <div className="dm-message__edit-container">
            <textarea
              className="dm-message__edit-input"
              value={editText}
              onChange={(e) => setEditText(e.target.value.slice(0, 1000))}
              onKeyDown={handleEditKeyDown}
              autoFocus
              maxLength={1000}
            />
            <div className="dm-message__edit-actions">
              <button
                className="dm-message__edit-btn dm-message__edit-btn--save"
                onClick={handleSaveEdit}
              >
                {t('community.dm.save')}
              </button>
              <button
                className="dm-message__edit-btn dm-message__edit-btn--cancel"
                onClick={onCancelEdit}
              >
                {t('community.dm.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <>
            {message.message}
            {message.editedAt && (
              <span className="dm-message__edited">{t('community.dm.edited')}</span>
            )}
          </>
        )}
        {copyFeedback && (
          <span className="dm-message__copy-feedback">{t('community.dm.copied')}</span>
        )}
      </div>
      <div className="dm-message__time">{formatTime(message.createdAt)}</div>
      {/* Philosophical reactions */}
      {onToggleReaction && (
        <PhilosophicalReactions message={message} onToggleReaction={onToggleReaction} t={t} />
      )}
      <TranslateButton text={message.message} />
    </div>
  );
}

export function ChatView({
  conversation,
  messages,
  loading,
  error,
  hasMore,
  sending,
  currentUserId,
  onBack,
  onSend,
  onLoadMore,
  onDeleteMessage,
  onEditMessage,
  onBlockUser,
  onLeave,
  onShowMembers,
  onForward,
  onToggleReaction,
  isOnline,
  replyingTo,
  setReplyingTo,
  editingMessage,
  setEditingMessage,
  typingUsers,
  onTyping,
}) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // messageId
  const [showMenu, setShowMenu] = useState(false);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const isGroup = conversation?.type === 'group';
  const members = conversation?.members || [];
  const memberCount = members.length;

  // Get display info
  const displayName = isGroup
    ? conversation?.name || members.map((m) => m.displayName).join(', ')
    : members.find((m) => m.id !== currentUserId)?.displayName ||
      conversation?.name ||
      t('community.agora.loading');

  const partnerId = !isGroup ? members.find((m) => m.id !== currentUserId)?.id : null;
  const isPartnerOnline = !isGroup && partnerId && isOnline ? isOnline(partnerId) : false;

  // Check if current user is admin (for group conversations)
  // Scroll to bottom when new messages arrive (only if not scrolled up)
  useEffect(() => {
    if (messagesEndRef.current && !isScrolledUp) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isScrolledUp]);

  // Track scroll position
  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setIsScrolledUp(!atBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setIsScrolledUp(false);
    }
  }, []);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = () => setShowMenu(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showMenu]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setInput('');
    try {
      await onSend(text);
    } catch {
      setInput(text); // Restore input on failure
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleDeleteMessage = (messageId) => {
    setShowDeleteConfirm(messageId);
  };

  const confirmDeleteMessage = async () => {
    if (showDeleteConfirm && onDeleteMessage) {
      await onDeleteMessage(showDeleteConfirm);
    }
    setShowDeleteConfirm(null);
  };

  // Reply handler - sets replyingTo state
  const handleReplyMessage = (message) => {
    setReplyingTo?.(message);
    setEditingMessage?.(null); // Cancel any edit in progress
  };

  // Edit handler - sets editingMessage state
  const handleEditMessage = (message) => {
    setEditingMessage?.(message);
    setReplyingTo?.(null); // Cancel any reply in progress
  };

  // Save edit handler
  const handleSaveEdit = async (messageId, newText) => {
    if (onEditMessage) {
      await onEditMessage(messageId, newText);
    }
    setEditingMessage?.(null);
  };

  // Cancel edit handler
  const handleCancelEdit = () => {
    setEditingMessage?.(null);
  };

  // Forward handler - delegates to parent (MessagesPanel)
  const handleForwardMessage = (message) => {
    onForward?.(message);
  };

  // Cancel reply handler
  const handleCancelReply = () => {
    setReplyingTo?.(null);
  };

  const handleBlock = async () => {
    setShowBlockConfirm(false);
    if (onBlockUser && partnerId) {
      await onBlockUser(partnerId);
    }
  };

  const handleLeave = async () => {
    setShowLeaveConfirm(false);
    if (onLeave) {
      await onLeave(conversation?.id);
    }
  };

  return (
    <div className="dm-chat">
      {/* Header */}
      <div className="dm-chat__header">
        <button className="dm-chat__back" onClick={onBack}>
          &larr;
        </button>
        <div
          className="dm-chat__partner"
          onClick={isGroup && onShowMembers ? onShowMembers : undefined}
        >
          <div className={`dm-chat__avatar ${isGroup ? 'dm-chat__avatar--group' : ''}`}>
            {isGroup ? (
              members
                .filter((m) => m.id !== currentUserId)
                .slice(0, 3)
                .map((m, i) => (
                  <span key={i} className="dm-chat__avatar-letter">
                    {(m.displayName || '?')[0].toUpperCase()}
                  </span>
                ))
            ) : (
              <>
                {(displayName || '?')[0].toUpperCase()}
                {isPartnerOnline && <span className="dm-chat__online-dot" />}
              </>
            )}
          </div>
          <div className="dm-chat__partner-info">
            <span className="dm-chat__name">{displayName}</span>
            {isGroup ? (
              <span className="dm-chat__status">
                {t('community.dm.memberCount', { count: memberCount })}
              </span>
            ) : (
              isPartnerOnline && <span className="dm-chat__status">{t('community.dm.online')}</span>
            )}
          </div>
        </div>
        <div className="dm-chat__header-actions">
          <button
            className="dm-chat__menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            aria-label="Chat options"
          >
            &#8942;
          </button>
          {showMenu && (
            <div className="dm-chat__dropdown" onClick={(e) => e.stopPropagation()}>
              {isGroup && onShowMembers && (
                <button
                  className="dm-chat__dropdown-item"
                  onClick={() => {
                    setShowMenu(false);
                    onShowMembers();
                  }}
                >
                  {t('community.dm.members')}
                </button>
              )}
              {isGroup && (
                <button
                  className="dm-chat__dropdown-item dm-chat__dropdown-item--danger"
                  onClick={() => {
                    setShowMenu(false);
                    setShowLeaveConfirm(true);
                  }}
                >
                  {t('community.dm.leaveGroup')}
                </button>
              )}
              {!isGroup && onBlockUser && (
                <button
                  className="dm-chat__dropdown-item dm-chat__dropdown-item--danger"
                  onClick={() => {
                    setShowMenu(false);
                    setShowBlockConfirm(true);
                  }}
                >
                  {t('community.dm.blockUser')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="dm-chat__messages" ref={messagesContainerRef} onScroll={handleScroll}>
        {hasMore && (
          <button className="dm-chat__load-more" onClick={onLoadMore} disabled={loading}>
            {loading ? t('community.dm.loadingMessages') : t('community.dm.loadEarlier')}
          </button>
        )}

        {error && <div className="dm-error">{error}</div>}

        {loading && messages.length === 0 && (
          <div className="dm-loading">{t('community.dm.loadingMessages')}</div>
        )}

        {!loading && messages.length === 0 && (
          <div className="dm-empty-chat">{t('community.dm.startConversation')}</div>
        )}

        {messages.map((msg, idx) => {
          // Date separator: show when date changes between messages
          const showDateSep =
            idx === 0 || !isSameDay(new Date(messages[idx - 1].createdAt), new Date(msg.createdAt));

          return (
            <div key={msg.id}>
              {showDateSep && (
                <div className="dm-chat__date-separator">
                  <span>{formatDateLabel(msg.createdAt, t)}</span>
                </div>
              )}
              <MessageBubble
                message={msg}
                isGroup={isGroup}
                onDelete={handleDeleteMessage}
                onReply={handleReplyMessage}
                onEdit={handleEditMessage}
                onForward={handleForwardMessage}
                onToggleReaction={onToggleReaction}
                isEditing={editingMessage?.id === msg.id}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                t={t}
              />
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {isScrolledUp && (
        <button
          className="dm-chat__scroll-bottom"
          onClick={scrollToBottom}
          aria-label={t('community.dm.scrollToBottom')}
        >
          &darr;
        </button>
      )}

      {/* Typing indicator */}
      {typingUsers && typingUsers.length > 0 && (
        <div className="dm-chat__typing-indicator">
          {typingUsers.length === 1
            ? t('community.dm.typing', { name: typingUsers[0] })
            : t('community.dm.typingMultiple', { count: typingUsers.length })}
        </div>
      )}

      {/* Reply bar - shows when replying to a message */}
      {replyingTo && (
        <div className="dm-chat__reply-bar">
          <div className="dm-chat__reply-info">
            <span className="dm-chat__reply-label">{t('community.dm.replyingTo')}</span>
            <span className="dm-chat__reply-author">{replyingTo.senderName}</span>
            <span className="dm-chat__reply-text">
              {replyingTo.message?.slice(0, 50)}
              {replyingTo.message?.length > 50 ? '...' : ''}
            </span>
          </div>
          <button
            className="dm-chat__reply-cancel"
            onClick={handleCancelReply}
            aria-label="Cancel reply"
          >
            &times;
          </button>
        </div>
      )}

      {/* Input */}
      <form className="dm-chat__input" onSubmit={handleSubmit}>
        <textarea
          className="dm-chat__textarea"
          value={input}
          onChange={(e) => {
            setInput(e.target.value.slice(0, 1000));
            // Debounced typing indicator
            if (onTyping) {
              clearTimeout(typingTimeoutRef.current);
              onTyping();
              typingTimeoutRef.current = setTimeout(() => {}, 2000);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={replyingTo ? t('community.dm.typeReply') : t('community.dm.typeMessage')}
          maxLength={1000}
          rows={1}
          disabled={sending}
        />
        <button type="submit" className="dm-chat__send" disabled={!input.trim() || sending}>
          {sending ? '...' : t('community.dm.send')}
        </button>
      </form>

      {/* Block confirmation (direct only) */}
      <ConfirmModal
        isOpen={showBlockConfirm}
        onClose={() => setShowBlockConfirm(false)}
        onConfirm={handleBlock}
        title={t('community.dm.blockConfirmTitle')}
        message={t('community.dm.blockConfirmMessage', { name: displayName })}
        confirmText={t('community.dm.block')}
        cancelText={t('community.dm.cancel')}
        confirmVariant="danger"
      />

      {/* Leave group confirmation */}
      <ConfirmModal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={handleLeave}
        title={t('community.dm.leaveGroupTitle')}
        message={t('community.dm.leaveGroupConfirm', { name: displayName })}
        confirmText={t('community.dm.leave')}
        cancelText={t('community.dm.cancel')}
        confirmVariant="danger"
      />

      {/* Delete message confirmation */}
      <ConfirmModal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={confirmDeleteMessage}
        title={t('community.dm.deleteMessageTitle')}
        message={t('community.dm.deleteMessageConfirm')}
        confirmText={t('community.dm.delete')}
        cancelText={t('community.dm.cancel')}
        confirmVariant="danger"
      />
    </div>
  );
}

export default ChatView;
