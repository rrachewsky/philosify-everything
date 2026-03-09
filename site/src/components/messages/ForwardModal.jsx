// ForwardModal - Forward a DM message to any Philosify member
// Shows all people (not just collectives), with search field
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { config } from '../../config';

export function ForwardModal({ message, onClose, onForward }) {
  const { t } = useTranslation();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [forwarding, setForwarding] = useState(false);

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
      if (forwarding) return;
      setForwarding(true);
      try {
        await onForward(person.id, person.displayName);
      } finally {
        setForwarding(false);
      }
    },
    [onForward, forwarding]
  );

  // Client-side filter by display name
  const filteredPeople = filter
    ? people.filter((p) => (p.displayName || '').toLowerCase().includes(filter.toLowerCase()))
    : people;

  // Truncate message preview
  const preview = message?.message
    ? message.message.length > 80
      ? message.message.slice(0, 80) + '...'
      : message.message
    : '';

  return (
    <div className="group-members-overlay" onClick={onClose}>
      <div className="group-members-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="group-members-modal__header">
          <span className="group-members-modal__title">{t('community.dm.forwardMessage')}</span>
          <button className="group-members-modal__close" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Message preview */}
        {preview && (
          <div className="dm-forward-preview">
            <span className="dm-forward-preview__label">{t('community.dm.forwarded')}:</span>
            <span className="dm-forward-preview__text">{preview}</span>
          </div>
        )}

        {/* Search input */}
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={t('community.dm.forwardTo')}
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
              style={{ opacity: forwarding ? 0.5 : 1, pointerEvents: forwarding ? 'none' : 'auto' }}
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

export default ForwardModal;
