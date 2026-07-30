// IdeasPage - v2 IDEAS module (Colloquiums + Debates), per
// new_design/philosify-ideas.html. Functionality ported from the retired
// Ideas sidebar (IdeasHub → DebatePanel) with useColloquium/useDebate reused
// as-is; realtime updates live inside useColloquium.
// Addendum 1: supports ?debate=<id> deep link (push landing / history replay)
// and payment-resume on mount (location.state.resume + pendingAction shapes).
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell, ModuleHeader, Ticker, Button, Telemetry } from '../../components/v2';
import { NavAccount } from '../../components/v2/NavAccount.jsx';
import { V2ModalsHost } from '../../components/v2/CommerceModals.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useCreditsContext } from '../../contexts/CreditsContext';
import { useDebate } from '../../hooks/useDebate.js';
import { useColloquium } from '../../hooks/useColloquium.js';
import { setPendingAction, getPendingAction, clearPendingAction } from '../../utils/pendingAction.js';
import { logger } from '../../utils';
import { ColloquiumCard, DebateCard } from './ideas/FeedCards.jsx';
import { ColloquiumDetail } from './ideas/ColloquiumDetail.jsx';
import { DebateDetail } from './ideas/DebateDetail.jsx';
import { ProposeColloquiumModal, OpenDebateModal, CreateDebateModal } from './ideas/IdeasModals.jsx';
import { formatChrono, useChronometer, chronoProgress } from './ideas/utils.js';
import '../../styles/v2-pages/ideas.css';

const PROPOSE_COST = 5;
const OPEN_DEBATE_COST = 3;

