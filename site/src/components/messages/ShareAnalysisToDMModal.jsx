// ShareAnalysisToDMModal - Share an analysis as a rich card via DM
// Multi-select: user can pick multiple recipients, then click Send
// NOTE: Modal scoping rule - renders in place (no portal) so page CSS can confine it
// WP6.2: inline cyberpunk styles replaced by .share-dm-modal__* classes,
// skinned monochrome + silver in styles/v2-pages/community-panels.css
// (unscoped there on purpose — this modal mounts on every analysis surface).
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { config } from '../../config';
import { dmService } from '../../services/api/dm.js';
import '../../styles/v2-pages/community-panels.css';

export function ShareAnalysisToDMModal({ analysisData, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Fetch all people on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${config.apiUrl}/api/people`, { credentials: 'include' });
        if (res.ok && !cancelled) {
          const data = await res.json();
          // Merge both sections into one flat list, dedup by id
          const seen = new Set();
          const all = [];
          for (const p of [...(data.inCollectives || []), ...(data.allMembers || [])]) {
            if (!seen.has(p.id)) {
              seen.add(p.id);
              all.push(p);
            }
          }
          setPeople(all);
        }
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Toggle selection of a person
  const toggleSelect = useCallback((personId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) {
        next.delete(personId);
      } else {
        next.add(personId);
      }
      return next;
    });
  }, []);

  // Send to all selected people
  const handleSend = useCallback(async () => {
    if (selected.size === 0 || sending) return;
    setSending(true);
    setError(null);

    const selectedPeople = people.filter((p) => selected.has(p.id));
    const successNames = [];

    try {
      // Create a share slug once (reused for all recipients)
      let shareSlug = null;
      try {
        const shareRes = await fetch(`${config.apiUrl}/api/share`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analysisId: analysisData.analysisId }),
        });
        if (shareRes.ok) {
          const shareData = await shareRes.json();
          if (shareData.success && shareData.slug) {
            shareSlug = shareData.slug;
          }
        }
      } catch {
        // Non-critical
      }

      // Send to each selected person
      for (const person of selectedPeople) {
        try {
          // Create or find conversation
          const convData = await dmService.createConversation({
            type: 'direct',
            memberIds: [person.id],
          });
          const conversationId = convData.conversation?.id;
          if (!conversationId) continue;

          // Send the analysis share message
          await dmService.shareAnalysis(conversationId, {
            ...analysisData,
            shareSlug,
          });

          successNames.push(person.displayName);
        } catch {
          // Continue with next person
        }
      }

      if (successNames.length > 0) {
        onSuccess?.(successNames.join(', '));
        onClose();
      } else {
        setError(t('community.dm.shareFailed') || 'Failed to share');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }, [analysisData, onClose, onSuccess, people, selected, sending, t]);

  // Client-side filter by display name
  const filteredPeople = filter
    ? people.filter((p) => (p.displayName || '').toLowerCase().includes(filter.toLowerCase()))
    : people;

  const { songName, artist, philosophicalNote, classification } = analysisData || {};

  // Render in place (no portal) - page CSS confines it where needed
  return (
    <div className="share-dm-modal-overlay" onClick={onClose}>
      <div className="share-dm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="share-dm-modal__header">
          <span className="share-dm-modal__title">{t('community.dm.shareAnalysis')}</span>
          <button className="share-dm-modal__close" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Analysis preview */}
        {songName && (
          <div className="share-dm-modal__preview">
            <div className="share-dm-modal__preview-icon">P</div>
            <div className="share-dm-modal__preview-info">
              <div className="share-dm-modal__preview-song">{songName}</div>
              <div className="share-dm-modal__preview-artist">{artist}</div>
              {philosophicalNote && (
                <div className="share-dm-modal__preview-note">
                  <strong>{t('philosophicalNote')}:</strong>{' '}
                  {philosophicalNote.length > 60
                    ? philosophicalNote.substring(0, 60) + '...'
                    : philosophicalNote}
                </div>
              )}
              {classification && (
                <div className="share-dm-modal__preview-classification">
                  <strong>{t('philosophicalClassification')}:</strong> {classification}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && <div className="share-dm-modal__error">{error}</div>}

        {/* Search input */}
        <div className="share-dm-modal__search-wrap">
          <input
            type="text"
            className="share-dm-modal__search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t('community.dm.searchPeople') || 'Search people...'}
            autoFocus
          />
        </div>

        {/* Selected count */}
        {selected.size > 0 && (
          <div className="share-dm-modal__selected">
            {selected.size} {t('community.dm.selected') || 'selected'}
          </div>
        )}

        {/* People list - scrollable */}
        <div className="share-dm-modal__list">
          {loading && (
            <div className="share-dm-modal__empty">{t('community.dm.loadingConversations')}</div>
          )}

          {!loading && filteredPeople.length === 0 && (
            <div className="share-dm-modal__empty">{t('community.dm.noResults')}</div>
          )}

          {filteredPeople.map((person) => {
            const isSelected = selected.has(person.id);
            return (
              <div
                key={person.id}
                onClick={() => toggleSelect(person.id)}
                className={`share-dm-modal__person${
                  isSelected ? ' share-dm-modal__person--selected' : ''
                }`}
              >
                {/* Checkbox */}
                <div className="share-dm-modal__checkbox">
                  {isSelected && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>

                {/* Avatar */}
                <div className="share-dm-modal__avatar">
                  {(person.displayName || '?')[0].toUpperCase()}
                </div>

                {/* Name */}
                <span className="share-dm-modal__name">{person.displayName}</span>
              </div>
            );
          })}
        </div>

        {/* Send button */}
        <div className="share-dm-modal__footer">
          <button
            className="share-dm-modal__send"
            onClick={handleSend}
            disabled={selected.size === 0 || sending}
          >
            {sending
              ? t('community.dm.sending') || 'Sending...'
              : selected.size > 0
                ? `${t('community.dm.send') || 'Send'} (${selected.size})`
                : t('community.dm.selectRecipients') || 'Select recipients'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareAnalysisToDMModal;
