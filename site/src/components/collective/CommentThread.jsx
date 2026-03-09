// CommentThread - Renders 2-level threaded comments
// Top-level comments with nested replies (max 1 level deep)
// Supports E2E encrypted comments (decryption happens in service layer)
// Click on display name to start DM (except your own)
// Includes on-demand translate button on each comment
import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TranslateButton } from '../common/TranslateButton.jsx';

export function CommentThread({ comments, onReply, onDelete, onUserClick }) {
  const { t } = useTranslation();

  // Structure comments into a tree (2 levels only)
  // API returns camelCase: parentId, displayName, createdAt
  const structuredComments = useMemo(() => {
    const topLevel = [];
    const replyMap = new Map(); // parentId -> replies[]

    comments.forEach((comment) => {
      if (!comment.parentId) {
        topLevel.push(comment);
      } else {
        if (!replyMap.has(comment.parentId)) {
          replyMap.set(comment.parentId, []);
        }
        replyMap.get(comment.parentId).push(comment);
      }
    });

    // Attach replies to their parents
    return topLevel.map((parent) => ({
      ...parent,
      replies: replyMap.get(parent.id) || [],
    }));
  }, [comments]);

  // Format relative time
  const formatTime = useCallback(
    (timestamp) => {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (mins < 1) return t('community.discussion.justNow');
      if (mins < 60) return t('community.discussion.minutesAgo', { count: mins });
      if (hours < 24) return t('community.discussion.hoursAgo', { count: hours });
      if (days < 7) return t('community.discussion.daysAgo', { count: days });
      return date.toLocaleDateString();
    },
    [t]
  );

  // Handle name click to start DM
  const handleNameClick = useCallback(
    (comment) => {
      if (!onUserClick || comment.isMine) return;
      if (comment.userId) {
        onUserClick(comment.userId, comment.displayName);
      }
    },
    [onUserClick]
  );

  if (structuredComments.length === 0) {
    return (
      <div className="comment-thread">
        <div className="comment-thread__empty">{t('community.discussion.noComments')}</div>
      </div>
    );
  }

  return (
    <div className="comment-thread">
      {structuredComments.map((comment) => (
        <div key={comment.id} className="comment">
          {/* Top-level comment */}
          <div className="comment__main">
            <div className="comment__header">
              <span
                className={`comment__author ${!comment.isMine && onUserClick && comment.userId ? 'comment__author--clickable' : ''}`}
                onClick={() => handleNameClick(comment)}
                role={!comment.isMine && onUserClick && comment.userId ? 'button' : undefined}
                tabIndex={!comment.isMine && onUserClick && comment.userId ? 0 : undefined}
              >
                {comment.displayName}
              </span>
              <span className="comment__time">{formatTime(comment.createdAt)}</span>
              {comment.decryptionFailed && (
                <span className="comment__encrypted-badge" title="Could not decrypt">
                  [encrypted]
                </span>
              )}
            </div>
            <div className="comment__content">{comment.content}</div>
            <TranslateButton text={comment.content} />
            <div className="comment__actions">
              <button
                className="comment__reply-btn"
                onClick={() => onReply(comment.id, comment.displayName)}
              >
                {t('community.discussion.reply')}
              </button>
              {comment.isMine && (
                <button className="comment__delete-btn" onClick={() => onDelete(comment.id)}>
                  {t('community.dm.deleteMessage')}
                </button>
              )}
            </div>
          </div>

          {/* Replies (nested) */}
          {comment.replies.length > 0 && (
            <div className="comment__replies">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="comment comment--reply">
                  <div className="comment__main">
                    <div className="comment__header">
                      <span
                        className={`comment__author ${!reply.isMine && onUserClick && reply.userId ? 'comment__author--clickable' : ''}`}
                        onClick={() => handleNameClick(reply)}
                        role={!reply.isMine && onUserClick && reply.userId ? 'button' : undefined}
                        tabIndex={!reply.isMine && onUserClick && reply.userId ? 0 : undefined}
                      >
                        {reply.displayName}
                      </span>
                      <span className="comment__time">{formatTime(reply.createdAt)}</span>
                      {reply.decryptionFailed && (
                        <span className="comment__encrypted-badge" title="Could not decrypt">
                          [encrypted]
                        </span>
                      )}
                    </div>
                    <div className="comment__content">{reply.content}</div>
                    <TranslateButton text={reply.content} />
                    <div className="comment__actions">
                      {reply.isMine && (
                        <button className="comment__delete-btn" onClick={() => onDelete(reply.id)}>
                          {t('community.dm.deleteMessage')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default CommentThread;
