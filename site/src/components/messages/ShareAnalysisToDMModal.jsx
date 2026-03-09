// ShareAnalysisToDMModal - Share an analysis as a rich card via DM
// Multi-select: user can pick multiple recipients, then click Send
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { config } from '../../config';
import { dmService } from '../../services/api/dm.js';

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

  const { songName, artist, philosophicalNote } = analysisData || {};

  // Render as portal to body for proper overlay
  const modalContent = (
    <div
      className="group-members-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="group-members-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(15, 8, 40, 0.98)',
          border: '1px solid rgba(120, 100, 180, 0.3)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '400px',
          height: '70vh',
          maxHeight: '550px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div
          className="group-members-modal__header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            borderBottom: '1px solid rgba(120, 100, 180, 0.15)',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              color: '#fff',
            }}
          >
            {t('community.dm.shareAnalysis')}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '24px',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        {/* Analysis preview */}
        {songName && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: 'rgba(90, 30, 160, 0.15)',
              borderLeft: '3px solid #8a2be2',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #8a2be2, #5a1ea0)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '16px',
              }}
            >
              P
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '13px' }}>{songName}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{artist}</div>
              {philosophicalNote && (
                <div
                  style={{ color: '#00e0f0', fontSize: '11px', marginTop: '4px', lineHeight: 1.3 }}
                >
                  {philosophicalNote.length > 60
                    ? philosophicalNote.substring(0, 60) + '...'
                    : philosophicalNote}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            style={{
              margin: '8px 16px',
              padding: '8px 12px',
              background: 'rgba(255, 50, 50, 0.15)',
              border: '1px solid rgba(255, 50, 50, 0.3)',
              borderRadius: '6px',
              color: '#ff6b6b',
              fontSize: '12px',
              flexShrink: 0,
            }}
          >
            {error}
          </div>
        )}

        {/* Search input */}
        <div style={{ padding: '12px 16px', flexShrink: 0 }}>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t('community.dm.searchPeople') || 'Search people...'}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'rgba(15, 8, 35, 0.9)',
              border: '1px solid rgba(120, 100, 180, 0.25)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            autoFocus
          />
        </div>

        {/* Selected count */}
        {selected.size > 0 && (
          <div
            style={{
              padding: '0 16px 8px',
              fontSize: '12px',
              color: '#00e0f0',
              flexShrink: 0,
            }}
          >
            {selected.size} {t('community.dm.selected') || 'selected'}
          </div>
        )}

        {/* People list - scrollable */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '0 12px',
          }}
        >
          {loading && (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '13px',
              }}
            >
              {t('community.dm.loadingConversations')}
            </div>
          )}

          {!loading && filteredPeople.length === 0 && (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '13px',
              }}
            >
              {t('community.dm.noResults')}
            </div>
          )}

          {filteredPeople.map((person) => {
            const isSelected = selected.has(person.id);
            return (
              <div
                key={person.id}
                onClick={() => toggleSelect(person.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 8px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(0, 180, 200, 0.12)' : 'transparent',
                  border: isSelected ? '1px solid rgba(0, 180, 200, 0.3)' : '1px solid transparent',
                  marginBottom: '4px',
                  transition: 'all 0.15s',
                }}
              >
                {/* Checkbox */}
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    border: isSelected ? '2px solid #00e0f0' : '2px solid rgba(120, 100, 180, 0.4)',
                    background: isSelected ? '#00e0f0' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s',
                  }}
                >
                  {isSelected && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#0a0020"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>

                {/* Avatar */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background:
                      'linear-gradient(135deg, rgba(120, 100, 180, 0.4), rgba(90, 70, 150, 0.4))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '14px',
                    flexShrink: 0,
                  }}
                >
                  {(person.displayName || '?')[0].toUpperCase()}
                </div>

                {/* Name */}
                <span style={{ color: '#fff', fontSize: '14px', flex: 1 }}>
                  {person.displayName}
                </span>
              </div>
            );
          })}
        </div>

        {/* Send button */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(120, 100, 180, 0.15)',
            flexShrink: 0,
          }}
        >
          <button
            onClick={handleSend}
            disabled={selected.size === 0 || sending}
            style={{
              width: '100%',
              padding: '12px',
              background:
                selected.size > 0
                  ? 'linear-gradient(135deg, #00e0f0, #0099aa)'
                  : 'rgba(120, 100, 180, 0.2)',
              border: 'none',
              borderRadius: '8px',
              color: selected.size > 0 ? '#0a0020' : 'rgba(255,255,255,0.4)',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '13px',
              fontWeight: 700,
              cursor: selected.size > 0 ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              opacity: sending ? 0.7 : 1,
            }}
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

  // Use portal to render at body level
  return createPortal(modalContent, document.body);
}

export default ShareAnalysisToDMModal;
