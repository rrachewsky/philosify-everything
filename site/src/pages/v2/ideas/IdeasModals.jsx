// Ideas v2 transaction modals: propose colloquium (5 cr), open debate (3 cr),
// create debate (free), add philosopher (2-3 cr), invite people, confirm.
// Flows ported from DebatePanel / InvitePeopleModal (WP3 parity), re-skinned
// on ModalV2. All credit costs are shown before the click.
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { config } from '@/config';
import { ModalV2, Button, Field, Telemetry } from '../../../components/v2';
import { inviteToDebate } from '@services/api/forum.js';
import { inviteToColloquiumBatch } from '@services/api/colloquium.js';
import { translateEra, translateSchool } from '../../../data/philosopherI18n.js';
import { formatChrono, useChronometer, chronoProgress } from './utils.js';

// ─── Propose a Colloquium (5 credits) ───────────────────────
export function ProposeColloquiumModal({ onClose, onSubmit, loading, error }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('open');
  const elapsed = useChronometer(loading);

  const valid = title.trim().length >= 3 && content.trim().length >= 10;
  const submit = () => {
    if (!valid) return;
    onSubmit(title.trim(), content.trim(), visibility);
  };

  return (
    <ModalV2
      title={t('v2.ideas.proposeTitle', 'PROPOSE A COLLOQUIUM')}
      onClose={loading ? undefined : onClose}
      footer={
        loading ? null : (
          <>
            <Button variant="secondary" onClick={onClose}>
              {t('v2.ideas.cancel', 'Cancel')}
            </Button>
            <Button onClick={submit} disabled={!valid}>
              {t('v2.ideas.proposeSubmit', 'Propose · 5 credits')}
            </Button>
          </>
        )
      }
    >
      {loading ? (
        <Telemetry
          label={t('v2.ideas.creatingColloquium', 'Creating colloquium')}
          time={formatChrono(elapsed)}
          progress={chronoProgress(elapsed)}
        />
      ) : (
        <>
          <div className="mnote">
            {t('v2.ideas.proposeCost', '5 credits — the system selects 4 philosophers for your topic.')}{' '}
            {t(
              'v2.ideas.proposeHint',
              'Describe a philosophical question or dilemma. The best 4 philosophers will debate it in character.'
            )}
          </div>
          <Field
            label={t('v2.ideas.fieldQuestion', 'The question')}
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 200))}
            placeholder={t('v2.ideas.proposeTitlePlaceholder', 'Your philosophical question…')}
            maxLength={200}
            autoFocus
          />
          <Field
            label={t('v2.ideas.fieldContext', 'Context')}
            textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 5000))}
            placeholder={t(
              'v2.ideas.proposeContentPlaceholder',
              'Provide context, examples, or specific aspects you want explored…'
            )}
            maxLength={5000}
            rows={4}
          />
          <label className="f">{t('v2.ideas.visibility', 'Visibility')}</label>
          <div className="vseg">
            <Button
              variant="secondary"
              className={`sbtn${visibility === 'open' ? ' on' : ''}`}
              onClick={() => setVisibility('open')}
              type="button"
            >
              {t('v2.ideas.visibilityOpen', 'Open')}
            </Button>
            <Button
              variant="secondary"
              className={`sbtn${visibility === 'closed' ? ' on' : ''}`}
              onClick={() => setVisibility('closed')}
              type="button"
            >
              {t('v2.ideas.visibilityClosed', 'Closed')}
            </Button>
          </div>
          <div className="mnote">
            {visibility === 'open'
              ? t('v2.ideas.visibilityOpenHint', 'Everyone can see and join this colloquium.')
              : t(
                  'v2.ideas.visibilityClosedHint',
                  'Only you (and invited users) can see this colloquium.'
                )}
          </div>
          {error && <div className="ierr">{error}</div>}
        </>
      )}
    </ModalV2>
  );
}

