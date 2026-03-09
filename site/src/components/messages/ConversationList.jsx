// ConversationList - List of DM conversations (direct + group)
// Supports stacked avatars for groups, right-click/long-press for delete/leave
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmModal } from '../common/ConfirmModal.jsx';

function formatTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

/** Get display name for a conversation */
function getConversationName(conv, currentUserId) {
  if (conv.type === 'group') {
    return conv.name || conv.members?.map((m) => m.displayName).join(', ') || 'Group';
  }
  // Direct: show the other person's name
  const partner = conv.members?.find((m) => m.id !== currentUserId);
  return partner?.displayName || 'Unknown';
}

/** Get avatar initials for a conversation */
function getAvatarInitials(conv, currentUserId) {
  if (conv.type === 'group') {
    // Return first 2-3 members' initials
    const others = conv.members?.filter((m) => m.id !== currentUserId) || [];
    return others.slice(0, 3).map((m) => (m.displayName || '?')[0].toUpperCase());
  }
  // Direct: single initial of partner
  const partner = conv.members?.find((m) => m.id !== currentUserId);
  return [(partner?.displayName || '?')[0].toUpperCase()];
}

function ConversationItem({ conversation, currentUserId, onSelect, onDelete, isOnline, t }) {
  const [showDelete, setShowDelete] = useState(false);
  const name = getConversationName(conversation, currentUserId);
  const initials = getAvatarInitials(conversation, currentUserId);
  const isGroup = conversation.type === 'group';

  // Online status: for direct conversations, check if partner is online
  const partnerId = !isGroup && conversation.members?.find((m) => m.id !== currentUserId)?.id;
  const online = !isGroup && isOnline && partnerId ? isOnline(partnerId) : false;

  return (
    <div
      className={`dm-conversation ${conversation.unreadCount > 0 ? 'dm-conversation--unread' : ''}`}
      onClick={() => onSelect(conversation.id)}
      onContextMenu={(e) => {
        e.preventDefault();
        setShowDelete(true);
      }}
    >
      {/* Avatar(s) */}
      <div className={`dm-conversation__avatar ${isGroup ? 'dm-conversation__avatar--group' : ''}`}>
        {isGroup ? (
          initials.map((letter, i) => (
            <span key={i} className="dm-conversation__avatar-letter">
              {letter}
            </span>
          ))
        ) : (
          <>
            {initials[0]}
            {online && <span className="dm-conversation__online-dot" />}
          </>
        )}
      </div>

      <div className="dm-conversation__content">
        <div className="dm-conversation__header">
          <span className="dm-conversation__name">
            {isGroup && <span className="dm-conversation__group-icon">&#9679;&#9679;</span>}
            {name}
          </span>
          <span className="dm-conversation__time">{formatTime(conversation.lastMessageAt)}</span>
        </div>
        <div className="dm-conversation__preview">
          {conversation.lastMessage?.slice(0, 50)}
          {conversation.lastMessage?.length > 50 ? '...' : ''}
        </div>
      </div>

      {conversation.unreadCount > 0 && (
        <div className="dm-conversation__badge">{conversation.unreadCount}</div>
      )}

      {onDelete && (
        <button
          className="dm-conversation__delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowDelete(true);
          }}
          aria-label={isGroup ? t('community.dm.leaveGroup') : t('community.dm.deleteConversation')}
        >
          &times;
        </button>
      )}

      {showDelete && (
        <div className="dm-conversation__delete-overlay" onClick={(e) => e.stopPropagation()}>
          <button
            className="dm-conversation__delete-confirm"
            onClick={(e) => {
              e.stopPropagation();
              setShowDelete(false);
              onDelete(conversation.id, name, isGroup);
            }}
          >
            {isGroup ? t('community.dm.leaveGroup') : t('community.dm.deleteConversation')}
          </button>
          <button
            className="dm-conversation__delete-cancel"
            onClick={(e) => {
              e.stopPropagation();
              setShowDelete(false);
            }}
          >
            {t('community.dm.cancel')}
          </button>
        </div>
      )}
    </div>
  );
}

export function ConversationList({
  conversations,
  loading,
  error,
  currentUserId,
  onSelect,
  onRefresh,
  onDelete,
  onNewGroup,
  isOnline,
}) {
  const { t } = useTranslation();
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name, isGroup }

  const handleDeleteRequest = (id, name, isGroup) => {
    setDeleteTarget({ id, name, isGroup });
  };

  const confirmDelete = () => {
    if (deleteTarget && onDelete) {
      onDelete(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  return (
    <div className="dm-list">
      <div className="dm-list__header">
        <span className="dm-list__title">{t('community.dm.messagesTitle')}</span>
        <div className="dm-list__header-actions">
          {onNewGroup && (
            <button className="dm-list__new-group" onClick={onNewGroup}>
              + {t('community.dm.newGroup')}
            </button>
          )}
          <button className="dm-list__refresh" onClick={onRefresh} disabled={loading}>
            {loading ? '...' : t('community.dm.refresh')}
          </button>
        </div>
      </div>

      {error && <div className="dm-error">{error}</div>}

      <div className="dm-conversations">
        {loading && conversations.length === 0 && (
          <div className="dm-empty">{t('community.dm.loadingConversations')}</div>
        )}

        {!loading && conversations.length === 0 && (
          <div className="dm-empty">
            {t('community.dm.noConversations')}
            <br />
            {t('community.dm.noConversationsHint')}
          </div>
        )}

        {conversations.map((conv) => (
          <ConversationItem
            key={conv.id}
            conversation={conv}
            currentUserId={currentUserId}
            onSelect={onSelect}
            onDelete={onDelete ? handleDeleteRequest : null}
            isOnline={isOnline}
            t={t}
          />
        ))}
      </div>

      {/* Delete / Leave confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={
          deleteTarget?.isGroup
            ? t('community.dm.leaveGroupTitle')
            : t('community.dm.deleteConversationTitle')
        }
        message={
          deleteTarget?.isGroup
            ? t('community.dm.leaveGroupConfirm', { name: deleteTarget?.name || '' })
            : t('community.dm.deleteConversationConfirm', { name: deleteTarget?.name || '' })
        }
        confirmText={deleteTarget?.isGroup ? t('community.dm.leave') : t('community.dm.delete')}
        cancelText={t('community.dm.cancel')}
        confirmVariant="danger"
      />
    </div>
  );
}

export default ConversationList;
