// ColloquiumDetail - v2 colloquium session view (in-character transcript,
// access/participate/add-philosopher/poll-vote/verdict + verdict audio).
// All flows ported from DebatePanel's colloquium detail (WP3 parity).
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { config } from '@/config';
import { getLocalizedContent } from '../../../hooks/useColloquium.js';
import { Button, Pill, Telemetry } from '../../../components/v2';
import { ShareButton } from '../../../components/sharing/ShareButton.jsx';
import InlineAdSlot from '../../../components/ads/InlineAdSlot.jsx';
import { ReplyMsg, PhilosopherPoll } from './Transcript.jsx';
import { AddPhilosopherModal, InviteModal, ConfirmModal } from './IdeasModals.jsx';
import { VerdictAudio } from './VerdictAudio.jsx';
import { formatTimeAgo, formatCountdown, formatChrono, useChronometer, chronoProgress } from './utils.js';

export function ColloquiumDetail({ coll, user, onBack, requireCredits }) {
  const { t, i18n } = useTranslation();

  const [showAddPhilosopher, setShowAddPhilosopher] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [philosopherToast, setPhilosopherToast] = useState(null);
  const philosopherToastRef = useRef(null);

  // Countdown timer for the Type 2 verdict window
  const [countdown, setCountdown] = useState(null);
  const countdownRef = useRef(null);

  const verdictElapsed = useChronometer(coll.verdictLoading);

  const ac = coll.activeColloquium;

  useEffect(() => {
    const verdictAt =
      ac?.metadata?.auto_verdict_at || ac?.metadata?.verdict_at || ac?.verdict_at;
    if (!verdictAt || ac?.wrapup || ac?.has_verdict) {
      setCountdown(null);
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }
    const update = () => {
      const cd = formatCountdown(verdictAt);
      setCountdown(cd);
      if (!cd && countdownRef.current) clearInterval(countdownRef.current);
    };
    update();
    countdownRef.current = setInterval(update, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [ac]);

  // Load roster when the add-philosopher modal opens
  useEffect(() => {
    if (showAddPhilosopher && coll.roster.length === 0) {
      coll.loadRoster();
    }
  }, [showAddPhilosopher]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup toast timer on unmount
  useEffect(() => {
    return () => clearTimeout(philosopherToastRef.current);
  }, []);

  // ─── Derived state (parity with DebatePanel) ──────────────
  const needsAccess = ac._needsAccess;
  const hasAccess = coll.accessState?.hasAccess;
  const canParticipate = coll.accessState?.canParticipate;
  const isProposer = coll.accessState?.isProposer;
  const hasVerdict = !!ac.wrapup || ac.has_verdict;
  const collType = ac.metadata?.colloquium_type || ac.colloquium_type || 'daily';
  const isDaily = collType === 'daily';
  const isOpenDebate = collType === 'open_debate';
  const generationFailed = !!ac.metadata?.generation_failed;
  const nextPhilAt = ac.metadata?.next_philosopher_at;
  const staleRef = nextPhilAt
    ? new Date(nextPhilAt).getTime()
    : ac.created_at
      ? new Date(ac.created_at).getTime()
      : 0;
  const staleThreshold = nextPhilAt ? 10 * 60 * 1000 : 30 * 60 * 1000;
  const generationStale = staleRef > 0 && Date.now() - staleRef > staleThreshold; // eslint-disable-line react-hooks/purity -- one-time derived value
  const allPhilosOnPanel = ac.metadata?.philosophers || ac.philosophers || [];
  const philReplies = (coll.replies || []).filter((r) => r.is_philosopher);
  const allPhilosHaveSpoken =
    allPhilosOnPanel.length > 0 &&
    allPhilosOnPanel.every((name) =>
      philReplies.some(
        (r) =>
          r.philosopher_name === name &&
          (!r.metadata?.reply_type || r.metadata?.reply_type === 'initial')
      )
    );
  const generationReady = allPhilosHaveSpoken;
  const generationNeedsRetry = generationFailed || (generationStale && !allPhilosHaveSpoken);
  const isPrivate = (ac.metadata?.visibility || ac.visibility) === 'closed';
  const canInviteColloquium = isPrivate ? isProposer : hasAccess;
  const autoVerdictAt = ac.metadata?.auto_verdict_at || ac.metadata?.verdict_at || ac.verdict_at;
  const PICKER_CUTOFF_MS = 15 * 60 * 1000;
  const pickerDeadline = autoVerdictAt
    ? new Date(new Date(autoVerdictAt).getTime() - PICKER_CUTOFF_MS)
    : null;
  const pickerOpen = !hasVerdict && (!pickerDeadline || new Date() < pickerDeadline);
  const minutesUntilPickerClose = pickerDeadline
    ? Math.max(0, Math.ceil((pickerDeadline - Date.now()) / 60000)) // eslint-disable-line react-hooks/purity -- one-time derived value (parity with DebatePanel)
    : null;
  const philosophers = ac.metadata?.philosophers || ac.philosophers || [];
  const prices = ac.metadata?.philosopher_prices || ac.philosopher_prices || {};
  const userAddedPhilosophers = new Set(ac.metadata?.user_added_philosophers || []);

  const localizedTitle = getLocalizedContent(
    ac.metadata?.translations?.title || ac.translations?.title,
    coll.lang,
    ac.title
  );
  const localizedContent = getLocalizedContent(
    ac.metadata?.translations?.content || ac.translations?.content,
    coll.lang,
    ac.content
  );
  const localizedWrapup = getLocalizedContent(
    ac.metadata?.translations?.wrapup || ac.translations?.wrapup,
    coll.lang,
    ac.wrapup
  );

  const verdictAudioEndpoint = ac.wrapup
    ? `${config.apiUrl}/api/colloquium/${ac.id}/verdict-audio?lang=${coll.lang?.split('-')[0] || 'en'}`
    : null;

  // Participation cost: daily = 1, open_debate = 1, user_proposed = 2
  const participateCost = isOpenDebate || isDaily ? 1 : 2;

  const spokenCount = Math.min(
    philReplies
      .filter((r) => !r.metadata?.reply_type || r.metadata?.reply_type === 'initial')
      .map((r) => r.philosopher_name)
      .filter((v, i, a) => a.indexOf(v) === i).length,
    allPhilosOnPanel.length
  );

  // ─── Handlers ─────────────────────────────────────────────
  const handleUnlockAccess = useCallback(() => {
    if (!requireCredits(1, { type: 'colloquium:access', threadId: ac.id })) return;
    coll.unlockAccess(ac.id);
  }, [coll, ac.id, requireCredits]);

  const handleUnlockParticipation = useCallback(() => {
    if (!requireCredits(participateCost, { type: 'colloquium:participate', threadId: ac.id }))
      return;
    coll.unlockParticipation(ac.id);
  }, [coll, ac.id, participateCost, requireCredits]);

  const handleAddPhilosopher = useCallback(
    async (philosopherName) => {
      const price = coll.roster.find((p) => p.name === philosopherName)?.price || 2;
      if (
        !requireCredits(price, {
          type: 'colloquium:addPhilosopher',
          threadId: ac.id,
          philosopher: philosopherName,
        })
      ) {
        setShowAddPhilosopher(false);
        return;
      }
      const result = await coll.addPhilosopher(ac.id, philosopherName);
      if (result?.success) {
        setShowAddPhilosopher(false);
        clearTimeout(philosopherToastRef.current);
        setPhilosopherToast(philosopherName);
        philosopherToastRef.current = setTimeout(() => setPhilosopherToast(null), 4000);
      } else if (result?.code === 'INSUFFICIENT_CREDITS') {
        setShowAddPhilosopher(false);
      }
    },
    [coll, ac.id, requireCredits]
  );

  const handleReply = useCallback(async () => {
    if (!replyText.trim() || replying) return;
    setReplying(true);
    const reply = await coll.addReply(replyText.trim());
    if (reply) setReplyText('');
    setReplying(false);
  }, [coll, replyText, replying]);

  const handleReplyKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleReply();
    }
  };

  const typeLabel = isOpenDebate
    ? t('v2.ideas.badgeOpenDebate', 'Open debate')
    : isDaily
      ? t('v2.ideas.badgeDaily', 'Daily by the system')
      : t('v2.ideas.badgeUser', 'Proposed by a user');

  return (
    <section className="detail">
      {/* Header row: back + chrome actions */}
      <div className="dhead">
        <a className="dback" onClick={onBack} role="button" tabIndex={0}>
          ← {t('v2.ideas.backToFeed', 'All debates')}
        </a>
        <span className="dactions">
          {canInviteColloquium && (
            <a onClick={() => setShowInvite(true)} role="button" tabIndex={0}>
              {t('v2.ideas.invite', 'Invite')}
            </a>
          )}
          {isProposer && (
            <a
              onClick={() => setConfirmDelete({ type: 'colloquium', id: ac.id, asAdmin: false })}
              role="button"
              tabIndex={0}
            >
              {t('v2.ideas.deleteColloquium', 'Delete')}
            </a>
          )}
        </span>
      </div>

      <h2 className="dtitle">{localizedTitle}</h2>
      <div className="dmeta">
        <Pill>{typeLabel}</Pill>
        {isProposer && <Pill>{t('v2.ideas.proposer', 'Proposer')}</Pill>}
        {isPrivate && <Pill>{t('v2.ideas.badgeClosed', 'Private')}</Pill>}
        {countdown && (
          <span className="dcount">
            {t('v2.ideas.verdictIn', 'Verdict in')} <b>{countdown}</b>
          </span>
        )}
      </div>

      {/* Access paywall (skipped for open debates — free to read) */}
      {needsAccess && !hasAccess && !isOpenDebate && (
        <div className="cell paywall">
          <h2>{t('v2.ideas.accessLocked', 'LOCKED SESSION')}</h2>
          <p>
            {t(
              'v2.ideas.accessRequired',
              'This colloquium requires 1 credit to read. Unlock to see the full debate and all philosopher arguments.'
            )}
          </p>
          <div>
            <Button onClick={handleUnlockAccess} disabled={coll.actionLoading}>
              {coll.actionLoading ? '…' : t('v2.ideas.unlockAccess', 'Unlock access · 1 credit')}
            </Button>
          </div>
        </div>
      )}

      {hasAccess && (
        <>
          {/* The question / context */}
          <div className="cell qcell">
            <h2>
              {t('v2.ideas.theQuestion', 'THE QUESTION')} · {formatTimeAgo(ac.created_at, t)}
            </h2>
            <div className="prose">{localizedContent}</div>
          </div>

          {/* Panel chips: philosophers with their prices */}
          {philosophers.length > 0 && (
            <div className="chips">
              {philosophers.map((name) => (
                <span key={name} className={`pill${userAddedPhilosophers.has(name) ? ' star' : ''}`}>
                  {userAddedPhilosophers.has(name) ? '★ ' : ''}
                  {name} · {prices[name] || 2}
                  {t('v2.ideas.creditAbbr', 'cr')}
                </span>
              ))}
            </div>
          )}

          {/* Transcript: philosopher left, user right */}
          <div className="iwell">
            {coll.loading && coll.replies.length === 0 && (
              <div className="mnote">{t('v2.ideas.loading', 'Loading…')}</div>
            )}
            {!coll.loading && coll.replies.length === 0 && (
              <div className="mnote">
                {t('v2.ideas.noReplies', 'No arguments yet. Be the first to weigh in!')}
              </div>
            )}
            {coll.replies.map((reply) => (
              <ReplyMsg
                key={reply.id}
                reply={reply}
                isYou={!reply.is_philosopher}
                onVote={coll.voteReply}
                onDelete={(replyId) => setConfirmDelete({ type: 'colloquium-reply', id: replyId })}
                onEdit={coll.editReply}
                t={t}
                isColloquium={true}
                lang={coll.lang}
                hasVerdict={hasVerdict}
              />
            ))}
          </div>

          {/* Verdict — after the transcript so the debate reads first */}
          {localizedWrapup ? (
            <div className="verdict">
              <span className="vlabel">{t('v2.ideas.wrapupTitle', 'Philosify verdict')}</span>
              {verdictAudioEndpoint && (
                <VerdictAudio
                  audioUrl={verdictAudioEndpoint}
                  onUnlockParticipation={handleUnlockParticipation}
                  participateCost={participateCost}
                  canParticipate={canParticipate}
                />
              )}
              <div className="prose vprose">{localizedWrapup}</div>
              <InlineAdSlot
                key={`colloquium-verdict-${ac.id}`}
                userId={user?.id}
                placement="constellation"
                layout="banner"
                refreshKey={`coll-verdict-${ac.id}`}
              />
              <ShareButton
                shareUrl={`${window.location.origin}/debate/${ac.id}?lang=${i18n.resolvedLanguage || i18n.language}`}
                shareText={t('share.shareDebateText', {
                  title: localizedTitle || t('v2.ideas.wrapupTitle', 'Philosify verdict'),
                })}
              />
            </div>
          ) : coll.verdictLoading ? (
            <Telemetry
              label={t('v2.ideas.generatingVerdict', 'Generating verdict')}
              time={formatChrono(verdictElapsed)}
              progress={chronoProgress(verdictElapsed)}
            />
          ) : null}

          {/* Philosopher poll — after the verdict */}
          {hasVerdict && (
            <PhilosopherPoll
              philosophers={philosophers}
              poll={coll.poll}
              onVote={coll.castPollVote}
              threadId={ac.id}
              t={t}
            />
          )}
        </>
      )}

      {coll.error && <div className="ierr">{coll.error}</div>}

      {/* Sponsored slot while philosophers generate / actions run (parity) */}
      {hasAccess &&
        !hasVerdict &&
        (coll.actionLoading ||
          coll.verdictLoading ||
          ((collType === 'user_proposed' || collType === 'open_debate') &&
            !allPhilosHaveSpoken &&
            allPhilosOnPanel.length > 0)) && (
          <InlineAdSlot
            key={`ideas-colloquium-${ac.id}-${philosophers.length}-${Number(coll.actionLoading)}-${Number(coll.verdictLoading)}`}
            userId={user?.id}
            placement="constellation"
            layout="banner"
            refreshKey={`ideas-colloquium-${ac.id}-${philosophers.length}-${Number(coll.actionLoading)}-${Number(coll.verdictLoading)}`}
            className="debate-footer-ad"
          />
        )}

      {/* Action bar */}
      {hasAccess && !hasVerdict && (
        <div className="abar">
          {!canParticipate ? (
            <Button onClick={handleUnlockParticipation} disabled={coll.actionLoading}>
              {coll.actionLoading
                ? '…'
                : t('v2.ideas.unlockParticipation', {
                    defaultValue: 'Join the discussion · {{cost}} credit(s)',
                    cost: participateCost,
                  })}
            </Button>
          ) : (
            <>
              {(collType === 'user_proposed' || collType === 'open_debate') &&
                !allPhilosHaveSpoken &&
                allPhilosOnPanel.length > 0 && (
                  <div className="genline">
                    {t('v2.ideas.philosopherProgress', {
                      defaultValue: 'Philosopher {{current}} of {{total}} has spoken…',
                      current: spokenCount,
                      total: allPhilosOnPanel.length,
                    })}
                  </div>
                )}
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
              <div className="arow">
                {pickerOpen ? (
                  <Button
                    variant="secondary"
                    className="sbtn"
                    onClick={() => setShowAddPhilosopher(true)}
                  >
                    {t('v2.ideas.addPhilosopher', '+ Add a philosopher · from 2 credits')}
                    {minutesUntilPickerClose != null && minutesUntilPickerClose <= 20
                      ? ` ${t('v2.ideas.pickerCountdown', {
                          defaultValue: '({{minutes}} min left)',
                          minutes: minutesUntilPickerClose,
                        })}`
                      : ''}
                  </Button>
                ) : !hasVerdict ? (
                  <span className="mnote">
                    {t('v2.ideas.pickerClosed', 'Philosopher selection closed')}
                  </span>
                ) : null}
                {collType === 'user_proposed' && isProposer && !hasVerdict && generationReady && (
                  <Button
                    variant="secondary"
                    className="sbtn"
                    onClick={() => coll.proposerVerdict(ac.id)}
                    disabled={coll.actionLoading}
                  >
                    {coll.actionLoading ? '…' : t('v2.ideas.generateVerdict', 'Generate the verdict')}
                  </Button>
                )}
                {collType === 'user_proposed' &&
                  isProposer &&
                  !hasVerdict &&
                  !generationReady &&
                  generationNeedsRetry && (
                    <Button
                      variant="secondary"
                      className="sbtn"
                      onClick={() => coll.retryGeneration(ac.id)}
                      disabled={coll.actionLoading}
                    >
                      {coll.actionLoading ? '…' : t('v2.ideas.retryGeneration', 'Retry generation')}
                    </Button>
                  )}
                {isOpenDebate && isProposer && !hasVerdict && allPhilosHaveSpoken && (
                  <Button
                    variant="secondary"
                    className="sbtn"
                    onClick={() => coll.proposerVerdict(ac.id)}
                    disabled={coll.actionLoading}
                  >
                    {coll.actionLoading ? '…' : t('v2.ideas.generateVerdict', 'Generate the verdict')}
                  </Button>
                )}
                {isDaily && (
                  <Button
                    variant="secondary"
                    className="sbtn"
                    onClick={() => coll.triggerVerdict(ac.id)}
                    disabled={coll.actionLoading}
                  >
                    {coll.actionLoading ? '…' : t('v2.ideas.generateVerdict', 'Generate the verdict')}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Add Philosopher modal */}
      {showAddPhilosopher && (
        <AddPhilosopherModal
          roster={coll.roster}
          existingPhilosophers={philosophers}
          onAdd={handleAddPhilosopher}
          onClose={() => setShowAddPhilosopher(false)}
          loading={coll.actionLoading}
          error={coll.error}
          lang={i18n.language}
        />
      )}

      {/* Philosopher added toast */}
      {philosopherToast && (
        <div className="ptoast">
          {t('v2.ideas.philosopherAdded', {
            defaultValue: '{{name}} has joined the debate',
            name: philosopherToast,
          })}
        </div>
      )}

      {/* Delete confirmations */}
      {confirmDelete && confirmDelete.type === 'colloquium' && (
        <ConfirmModal
          text={t(
            'v2.ideas.confirmDeleteColloquium',
            'Are you sure you want to delete this colloquium? All replies, votes, and audio will be permanently removed.'
          )}
          onClose={() => setConfirmDelete(null)}
          onConfirm={async () => {
            const { id, asAdmin } = confirmDelete;
            setConfirmDelete(null);
            await coll.deleteColloquium(id, { asAdmin });
          }}
        />
      )}
      {confirmDelete && confirmDelete.type === 'colloquium-reply' && (
        <ConfirmModal
          text={t('v2.ideas.confirmDeleteReply', 'Are you sure you want to delete this reply?')}
          onClose={() => setConfirmDelete(null)}
          onConfirm={async () => {
            const { id } = confirmDelete;
            setConfirmDelete(null);
            await coll.deleteReply(id);
          }}
        />
      )}

      {/* Invite modal */}
      {showInvite && (
        <InviteModal
          threadId={ac.id}
          threadTitle={localizedTitle}
          type="colloquium"
          onClose={() => setShowInvite(false)}
        />
      )}
    </section>
  );
}

export default ColloquiumDetail;
