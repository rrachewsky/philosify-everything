// ChatMessage - Single message bubble with action bar
// Supports: reply, edit (own), copy, delete (own)
// Click on username to start DM (except for own messages)
// Includes on-demand translate button
import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TranslateButton } from '../common/TranslateButton.jsx';

// Inline SVG icons (16x16) matching DM ChatView pattern
const Icons = {
  Reply: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
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
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
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
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
};

function MessageActions({ isOwn, onReply, onEdit, onCopy, onDelete }) {
  return (
    <div
      className={`chat-msg-actions ${isOwn ? 'chat-msg-actions--own' : 'chat-msg-actions--other'}`}
    >
      <button className="chat-msg-action" onClick={onReply} title="Reply" aria-label="Reply">
        <Icons.Reply />
      </button>
      {isOwn && (
        <button className="chat-msg-action" onClick={onEdit} title="Edit" aria-label="Edit">
          <Icons.Edit />
        </button>
      )}
      <button className="chat-msg-action" onClick={onCopy} title="Copy" aria-label="Copy">
        <Icons.Copy />
      </button>
      {isOwn && (
        <button
          className="chat-msg-action chat-msg-action--danger"
          onClick={onDelete}
          title="Delete"
          aria-label="Delete"
        >
          <Icons.Delete />
        </button>
      )}
    </div>
  );
}

export function ChatMessage({
  msg,
  isOwn,
  onUserClick,
  onDelete,
  onReply,
  onEdit,
  isEditing,
  onSaveEdit,
  onCancelEdit,
}) {
  const { t } = useTranslation();
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [editText, setEditText] = useState(msg.message || '');

  const isSystem = msg.message_type === 'system';

  const time = useMemo(() => {
    const d = new Date(msg.created_at);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [msg.created_at]);

  const handleNameClick = useCallback(() => {
    if (isOwn || isSystem || !onUserClick) return;
    onUserClick(msg.user_id, msg.display_name);
  }, [isOwn, isSystem, onUserClick, msg.user_id, msg.display_name]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(msg.message);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = msg.message;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    }
  }, [msg.message]);

  const handleReply = useCallback(() => {
    onReply?.(msg);
  }, [onReply, msg]);

  const handleEdit = useCallback(() => {
    setEditText(msg.message || '');
    onEdit?.(msg);
  }, [onEdit, msg]);

  const handleDelete = useCallback(() => {
    onDelete?.(msg.id);
  }, [onDelete, msg.id]);

  const handleSaveEdit = useCallback(() => {
    if (editText.trim() && editText.trim() !== msg.message) {
      onSaveEdit?.(msg.id, editText.trim());
    } else {
      onCancelEdit?.();
    }
  }, [editText, msg.id, msg.message, onSaveEdit, onCancelEdit]);

  const handleEditKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSaveEdit();
      } else if (e.key === 'Escape') {
        onCancelEdit?.();
      }
    },
    [handleSaveEdit, onCancelEdit]
  );

  // System message rendering (Question of the Day, announcements)
  if (isSystem) {
    const isQOTD = msg.metadata?.type === 'question_of_the_day';
    return (
      <div className="chat-message chat-message--system">
        <div className="chat-message__system-badge">
          <span className="chat-message__system-icon">P</span>
          <span className="chat-message__system-label">Philosify</span>
          {isQOTD && (
            <span className="chat-message__system-tag">
              {t('community.agora.questionOfTheDay')}
            </span>
          )}
        </div>
        <div className="chat-message__system-body">{msg.message}</div>
        {isQOTD && msg.metadata?.analysis_id && (
          <a
            className="chat-message__system-link"
            href={`/?analysis=${msg.metadata.analysis_id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('community.agora.viewAnalysis')}
          </a>
        )}
        <span className="chat-message__system-time">{time}</span>
      </div>
    );
  }

  return (
    <div className={`chat-message ${isOwn ? 'chat-message--own' : 'chat-message--other'}`}>
      {/* Action bar - visible on hover */}
      {!isEditing && (
        <MessageActions
          isOwn={isOwn}
          onReply={handleReply}
          onEdit={handleEdit}
          onCopy={handleCopy}
          onDelete={handleDelete}
        />
      )}

      {/* Reply preview - shows what message this is replying to */}
      {msg.reply_preview && (
        <div className="chat-msg-reply-preview">
          <span className="chat-msg-reply-author">{msg.reply_preview.senderName}</span>
          <span className="chat-msg-reply-text">{msg.reply_preview.message}</span>
        </div>
      )}

      <div className="chat-message__header">
        <span
          className={`chat-message__name ${!isOwn && onUserClick ? 'chat-message__name--clickable' : ''}`}
          onClick={handleNameClick}
          role={!isOwn && onUserClick ? 'button' : undefined}
          tabIndex={!isOwn && onUserClick ? 0 : undefined}
        >
          {msg.display_name}
        </span>
        <span className="chat-message__time">{time}</span>
        {msg.edited_at && <span className="chat-msg-edited">{t('community.dm.edited')}</span>}
      </div>

      <div className="chat-message__bubble">
        {isEditing ? (
          <div className="chat-msg-edit-container">
            <textarea
              className="chat-msg-edit-input"
              value={editText}
              onChange={(e) => setEditText(e.target.value.slice(0, 500))}
              onKeyDown={handleEditKeyDown}
              maxLength={500}
              autoFocus
            />
            <div className="chat-msg-edit-actions">
              <button
                className="chat-msg-edit-btn chat-msg-edit-btn--cancel"
                onClick={onCancelEdit}
              >
                {t('community.dm.cancel')}
              </button>
              <button
                className="chat-msg-edit-btn chat-msg-edit-btn--save"
                onClick={handleSaveEdit}
              >
                {t('community.dm.save')}
              </button>
            </div>
          </div>
        ) : (
          msg.message
        )}
      </div>

      {!isEditing && <TranslateButton text={msg.message} />}

      {/* Copy feedback toast */}
      {copyFeedback && <div className="chat-msg-copy-feedback">{t('community.dm.copied')}</div>}
    </div>
  );
}

export default ChatMessage;
