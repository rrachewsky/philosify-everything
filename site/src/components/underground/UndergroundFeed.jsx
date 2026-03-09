// UndergroundFeed - Anonymous confessions feed with reactions
// Supports: reply, edit (own), copy, delete (own) via action bar
// Includes on-demand translate button on each post
import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUnderground } from '../../hooks/useUnderground.js';
import { TranslateButton } from '../common/TranslateButton.jsx';
import { ConfirmModal } from '../common/ConfirmModal.jsx';

const REACTIONS = [
  { key: 'fire', emoji: '\u{1F525}', label: 'Fire' },
  { key: 'think', emoji: '\u{1F914}', label: 'Think' },
  { key: 'heart', emoji: '\u{2764}\u{FE0F}', label: 'Heart' },
  { key: 'skull', emoji: '\u{1F480}', label: 'Skull' },
];

// Inline SVG icons (16x16)
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

function NicknameSetup({ onSubmit, loading, error, t }) {
  const [nickname, setNickname] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
  };

  return (
    <div className="underground-nickname-setup">
      <div className="underground-nickname-setup__header">
        <h3>{t('community.underground.chooseIdentity')}</h3>
        <p>{t('community.underground.chooseIdentityDesc')}</p>
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="underground-nickname-setup__input"
          value={nickname}
          onChange={(e) => setNickname(e.target.value.slice(0, 12))}
          placeholder={t('community.underground.nicknamePlaceholder')}
          minLength={3}
          maxLength={12}
          pattern="[a-zA-Z0-9]+"
          disabled={loading}
          autoFocus
        />
        <div className="underground-nickname-setup__hint">
          {t('community.underground.nicknameHint')}
        </div>
        {error && <div className="underground-nickname-setup__error">{error}</div>}
        <button
          type="submit"
          className="underground-nickname-setup__submit"
          disabled={nickname.trim().length < 3 || loading}
        >
          {loading
            ? t('community.underground.setting')
            : t('community.underground.enterUnderground')}
        </button>
      </form>
    </div>
  );
}

function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Get reaction count - supports both camelCase (API) and snake_case (realtime)
function getReactionCount(post, reactionKey) {
  const camelKey = `reaction${reactionKey.charAt(0).toUpperCase()}${reactionKey.slice(1)}`;
  const snakeKey = `reaction_${reactionKey}`;
  return post[camelKey] || post[snakeKey] || 0;
}