export default function IdeasPage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { balance } = useCreditsContext();
  const debate = useDebate();
  const coll = useColloquium();

  const [showPropose, setShowPropose] = useState(false);
  const [showOpenDebate, setShowOpenDebate] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [creatingPendingProposal, setCreatingPendingProposal] = useState(false);

  const pendingElapsed = useChronometer(creatingPendingProposal);

  const debateParam = searchParams.get('debate');
  const openedDeepLinkRef = useRef(null);

  // ─── Credit pre-check: store the SAME pendingAction shapes the current
  // system uses, then open the shared Buy Credits modal (contract §wiring).
  const requireCredits = useCallback(
    (cost, action) => {
      if ((balance?.total ?? 0) < cost) {
        setPendingAction(action);
        window.dispatchEvent(new CustomEvent('v2-open-buy-credits'));
        return false;
      }
      return true;
    },
    [balance?.total]
  );

  // Server-side INSUFFICIENT_CREDITS path: the hook already stored the
  // pending action — bridge its legacy modal flag to the v2 Buy Credits modal.
  useEffect(() => {
    if (coll.showBuyCredits) {
      coll.dismissBuyCredits();
      window.dispatchEvent(new CustomEvent('v2-open-buy-credits'));
    }
  }, [coll.showBuyCredits]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Load both feeds once signed in ───────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    debate.loadDebates();
    coll.loadColloquiums();
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Open / close an item (URL-synced: ?debate=<id>) ──────
  const openItem = useCallback(
    (id, kind) => {
      openedDeepLinkRef.current = id;
      if (kind === 'colloquium') coll.openColloquium(id);
      else debate.openDebate(id);
      if (searchParams.get('debate') !== id) navigate(`/ideas?debate=${id}`);
    },
    [coll, debate, navigate, searchParams]
  );

  const closeItem = useCallback(() => {
    openedDeepLinkRef.current = null;
    coll.closeColloquium();
    debate.closeDebate();
    if (searchParams.get('debate')) navigate('/ideas');
  }, [coll, debate, navigate, searchParams]);

  // Deep link / push landing / history replay: ?debate=<id> on mount.
  // Same flow as the old sidebar deep link: open via the forum endpoint,
  // colloquium threads are redirected to the colloquium hook below.
  useEffect(() => {
    if (!debateParam || !isAuthenticated) return;
    if (openedDeepLinkRef.current === debateParam) return;
    if (location.state?.resume) logger.log('[IdeasPage] Resuming after payment:', debateParam);
    openedDeepLinkRef.current = debateParam;
    debate.openDebate(debateParam);
  }, [debateParam, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Browser back (param removed) closes any open detail
  useEffect(() => {
    if (!debateParam) {
      openedDeepLinkRef.current = null;
      if (coll.activeColloquium) coll.closeColloquium();
      if (debate.activeDebate) debate.closeDebate();
    }
  }, [debateParam]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect colloquiums opened via the debate hook to the colloquium hook
  useEffect(() => {
    if (debate.activeDebate?.category === 'colloquium') {
      const id = debate.activeDebate.id;
      debate.closeDebate();
      coll.openColloquium(id);
    }
  }, [debate.activeDebate]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Payment-resume: auto-retry pending credit action ─────
  // (identical to the old DebatePanel wiring; pendingAction shapes unchanged)
  const pendingRetryRef = useRef(false);

  // Actions that target a specific colloquium (need activeColloquium loaded)
  useEffect(() => {
    if (pendingRetryRef.current) return;
    if (!coll.activeColloquium || coll.actionLoading || coll.loading) return;
    const pending = getPendingAction();
    if (!pending) return;
    const threadId = coll.activeColloquium.id;
    if (pending.threadId !== threadId) return;

    if (pending.type === 'colloquium:access') {
      pendingRetryRef.current = true;
      clearPendingAction();
      logger.log('[IdeasPage] Auto-retrying: unlock access for', threadId);
      coll.unlockAccess(threadId);
    } else if (pending.type === 'colloquium:participate') {
      pendingRetryRef.current = true;
      clearPendingAction();
      logger.log('[IdeasPage] Auto-retrying: unlock participation for', threadId);
      coll.unlockParticipation(threadId);
    } else if (pending.type === 'colloquium:addPhilosopher') {
      pendingRetryRef.current = true;
      clearPendingAction();
      logger.log('[IdeasPage] Auto-retrying: add philosopher', pending.philosopher);
      coll.addPhilosopher(threadId, pending.philosopher);
    }
  }, [coll.activeColloquium?.id, coll.loading, coll.actionLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Actions that don't need an active colloquium (propose creates a new one)
  useEffect(() => {
    if (pendingRetryRef.current) return;
    if (!isAuthenticated || coll.activeColloquium || coll.loading) return; // list view only
    const pending = getPendingAction();
    if (!pending) return;

    if (pending.type === 'colloquium:propose') {
      pendingRetryRef.current = true;
      clearPendingAction();
      setCreatingPendingProposal(true); // eslint-disable-line react-hooks/set-state-in-effect -- intentional payment-resume kick-off (parity with DebatePanel)
      logger.log('[IdeasPage] Auto-retrying: propose colloquium');
      coll.propose(pending.title, pending.content, pending.visibility).then((result) => {
        setCreatingPendingProposal(false);
        if (result?.success && result.threadId) openItem(result.threadId, 'colloquium');
      });
    } else if (pending.type === 'colloquium:proposeOpenDebate') {
      pendingRetryRef.current = true;
      clearPendingAction();
      setCreatingPendingProposal(true);
      logger.log('[IdeasPage] Auto-retrying: propose open debate');
      coll.proposeOpenDebate(pending.title, pending.content).then((result) => {
        setCreatingPendingProposal(false);
        if (result?.success && result.threadId) openItem(result.threadId, 'colloquium');
      });
    }
  }, [coll.loading, coll.activeColloquium, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Create / propose handlers ────────────────────────────
  const handleCreate = useCallback(
    async (title, content) => {
      if (creating) return;
      setCreating(true);
      const created = await debate.createDebate(title, content);
      setCreating(false);
      if (created) {
        setShowCreate(false);
        openItem(created.id, 'debate');
      }
    },
    [debate, creating, openItem]
  );

  const handlePropose = useCallback(
    async (title, content, visibility) => {
      if (!requireCredits(PROPOSE_COST, { type: 'colloquium:propose', title, content, visibility })) {
        setShowPropose(false);
        return;
      }
      const result = await coll.propose(title, content, visibility);
      if (result?.success) {
        setShowPropose(false);
        if (result.threadId) openItem(result.threadId, 'colloquium');
      } else if (result?.code === 'INSUFFICIENT_CREDITS') {
        setShowPropose(false);
      }
    },
    [coll, requireCredits, openItem]
  );

  const handleProposeOpenDebate = useCallback(
    async (title, content) => {
      if (!requireCredits(OPEN_DEBATE_COST, { type: 'colloquium:proposeOpenDebate', title, content })) {
        setShowOpenDebate(false);
        return;
      }
      const result = await coll.proposeOpenDebate(title, content);
      if (result?.success) {
        setShowOpenDebate(false);
        if (result.threadId) openItem(result.threadId, 'colloquium');
      } else if (result?.code === 'INSUFFICIENT_CREDITS') {
        setShowOpenDebate(false);
      }
    },
    [coll, requireCredits, openItem]
  );

  const handleLoadMore = useCallback(() => {
    const lastDebate = debate.debates[debate.debates.length - 1];
    const lastColl = coll.colloquiums[coll.colloquiums.length - 1];
    if (lastDebate) debate.loadDebates(lastDebate.last_reply_at || lastDebate.created_at);
    if (lastColl) coll.loadColloquiums(lastColl.last_reply_at || lastColl.created_at);
  }, [debate, coll]);

  // ─── Feed grouping (mockup: daily featured → colloquiums → debates)
  const isTodaysDaily = (item) => {
    const type = item.metadata?.colloquium_type || item.colloquium_type;
    if (type !== 'daily') return false;
    const created = new Date(item.created_at);
    return created.toDateString() === new Date().toDateString();
  };
  const byActivity = (a, b) =>
    new Date(b.last_reply_at || b.created_at) - new Date(a.last_reply_at || a.created_at);

  const todaysDaily = coll.colloquiums.find(isTodaysDaily) || null;
  const otherColloquiums = coll.colloquiums.filter((c) => c !== todaysDaily).sort(byActivity);
  const debates = debate.debates.filter((d) => d.category !== 'colloquium').sort(byActivity);
  const feedEmpty = !todaysDaily && otherColloquiums.length === 0 && debates.length === 0;
  const feedLoading = debate.loading || coll.loading;

  const dailyDate = todaysDaily
    ? new Intl.DateTimeFormat(i18n.language || 'en', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(todaysDaily.created_at))
    : null;

  const showColloquiumDetail = !!coll.activeColloquium;
  const showDebateDetail =
    !showColloquiumDetail && debate.activeDebate && debate.activeDebate.category !== 'colloquium';

  return (
    <PageShell status="Analysis Engine // Active" nav={<NavAccount />}>
      <div className="pg-ideas">
        <ModuleHeader title={t('v2.ideas.title', 'IDEAS')}>
          <Ticker>
            {t('v2.ideas.ticker', 'Colloquium // Daily by the system · Debates // By users')}
          </Ticker>
        </ModuleHeader>

        {authLoading ? (
          <div className="mnote">{t('v2.ideas.loading', 'Loading…')}</div>
        ) : !isAuthenticated ? (
          <div className="cell gate">
            <h2>{t('v2.ideas.signInTitle', 'SIGN IN REQUIRED')}</h2>
            <p>
              {t(
                'v2.ideas.signInRequired',
                'Sign in to read the colloquiums and join the debates.'
              )}
            </p>
            <div>
              <Button variant="secondary" onClick={() => navigate('/signin')}>
                {t('v2.ideas.signIn', 'Sign in')}
              </Button>
            </div>
          </div>
        ) : showColloquiumDetail ? (
          <ColloquiumDetail coll={coll} user={user} onBack={closeItem} requireCredits={requireCredits} />
        ) : showDebateDetail ? (
          <DebateDetail debate={debate} lang={coll.lang} user={user} onBack={closeItem} />
        ) : (
          <section className="feed">
            {creatingPendingProposal && (
              <Telemetry
                label={t('v2.ideas.creatingProposal', 'Creating your colloquium')}
                time={formatChrono(pendingElapsed)}
                progress={chronoProgress(pendingElapsed)}
              />
            )}

            {/* Colloquium of the day */}
            {todaysDaily && (
              <>
                <div className="slabel">
                  {t('v2.ideas.dailyLabel', {
                    defaultValue: 'Colloquium of the day — {{date}}',
                    date: dailyDate,
                  })}
                </div>
                <ColloquiumCard
                  item={todaysDaily}
                  onOpen={openItem}
                  t={t}
                  lang={coll.lang}
                  featured
                />
              </>
            )}

            {/* Colloquium sessions */}
            <div className="shead">
              <span className="slabel">
                {t('v2.ideas.colloquiumsLabel', 'Colloquiums — sessions by the system and by users')}
              </span>
              <span className="sbtns">
                <Button variant="secondary" className="sbtn" onClick={() => setShowOpenDebate(true)}>
                  {t('v2.ideas.openDebateBtn', 'Open debate · 3 credits')}
                </Button>
                <Button variant="secondary" className="sbtn" onClick={() => setShowPropose(true)}>
                  {t('v2.ideas.proposeColloquium', 'Propose a colloquium · 5 credits')}
                </Button>
              </span>
            </div>
            {otherColloquiums.map((item) => (
              <ColloquiumCard key={`c-${item.id}`} item={item} onOpen={openItem} t={t} lang={coll.lang} />
            ))}
            {!feedLoading && otherColloquiums.length === 0 && !todaysDaily && (
              <div className="mnote">{t('v2.ideas.noColloquiums', 'No colloquiums yet.')}</div>
            )}

            {/* User debates */}
            <div className="shead">
              <span className="slabel">
                {t('v2.ideas.debatesLabel', 'Debates — created by users')}
              </span>
              <span className="sbtns">
                <Button variant="secondary" className="sbtn" onClick={() => setShowCreate(true)}>
                  {t('v2.ideas.createDebate', 'Create a debate')}
                </Button>
              </span>
            </div>
            {debates.map((item) => (
              <DebateCard key={`d-${item.id}`} debate={item} onOpen={openItem} t={t} />
            ))}
            {feedLoading && feedEmpty && <div className="mnote">{t('v2.ideas.loading', 'Loading…')}</div>}
            {!feedLoading && debates.length === 0 && (
              <div className="mnote">
                {t('v2.ideas.noDebates', 'No debates yet. Start the first one!')}
              </div>
            )}

            {(debate.error || coll.error) && (
              <div className="ierr">{debate.error || coll.error}</div>
            )}

            {(debate.hasMore || coll.hasMore) && (
              <div className="arow">
                <Button
                  variant="secondary"
                  className="sbtn"
                  onClick={handleLoadMore}
                  disabled={feedLoading}
                >
                  {feedLoading ? t('v2.ideas.loading', 'Loading…') : t('v2.ideas.loadMore', 'Load more')}
                </Button>
              </div>
            )}
          </section>
        )}

        {/* Transaction modals */}
        {showPropose && (
          <ProposeColloquiumModal
            onClose={() => setShowPropose(false)}
            onSubmit={handlePropose}
            loading={coll.actionLoading}
            error={coll.error}
          />
        )}
        {showOpenDebate && (
          <OpenDebateModal
            onClose={() => setShowOpenDebate(false)}
            onSubmit={handleProposeOpenDebate}
            loading={coll.actionLoading}
            error={coll.error}
          />
        )}
        {showCreate && (
          <CreateDebateModal
            onClose={() => setShowCreate(false)}
            onSubmit={handleCreate}
            creating={creating}
            error={debate.error}
          />
        )}

        <V2ModalsHost />
      </div>
    </PageShell>
  );
}
