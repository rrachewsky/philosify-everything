// AnalysisDiscussion - View analysis details and comment thread
// Shows analysis info at top with 2-level threaded comments below
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { collectiveService } from '../../services/api/collective.js';
import * as cryptoService from '@/services/crypto';
import { useAuth } from '../../hooks/useAuth.js';
import { getRealtimeClient, waitForAuth } from '../../services/realtime.js';
import { CommentThread } from './CommentThread.jsx';
import { ConfirmModal } from '../common/ConfirmModal.jsx';

const MAX_COMMENT_LENGTH = 2000;

// Calculate philosophical note (1-10) from weighted score (-10 to +10)
function calculatePhilosophicalNote(finalScore) {
  if (finalScore === undefined || finalScore === null) return null;
  if (finalScore >= 8.1) return 10;
  if (finalScore >= 6.1) return 9;
  if (finalScore >= 4.1) return 8;
  if (finalScore >= 2.1) return 7;
  if (finalScore >= 0.1) return 6;
  if (finalScore >= -2.0) return 5;
  if (finalScore >= -4.0) return 4;
  if (finalScore >= -6.0) return 3;
  if (finalScore >= -8.0) return 2;
  return 1;
}

export function AnalysisDiscussion({ collectiveAnalysisId, onBack, onUserClick }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState(null);
  const [groupId, setGroupId] = useState(null); // For E2E encryption
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // { id, displayName }
  const [deleteTarget, setDeleteTarget] = useState(null); // commentId to delete
  const channelRef = useRef(null);
  const clientRef = useRef(null);

  // Load analysis and comments (with E2E decryption)
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await collectiveService.getComments(collectiveAnalysisId);
      setAnalysis(data.analysis);
      setGroupId(data.analysis?.group_id || null); // Store for encryption
      setComments(data.comments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [collectiveAnalysisId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime: comentários ao vivo no tópico privado do grupo (padrão useUnderground).
  // A trigger AFTER INSERT em collective_comments emite 'new-comment' (snake_case) para
  // 'collective:<groupId>'; AFTER DELETE emite 'comment-deleted'. O tópico é por grupo,
  // então filtramos por collective_analysis_id. Sem re-fetch: só estado local.
  useEffect(() => {
    if (!groupId || !collectiveAnalysisId) return;

    let cancelled = false;

    async function initRealtime() {
      try {
        await waitForAuth(); // token antes de assinar canal privado
        if (cancelled) return;

        const sb = await getRealtimeClient();
        if (cancelled) return;
        clientRef.current = sb;

        const channel = sb
          .channel(`collective:${groupId}`, { config: { private: true } })
          .on('broadcast', { event: 'new-comment' }, async ({ payload }) => {
            if (!payload || payload.collective_analysis_id !== collectiveAnalysisId) return;

            // Mapeia snake_case da trigger para o shape que CommentThread consome
            const incoming = {
              id: payload.id,
              userId: payload.user_id,
              parentId: payload.parent_id,
              displayName: payload.display_name,
              isEncrypted: !!payload.is_encrypted,
              encryptedContent: payload.is_encrypted ? payload.encrypted_content : null,
              nonce: payload.is_encrypted ? payload.nonce : null,
              createdAt: payload.created_at,
              isMine: !!user?.id && payload.user_id === user.id,
              content: payload.is_encrypted ? null : payload.content,
            };

            // E2E: payload traz só ciphertext — decripta aqui (mesma função do serviço)
            if (incoming.isEncrypted) {
              const decrypted = await cryptoService.decryptCollectiveMessage(
                incoming.encryptedContent,
                incoming.nonce,
                groupId
              );
              if (decrypted) {
                incoming.content = decrypted;
                incoming.decrypted = true;
              } else {
                incoming.content = '[Unable to decrypt]';
                incoming.decryptionFailed = true;
              }
            }
            if (cancelled) return;

            setComments((prev) => {
              if (prev.some((c) => c.id === incoming.id)) return prev; // eco do remetente
              return [...prev, incoming];
            });
          })
          .on('broadcast', { event: 'comment-deleted' }, ({ payload }) => {
            if (!payload || payload.collective_analysis_id !== collectiveAnalysisId) return;
            setComments((prev) =>
              prev.filter((c) => c.id !== payload.id && c.parentId !== payload.id)
            );
          })
          .subscribe((status, err) => {
            console.log(
              '[AnalysisDiscussion] Subscription status:',
              status,
              err ? `error: ${err.message}` : ''
            );
          });

        channelRef.current = channel;
      } catch (err) {
        console.error('[AnalysisDiscussion] Realtime init error:', err);
      }
    }

    initRealtime();

    return () => {
      cancelled = true;
      if (channelRef.current && clientRef.current) {
        clientRef.current.removeChannel(channelRef.current);
      }
      channelRef.current = null;
    };
  }, [groupId, collectiveAnalysisId, user?.id]);

  // Submit a new comment or reply (with E2E encryption)
  const handleSubmit = async () => {
    const content = newComment.trim();
    if (!content || sending) return;

    setSending(true);
    setError(null);

    try {
      const parentId = replyingTo?.id || null;
      // Pass groupId for E2E encryption
      const { comment } = await collectiveService.addComment(
        collectiveAnalysisId,
        content,
        parentId,
        groupId
      );

      // Add to comments list (set content since we just wrote it)
      const newCommentObj = {
        ...comment,
        content: content, // Use original content, not encrypted placeholder
      };
      setComments((prev) => [...prev, newCommentObj]);
      setNewComment('');
      setReplyingTo(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  // Delete a comment
  const handleDelete = async (commentId) => {
    setDeleteTarget(commentId);
  };

  const confirmDelete = async () => {
    const commentId = deleteTarget;
    setDeleteTarget(null);
    try {
      await collectiveService.deleteComment(commentId);
      // Remove from list (and any replies if it was a parent)
      setComments((prev) => prev.filter((c) => c.id !== commentId && c.parentId !== commentId));
    } catch (err) {
      setError(err.message);
    }
  };

  // Start replying to a comment
  const handleReply = (commentId, displayName) => {
    setReplyingTo({ id: commentId, displayName });
    // Focus the input (in case it's not visible)
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null);
  };

  // WP6.2: score traffic-light colors removed — the Philosophical Note
  // numeral renders silver via CSS (Design Law §2.3, one per region).

  if (loading) {
    return (
      <div className="analysis-discussion">
        <div className="analysis-discussion__header">
          <button className="analysis-discussion__back" onClick={onBack}>
            &larr; {t('community.collective.back')}
          </button>
        </div>
        <div className="analysis-discussion__loading">{t('community.discussion.loading')}</div>
      </div>
    );
  }

  if (error && !analysis) {
    return (
      <div className="analysis-discussion">
        <div className="analysis-discussion__header">
          <button className="analysis-discussion__back" onClick={onBack}>
            &larr; {t('community.collective.back')}
          </button>
        </div>
        <div className="analysis-discussion__error">{error}</div>
      </div>
    );
  }

  return (
    <div className="analysis-discussion">
      {/* Header */}
      <div className="analysis-discussion__header">
        <button className="analysis-discussion__back" onClick={onBack}>
          &larr;
        </button>
        <span className="analysis-discussion__title">{t('community.discussion.title')}</span>
      </div>

      {/* Analysis summary */}
      {analysis && (
        <div className="analysis-discussion__summary">
          <div className="analysis-discussion__song-row">
            <span className="analysis-discussion__score">
              {analysis.score != null ? calculatePhilosophicalNote(analysis.score) : '?'}
            </span>
            <span className="analysis-discussion__song">{analysis.song_name}</span>
          </div>
          {analysis.schools && analysis.schools.length > 0 && (
            <div className="analysis-discussion__schools">
              {analysis.schools.slice(0, 4).map((school, i) => (
                <span key={i} className="analysis-discussion__school-tag">
                  {school}
                </span>
              ))}
            </div>
          )}
          {analysis.verdict_snippet && (
            <div className="analysis-discussion__verdict">{analysis.verdict_snippet}</div>
          )}
        </div>
      )}

      {/* Error toast */}
      {error && <div className="analysis-discussion__error-toast">{error}</div>}

      {/* Comment thread */}
      <div className="analysis-discussion__comments">
        <CommentThread
          comments={comments}
          onReply={handleReply}
          onDelete={handleDelete}
          onUserClick={onUserClick}
        />
      </div>

      {/* Comment input */}
      <div className="analysis-discussion__input">
        {replyingTo && (
          <div className="analysis-discussion__replying">
            {t('community.discussion.replyingTo')} <strong>{replyingTo.displayName}</strong>
            <button onClick={cancelReply}>&times;</button>
          </div>
        )}
        <textarea
          className="analysis-discussion__textarea"
          placeholder={
            replyingTo
              ? t('community.discussion.replyPlaceholder')
              : t('community.discussion.sharePlaceholder')
          }
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          maxLength={MAX_COMMENT_LENGTH}
          rows={3}
        />
        <div className="analysis-discussion__input-footer">
          <span className="analysis-discussion__charcount">
            {newComment.length}/{MAX_COMMENT_LENGTH}
          </span>
          <button
            className="analysis-discussion__submit"
            onClick={handleSubmit}
            disabled={!newComment.trim() || sending}
          >
            {sending
              ? t('community.discussion.sending')
              : replyingTo
                ? t('community.discussion.reply')
                : t('community.discussion.comment')}
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={t('community.discussion.deleteTitle')}
        message={t('community.discussion.deleteConfirm')}
        confirmText={t('community.dm.delete')}
        cancelText={t('community.dm.cancel')}
        confirmVariant="danger"
      />
    </div>
  );
}

export default AnalysisDiscussion;