// ─── Start an Open Debate (3 credits) ───────────────────────
export function OpenDebateModal({ onClose, onSubmit, loading, error }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const elapsed = useChronometer(loading);

  const valid = title.trim().length >= 3 && content.trim().length >= 10;
  const submit = () => {
    if (!valid) return;
    onSubmit(title.trim(), content.trim());
  };

  return (
    <ModalV2
      title={t('v2.ideas.openDebateTitle', 'START AN OPEN DEBATE')}
      onClose={loading ? undefined : onClose}
      footer={
        loading ? null : (
          <>
            <Button variant="secondary" onClick={onClose}>
              {t('v2.ideas.cancel', 'Cancel')}
            </Button>
            <Button onClick={submit} disabled={!valid}>
              {t('v2.ideas.openDebateSubmit', 'Start debate · 3 credits')}
            </Button>
          </>
        )
      }
    >
      {loading ? (
        <Telemetry
          label={t('v2.ideas.creatingOpenDebate', 'Creating debate')}
          time={formatChrono(elapsed)}
          progress={chronoProgress(elapsed)}
        />
      ) : (
        <>
          <div className="mnote">
            {t('v2.ideas.openDebateCost', '3 credits — free to read, 1 credit to participate.')}{' '}
            {t(
              'v2.ideas.openDebateHint',
              'Anyone can read for free. Add philosophers on demand. You decide when the verdict is generated.'
            )}
          </div>
          <Field
            label={t('v2.ideas.fieldQuestion', 'The question')}
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 200))}
            placeholder={t('v2.ideas.proposeTitlePlaceholder', 'Your philosophical question…')}
            maxLength={200}
            autoFocus
          />
          <Field
            label={t('v2.ideas.fieldContext', 'Context')}
            textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 5000))}
            placeholder={t(
              'v2.ideas.proposeContentPlaceholder',
              'Provide context, examples, or specific aspects you want explored…'
            )}
            maxLength={5000}
            rows={4}
          />
          {error && <div className="ierr">{error}</div>}
        </>
      )}
    </ModalV2>
  );
}

// ─── Create a Debate (free, user thread) ────────────────────
export function CreateDebateModal({ onClose, onSubmit, creating, error }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const valid = !!title.trim() && content.trim().length >= 10;

  return (
    <ModalV2
      title={t('v2.ideas.createDebateTitle', 'CREATE A DEBATE')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('v2.ideas.cancel', 'Cancel')}
          </Button>
          <Button onClick={() => valid && onSubmit(title.trim(), content.trim())} disabled={!valid || creating}>
            {creating ? '…' : t('v2.ideas.createDebateSubmit', 'Create debate')}
          </Button>
        </>
      }
    >
      <div className="mnote">
        {t(
          'v2.ideas.createDebateHint',
          'Pose a question, present arguments, and close with a Philosify verdict when the debate is done.'
        )}
      </div>
      <Field
        label={t('v2.ideas.fieldQuestion', 'The question')}
        value={title}
        onChange={(e) => setTitle(e.target.value.slice(0, 200))}
        placeholder={t('v2.ideas.questionPlaceholder', 'What philosophical question should we debate?')}
        maxLength={200}
        autoFocus
      />
      <Field
        label={t('v2.ideas.fieldContext', 'Context')}
        textarea
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, 5000))}
        placeholder={t('v2.ideas.contextPlaceholder', 'Add context or your opening argument')}
        maxLength={5000}
        rows={3}
      />
      {error && <div className="ierr">{error}</div>}
    </ModalV2>
  );
}