function UndergroundPost({
  post,
  isOwn,
  onReact,
  onDelete,
  onEdit,
  onReply,
  isEditing,
  onSaveEdit,
  onCancelEdit,
  t,
}) {
  const createdAt = post.createdAt || post.created_at;
  const editedAt = post.editedAt || post.edited_at;
  const replyPreview = post.replyPreview || post.reply_preview;
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [editText, setEditText] = useState(post.content || '');

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(post.content);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = post.content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    }
  }, [post.content]);

  const handleReply = useCallback(() => {
    onReply?.(post);
  }, [onReply, post]);

  const handleEdit = useCallback(() => {
    setEditText(post.content || '');
    onEdit?.(post);
  }, [onEdit, post]);

  const handleDelete = useCallback(() => {
    onDelete?.(post.id);
  }, [onDelete, post.id]);

  const handleSaveEdit = useCallback(() => {
    if (editText.trim() && editText.trim() !== post.content) {
      onSaveEdit?.(post.id, editText.trim());
    } else {
      onCancelEdit?.();
    }
  }, [editText, post.id, post.content, onSaveEdit, onCancelEdit]);

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

  return (
    <div className="underground-post">
      {/* Action bar */}
      {!isEditing && (
        <div
          className={`underground-post__actions ${isOwn ? 'underground-post__actions--own' : ''}`}
        >
          <button
            className="chat-msg-action"
            onClick={handleReply}
            title="Reply"
            aria-label="Reply"
          >
            <Icons.Reply />
          </button>
          {isOwn && (
            <button className="chat-msg-action" onClick={handleEdit} title="Edit" aria-label="Edit">
              <Icons.Edit />
            </button>
          )}
          <button className="chat-msg-action" onClick={handleCopy} title="Copy" aria-label="Copy">
            <Icons.Copy />
          </button>
          {isOwn && (
            <button
              className="chat-msg-action chat-msg-action--danger"
              onClick={handleDelete}
              title="Delete"
              aria-label="Delete"
            >
              <Icons.Delete />
            </button>
          )}
        </div>
      )}

      {/* Reply preview - shows what post this is replying to */}
      {replyPreview && (
        <div className="chat-msg-reply-preview">
          <span className="chat-msg-reply-author">{replyPreview.nickname}</span>
          <span className="chat-msg-reply-text">{replyPreview.content}</span>
        </div>
      )}

      <div className="underground-post__header">
        <span className="underground-post__nickname">{post.nickname || 'Anonymous'}</span>
        <span className="underground-post__time">{formatTime(createdAt)}</span>
        {editedAt && <span className="chat-msg-edited">{t('community.dm.edited')}</span>}
        {post.decryptionFailed && (
          <span className="underground-post__encrypted" title="Could not decrypt">
            [encrypted]
          </span>
        )}
      </div>

      {isEditing ? (
        <div className="chat-msg-edit-container">
          <textarea
            className="chat-msg-edit-input"
            value={editText}
            onChange={(e) => setEditText(e.target.value.slice(0, 1000))}
            onKeyDown={handleEditKeyDown}
            maxLength={1000}
            rows={3}
            autoFocus
          />
          <div className="chat-msg-edit-actions">
            <button className="chat-msg-edit-btn chat-msg-edit-btn--cancel" onClick={onCancelEdit}>
              {t('community.dm.cancel')}
            </button>
            <button className="chat-msg-edit-btn chat-msg-edit-btn--save" onClick={handleSaveEdit}>
              {t('community.dm.save')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="underground-post__content">{post.content}</div>
          <TranslateButton text={post.content} />
        </>
      )}

      <div className="underground-post__footer">
        <div className="underground-post__reactions">
          {REACTIONS.map((r) => {
            const count = getReactionCount(post, r.key);
            const isActive = (post.myReactions || []).includes(r.key);
            return (
              <button
                key={r.key}
                className={`underground-reaction ${isActive ? 'underground-reaction--active' : ''}`}
                onClick={() => onReact(post.id, r.key)}
                title={r.label}
              >
                <span className="underground-reaction__emoji">{r.emoji}</span>
                {count > 0 && <span className="underground-reaction__count">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Copy feedback toast */}
      {copyFeedback && <div className="chat-msg-copy-feedback">{t('community.dm.copied')}</div>}
    </div>
  );
}

export function UndergroundFeed() {
  const { t } = useTranslation();
  const {
    posts,
    loading,
    error,
    hasMore,
    posting,
    needsNickname,
    myNickname,
    settingNickname,
    createPost,
    editPost,
    toggleReaction,
    deletePost,
    loadMore,
    submitNickname,
    userId,
    editingPost,
    setEditingPost,
    replyingTo,
    setReplyingTo,
  } = useUnderground();

  const [newPost, setNewPost] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const feedRef = useRef(null);
  const textareaRef = useRef(null);

  // Focus textarea when replying
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const content = newPost.trim();
    if (!content || posting) return;

    try {
      await createPost(content, { replyToId: replyingTo?.id || null });
      setNewPost('');
    } catch {
      // Error handled in hook
    }
  };

  const handleDeleteRequest = useCallback((postId) => {
    setDeleteTarget(postId);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) {
      deletePost(deleteTarget);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deletePost]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const handleEditRequest = useCallback(
    (post) => {
      setEditingPost(post);
      setReplyingTo(null);
    },
    [setEditingPost, setReplyingTo]
  );

  const handleSaveEdit = useCallback(
    (postId, newContent) => {
      editPost(postId, newContent);
    },
    [editPost]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingPost(null);
  }, [setEditingPost]);

  const handleReply = useCallback(
    (post) => {
      setReplyingTo(post);
      setEditingPost(null);
    },
    [setReplyingTo, setEditingPost]
  );

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, [setReplyingTo]);

  // Show nickname setup if needed
  if (needsNickname) {
    return (
      <div className="underground-feed">
        <NicknameSetup onSubmit={submitNickname} loading={settingNickname} error={error} t={t} />
      </div>
    );
  }

  return (
    <div className="underground-feed">
      {/* Show current nickname */}
      {myNickname && (
        <div className="underground-identity">
          {t('community.underground.postingAs')}{' '}
          <span className="underground-identity__nickname">{myNickname}</span>
        </div>
      )}

      {/* Reply bar above input */}
      {replyingTo && (
        <div className="chat-reply-bar">
          <div className="chat-reply-bar__info">
            <span className="chat-reply-bar__label">{t('community.dm.replyingTo')}</span>
            <span className="chat-reply-bar__author">{replyingTo.nickname}</span>
            <span className="chat-reply-bar__text">
              {(replyingTo.content || '').slice(0, 80)}
              {(replyingTo.content || '').length > 80 ? '...' : ''}
            </span>
          </div>
          <button
            className="chat-reply-bar__cancel"
            onClick={handleCancelReply}
            aria-label="Cancel reply"
          >
            &times;
          </button>
        </div>
      )}

      {/* Post input */}
      <form className="underground-input" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className="underground-input__textarea"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value.slice(0, 1000))}
          placeholder={
            replyingTo ? t('community.dm.typeReply') : t('community.underground.postPlaceholder')
          }
          maxLength={1000}
          rows={3}
          disabled={posting}
        />
        <div className="underground-input__footer">
          <span className="underground-input__charcount">{newPost.length}/1000</span>
          <button
            type="submit"
            className="underground-input__submit"
            disabled={!newPost.trim() || posting}
          >
            {posting
              ? t('community.underground.posting')
              : t('community.underground.postAnonymously')}
          </button>
        </div>
      </form>

      {/* Error display */}
      {error && <div className="underground-error">{error}</div>}

      {/* Posts feed */}
      <div className="underground-posts" ref={feedRef}>
        {posts.length === 0 && !loading && (
          <div className="underground-empty">{t('community.underground.noConfessions')}</div>
        )}

        {posts.map((post) => {
          // Own post detection: supports both camelCase (API) and snake_case (realtime)
          const postUserId = post.userId || post.user_id;
          const isOwn = postUserId === userId;
          return (
            <UndergroundPost
              key={post.id}
              post={post}
              isOwn={isOwn}
              onReact={toggleReaction}
              onDelete={handleDeleteRequest}
              onEdit={handleEditRequest}
              onReply={handleReply}
              isEditing={editingPost?.id === post.id}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              t={t}
            />
          );
        })}

        {hasMore && posts.length > 0 && (
          <button className="underground-load-more" onClick={loadMore} disabled={loading}>
            {loading ? t('community.agora.loading') : t('community.underground.loadMore')}
          </button>
        )}

        {loading && posts.length === 0 && (
          <div className="underground-loading">{t('community.underground.loadingConfessions')}</div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t('community.underground.deleteTitle')}
        message={t('community.underground.deleteConfirm')}
        confirmText={t('community.dm.delete')}
        cancelText={t('community.dm.cancel')}
        confirmVariant="danger"
      />
    </div>
  );
}

export default UndergroundFeed;
