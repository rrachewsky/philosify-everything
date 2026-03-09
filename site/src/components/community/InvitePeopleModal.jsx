// InvitePeopleModal - Overlay for inviting registered users to a debate or colloquium
// Fetches the People directory, shows searchable list with checkboxes,
// and sends invitations via the debate or colloquium invite API.
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { config } from '@/config';
import { inviteToDebate } from '@services/api/forum.js';
import { inviteToColloquiumBatch } from '@services/api/colloquium.js';

export function InvitePeopleModal({ debateId, debateTitle, onClose, type = 'debate' }) {
  const { t } = useTranslation();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState(null);

  // Fetch people list
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
      // Merge both lists into a single flat array, de-duplicated by id
      const seen = new Set();
      const all = [];
      for (const m of [...(data.inCollectives || []), ...(data.allMembers || [])]) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          all.push(m);
        }
      }
      // Sort alphabetically
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
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSend = async () => {
    if (selected.size === 0 || sending) return;
    setSending(true);
    setSendError(null);
    try {
      if (type === 'colloquium') {
        await inviteToColloquiumBatch(debateId, [...selected]);
      } else {
        await inviteToDebate(debateId, [...selected]);
      }
      setSent(true);
      // Auto-close after brief success message
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setSendError(err.status === 429 ? t('community.debate.inviteRateLimit') : err.message);
    } finally {
      setSending(false);
    }
  };

  // Client-side search filter
  const filtered = searchFilter
    ? people.filter((m) => (m.displayName || '').toLowerCase().includes(searchFilter.toLowerCase()))
    : people;

  return (
    <div className="invite-modal-overlay" onClick={onClose}>
      <div className="invite-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="invite-modal__header">
          <span className="invite-modal__title">{t('community.debate.inviteModalTitle')}</span>
          <button className="invite-modal__close" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Debate context */}
        <div className="invite-modal__debate-name">{debateTitle}</div>

        {/* Search */}
        <div className="invite-modal__search">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={t('community.debate.inviteSearchPlaceholder')}
            className="invite-modal__search-input"
            autoFocus
          />
        </div>

        {/* People list */}
        <div className="invite-modal__list">
          {loading && <div className="invite-modal__empty">{t('community.people.loading')}</div>}
          {error && (
            <div className="invite-modal__error">
              {error}
              <button className="invite-modal__retry" onClick={loadPeople}>
                {t('community.people.tryAgain')}
              </button>
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="invite-modal__empty">
              {searchFilter ? t('community.dm.noResults') : t('community.people.noMembers')}
            </div>
          )}
          {!loading &&
            !error &&
            filtered.map((member) => {
              const isSelected = selected.has(member.id);
              return (
                <div
                  key={member.id}
                  className={`invite-modal__person${isSelected ? ' invite-modal__person--selected' : ''}`}
                  onClick={() => toggleUser(member.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="invite-modal__avatar">
                    {(member.displayName || '?')[0].toUpperCase()}
                  </div>
                  <div className="invite-modal__name">{member.displayName}</div>
                  <div
                    className={`invite-modal__check${isSelected ? ' invite-modal__check--active' : ''}`}
                  >
                    {isSelected && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="invite-modal__footer">
          {sent ? (
            <div className="invite-modal__success">{t('community.debate.inviteSent')}</div>
          ) : (
            <>
              {sendError && <div className="invite-modal__send-error">{sendError}</div>}
              <button
                className="invite-modal__send-btn"
                onClick={handleSend}
                disabled={selected.size === 0 || sending}
              >
                {sending
                  ? t('community.debate.inviteSending')
                  : selected.size > 0
                    ? t('community.debate.inviteSend', { count: selected.size })
                    : t('community.debate.inviteNoneSelected')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default InvitePeopleModal;
