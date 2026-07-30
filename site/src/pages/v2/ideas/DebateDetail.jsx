// DebateDetail - v2 user-debate thread view (replies, votes, invites,
// wrap-up verdict + wrap-up audio). Flows ported from DebatePanel's
// debate detail (WP3 parity).
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { config } from '@/config';
import { Button, Pill, Telemetry } from '../../../components/v2';
import { ShareButton } from '../../../components/sharing/ShareButton.jsx';
import { TranslateButton } from '../../../components/common/TranslateButton.jsx';
import InlineAdSlot from '../../../components/ads/InlineAdSlot.jsx';
import { ReplyMsg } from './Transcript.jsx';
import { InviteModal, ConfirmModal } from './IdeasModals.jsx';
import { VerdictAudio } from './VerdictAudio.jsx';
import { formatTimeAgo, formatChrono, useChronometer, chronoProgress } from './utils.js';

export function DebateDetail({ debate, lang, user, onBack }) {
  const { t, i18n } = useTranslation();
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const wrapupElapsed = useChronometer(debate.wrapupLoading);
  const ad = debate.activeDebate;

  const handleReply = useCallback(async () => {
    if (!replyText.trim() || replying) return;
    setReplying(true);
    const reply = await debate.addReply(replyText.trim());
    if (reply) setReplyText('');
    setReplying(false);
  }, [debate, replyText, replying]);

  const handleReplyKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleReply();
    }
  };

  if (!ad) return null;
  const isEnded = !!debate.wrapup;

  return (
    <section className="detail">
      <div className="dhead">
        <a className="dback" onClick={onBack} role="button" tabIndex={0}>
          ← {t('v2.ideas.backToFeed', 'All debates')}
        </a>
        <span className="dactions">
          <a onClick={() => setShowInvite(true)} role="button" tabIndex={0}>
            {t('v2.ideas.invite', 'Invite')}
          </a>
          {ad.isOwner && (
            <a
              onClick={() => setConfirmDelete({ type: 'debate', id: ad.id })}
              role="button"
              tabIndex={0}
            >
              {t('v2.ideas.deleteDebate', 'Delete')}
            </a>
          )}
        </span>
      </div>

      <h2 className="dtitle">{ad.title}</h2>
      <div className="dmeta">
        <Pill>{t('v2.ideas.debateTag', 'DEBATE')}</Pill>
        <Pill>{isEnded ? t('v2.ideas.statusArchived', 'Archived') : t('v2.ideas.statusActive', 'Active')}</Pill>
      </div>

      {/* Original post */}
      <div className="cell qcell">
        <h2>
          {t('v2.ideas.openedBy', { defaultValue: 'Opened by {{name}}', name: ad.author })} ·{' '}
          {formatTimeAgo(ad.created_at, t)}
        </h2>
        {ad.content && <div className="prose">{ad.content}</div>}
        <TranslateButton text={(ad.title || '') + (ad.content ? '\n\n' + ad.content : '')} />
      </div>

      {/* Replies: own arguments right, others left */}
      <div className="iwell">
        {debate.loading && debate.replies.length === 0 && (
          <div className="mnote">{t('v2.ideas.loading', 'Loading…')}</div>
        )}
        {!debate.loading && debate.replies.length === 0 && (
          <div className="mnote">
            {t('v2.ideas.noReplies', 'No arguments yet. Be the first to weigh in!')}
          </div>
        )}
        {debate.replies.map((reply) => (
          <ReplyMsg
            key={reply.id}
            reply={reply}
            isYou={!!reply.isOwner}
            onVote={debate.voteReply}
            onDelete={(replyId) => setConfirmDelete({ type: 'reply', id: replyId })}
            onEdit={() => {}}
            t={t}
            isColloquium={false}
            lang={lang}
            hasVerdict={isEnded}
          />
        ))}
      </div>

      {/* Wrap-up — after all replies so the debate reads first */}
      {debate.wrapup ? (
        <div className="verdict">
          <span className="vlabel">{t('v2.ideas.wrapupTitle', 'Philosify verdict')}</span>
          {debate.wrapupAudioUrl && <VerdictAudio threadId={ad.id} />}
          {!debate.wrapupAudioUrl && ad.isOwner && (
            <div className="arow">
              <Button
                variant="secondary"
                className="sbtn"
                onClick={debate.requestWrapup}
                disabled={debate.wrapupLoading}
              >
                {debate.wrapupLoading
                  ? t('v2.ideas.requestingWrapup', 'Analyzing debate…')
                  : t('v2.ideas.retryAudio', 'Generate audio')}
              </Button>
            </div>
          )}
          <div className="prose vprose">{debate.wrapup}</div>
          <TranslateButton text={debate.wrapup} />
          <ShareButton
            shareUrl={`${config.apiUrl}/api/share-preview/debate/${ad.id}?lang=${i18n.resolvedLanguage || i18n.language}`}
            shareText={t('share.shareDebateText', {
              title: ad.title || t('v2.ideas.wrapupTitle', 'Philosify verdict'),
            })}
          />
        </div>
      ) : debate.wrapupLoading ? (
        <Telemetry
          label={t('v2.ideas.requestingWrapup', 'Analyzing debate…')}
          time={formatChrono(wrapupElapsed)}
          progress={chronoProgress(wrapupElapsed)}
        />
      ) : (
        ad.isOwner && (
          <div className="arow wrapcta">
            <Button variant="secondary" className="sbtn" onClick={debate.requestWrapup}>
              {t('v2.ideas.wrapUp', 'Close with the verdict')}
            </Button>
            <span className="mnote">
              {t(
                'v2.ideas.wrapupDescription',
                'Get a philosophical summary and verdict for this debate — free.'
              )}
            </span>
          </div>
        )
      )}

      {debate.error && <div className="ierr">{debate.error}</div>}

      {/* Sponsored slot while the verdict generates (parity) */}
      {debate.wrapupLoading && (
        <InlineAdSlot
          key={`ideas-debate-${ad.id}-${Number(debate.wrapupLoading)}`}
          userId={user?.id}
          placement="constellation"
          layout="banner"
          refreshKey={`ideas-debate-${ad.id}-${Number(debate.wrapupLoading)}`}
          className="debate-footer-ad"
        />
      )}

      {/* Reply entry */}
      {!debate.wrapup && (
        <div className="abar">
          <div className="entry">
            <textarea
              className="f"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value.slice(0, 3000))}
              onKeyDown={handleReplyKeyDown}
              placeholder={t('v2.ideas.writeArgument', 'Write your argument…')}
              maxLength={3000}
              rows={2}
              disabled={replying}
            />
            <Button onClick={handleReply} disabled={!replyText.trim() || replying}>
              {replying ? '…' : t('v2.ideas.post', 'Post')}
            </Button>
          </div>
        </div>
      )}

      {/* Invite modal */}
      {showInvite && (
        <InviteModal
          threadId={ad.id}
          threadTitle={ad.title}
          type="debate"
          onClose={() => setShowInvite(false)}
        />
      )}

      {/* Delete confirmations */}
      {confirmDelete && (
        <ConfirmModal
          text={
            confirmDelete.type === 'debate'
              ? t(
                  'v2.ideas.confirmDeleteDebate',
                  'Are you sure you want to delete this debate? This cannot be undone.'
                )
              : t('v2.ideas.confirmDeleteReply', 'Are you sure you want to delete this reply?')
          }
          onClose={() => setConfirmDelete(null)}
          onConfirm={async () => {
            const { type, id } = confirmDelete;
            setConfirmDelete(null);
            if (type === 'debate') {
              await debate.deleteDebate(id);
              onBack();
            } else {
              await debate.deleteReply(id);
            }
          }}
        />
      )}
    </section>
  );
}

export default DebateDetail;
