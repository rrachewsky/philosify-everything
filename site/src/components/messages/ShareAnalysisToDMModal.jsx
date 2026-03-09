// ShareAnalysisToDMModal - Share an analysis as a rich card via DM
// Self-contained: creates conversation + sends analysis_share message
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { config } from '../../config';
import { dmService } from '../../services/api/dm.js';

export function ShareAnalysisToDMModal({ analysisData, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState(null);

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

  const handleSelect = useCallback(
    async (person) => {
      if (sharing) return;
      setSharing(true);
      setError(null);

      try {
        // 1. Create or find existing direct conversation with this person
        const convData = await dmService.createConversation({
          type: 'direct',
          memberIds: [person.id],
        });
        const conversationId = convData.conversation?.id;
        if (!conversationId) throw new Error('Failed to create conversation');

        // 2. Create a share slug for the analysis (optional, for the link)
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
          // Non-critical: share will work without slug (falls back to /shared/:id)
        }

        // 3. Send the analysis share message
        await dmService.shareAnalysis(conversationId, {
          ...analysisData,
          shareSlug,
        });

        // 4. Success callback
        onSuccess?.(person.displayName);
        onClose();
      } catch (err) {
        setError(err.message);
      } finally {
        setSharing(false);
      }
    },
    [analysisData, onClose, onSuccess, sharing]
  );

  // Client-side filter by display name
  const filteredPeople = filter
    ? people.filter((p) => (p.displayName || '').toLowerCase().includes(filter.toLowerCase()))
    : people;

  const { songName, artist, finalScore } = analysisData || {};

  return (
    <div className="group-members-overlay" onClick={onClose}>
      <div className="group-members-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="group-members-modal__header">
          <span className="group-members-modal__title">{t('community.dm.shareAnalysis')}</span>
          <button className="group-members-modal__close" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Analysis preview */}
        {songName && (
          <div className="dm-share-analysis-preview">
            <div className="dm-share-analysis-preview__icon">P</div>
            <div className="dm-share-analysis-preview__info">
              <div className="dm-share-analysis-preview__song">{songName}</div>
              <div className="dm-share-analysis-preview__artist">{artist}</div>
              {finalScore != null && (
                <div className="dm-share-analysis-preview__score">
                  {t('community.dm.score')}: {finalScore}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="dm-error" style={{ margin: '8px 16px' }}>
            {error}
          </div>
        )}

        {/* Search input */}
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={t('community.dm.shareTo')}
          className="group-members-modal__search"
          autoFocus
        />

        {/* People list */}
        <div className="group-members-modal__list">
          {loading && (
            <div className="group-members-modal__searching">
              {t('community.dm.loadingConversations')}
            </div>
          )}

          {!loading && filteredPeople.length === 0 && (
            <div className="group-members-modal__searching">{t('community.dm.noResults')}</div>
          )}

          {filteredPeople.map((person) => (
            <div
              key={person.id}
              className="group-members-modal__member group-members-modal__member--selectable"
              onClick={() => handleSelect(person)}
              style={{
                opacity: sharing ? 0.5 : 1,
                pointerEvents: sharing ? 'none' : 'auto',
              }}
            >
              <div className="group-members-modal__member-avatar">
                {(person.displayName || '?')[0].toUpperCase()}
              </div>
              <span className="group-members-modal__member-name">{person.displayName}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ShareAnalysisToDMModal;