// ─── Add a Philosopher (2-3 credits, roster picker) ─────────
export function AddPhilosopherModal({ roster, existingPhilosophers, onAdd, onClose, loading, error, lang }) {
  const { t } = useTranslation();
  const available = roster.filter((p) => !existingPhilosophers.includes(p.name));
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? available.filter((p) => {
        const q = search.toLowerCase();
        const tEra = translateEra(p.era, lang).toLowerCase();
        const tSchool = translateSchool(p.school, lang).toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.era.toLowerCase().includes(q) ||
          p.school.toLowerCase().includes(q) ||
          tEra.includes(q) ||
          tSchool.includes(q)
        );
      })
    : available;

  const selectedPrice = selected ? roster.find((p) => p.name === selected)?.price || 2 : null;

  return (
    <ModalV2
      title={t('v2.ideas.addPhilosopherTitle', 'ADD A PHILOSOPHER')}
      onClose={loading ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('v2.ideas.cancel', 'Cancel')}
          </Button>
          <Button onClick={() => selected && onAdd(selected)} disabled={!selected || loading}>
            {loading
              ? '…'
              : selected
                ? t('v2.ideas.addPhilosopherConfirm', {
                    defaultValue: 'Add {{name}} · {{price}} credits',
                    name: selected,
                    price: selectedPrice,
                  })
                : t('v2.ideas.selectPhilosopher', 'Select a philosopher')}
          </Button>
        </>
      }
    >
      {error && <div className="ierr">{error}</div>}
      {available.length === 0 ? (
        <div className="mnote">
          {t('v2.ideas.allPhilosophersAdded', 'All available philosophers have already been added.')}
        </div>
      ) : (
        <>
          <Field
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('v2.ideas.searchPhilosopher', 'Search by name, era, or school…')}
            autoFocus
          />
          {filtered.length === 0 ? (
            <div className="mnote">
              {t('v2.ideas.noPhilosophersFound', 'No philosophers match your search')}
            </div>
          ) : (
            <div className="rlist">
              {filtered.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  className={`rrow${selected === p.name ? ' on' : ''}`}
                  onClick={() => setSelected(p.name)}
                >
                  <span className="rname">{p.name}</span>
                  <span className="rmeta">
                    {translateEra(p.era, lang)} · {translateSchool(p.school, lang)}
                  </span>
                  <span className="rprice">
                    {t('v2.ideas.creditsCount', { defaultValue: '{{count}} credits', count: p.price })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </ModalV2>
  );
}

// ─── Invite People (debate or colloquium; free) ─────────────
export function InviteModal({ threadId, threadTitle, type = 'debate', onClose }) {
  const { t } = useTranslation();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState(null);

  const loadPeople = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${config.apiUrl}/api/people`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load members');
      }
      const data = await res.json();
      const seen = new Set();
      const all = [];
      for (const m of [...(data.inCollectives || []), ...(data.allMembers || [])]) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          all.push(m);
        }
      }
      all.sort((a, b) =>
        (a.displayName || '').localeCompare(b.displayName || '', undefined, { sensitivity: 'base' })
      );
      setPeople(all);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  const toggleUser = (userId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSend = async () => {
    if (selected.size === 0 || sending) return;
    setSending(true);
    setSendError(null);
    try {
      if (type === 'colloquium') {
        await inviteToColloquiumBatch(threadId, [...selected]);
      } else {
        await inviteToDebate(threadId, [...selected]);
      }
      setSent(true);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setSendError(
        err.status === 429
          ? t('v2.ideas.inviteRateLimit', 'Too many invitations. Please wait a moment.')
          : err.message
      );
    } finally {
      setSending(false);
    }
  };

  const filtered = searchFilter
    ? people.filter((m) => (m.displayName || '').toLowerCase().includes(searchFilter.toLowerCase()))
    : people;

  return (
    <ModalV2
      title={t('v2.ideas.inviteModalTitle', 'INVITE TO DEBATE')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('v2.ideas.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleSend} disabled={selected.size === 0 || sending || sent}>
            {sending
              ? t('v2.ideas.inviteSending', 'Sending…')
              : sent
                ? t('v2.ideas.inviteSent', 'Invitations sent')
                : t('v2.ideas.inviteSend', { defaultValue: 'Send ({{count}})', count: selected.size })}
          </Button>
        </>
      }
    >
      <div className="mnote">{threadTitle}</div>
      <Field
        value={searchFilter}
        onChange={(e) => setSearchFilter(e.target.value)}
        placeholder={t('v2.ideas.inviteSearchPlaceholder', 'Search members…')}
        autoFocus
      />
      {loading && <div className="mnote">{t('v2.ideas.loading', 'Loading…')}</div>}
      {error && <div className="ierr">{error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <div className="mnote">{t('v2.ideas.inviteNoneFound', 'No members found')}</div>
      )}
      {!loading && !error && filtered.length > 0 && (
        <div className="rlist">
          {filtered.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`rrow${selected.has(m.id) ? ' on' : ''}`}
              onClick={() => toggleUser(m.id)}
            >
              <span className="rname">{m.displayName}</span>
              <span className="rprice">{selected.has(m.id) ? '✓' : ''}</span>
            </button>
          ))}
        </div>
      )}
      {sendError && <div className="ierr">{sendError}</div>}
    </ModalV2>
  );
}

// ─── Confirm (destructive) ──────────────────────────────────
export function ConfirmModal({ text, confirmLabel, onConfirm, onClose }) {
  const { t } = useTranslation();
  return (
    <ModalV2
      title={t('v2.ideas.confirmTitle', 'CONFIRM')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('v2.ideas.cancel', 'Cancel')}
          </Button>
          <Button onClick={onConfirm}>{confirmLabel || t('v2.ideas.confirmDelete', 'Delete')}</Button>
        </>
      }
    >
      <div className="mnote">{text}</div>
    </ModalV2>
  );
}
