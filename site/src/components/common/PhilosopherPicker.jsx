// PhilosopherPicker - Modal for selecting 2 philosophers for panel analysis
// Reuses CSS from the colloquium roster modal (colloquium-modal, colloquium-roster)

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchPhilosopherRoster } from '@/services/api/philosopherPanel';

// Objectivist philosophers that Philosify auto-assigns (1 random)
const OBJECTIVIST_PICKS = ['Ayn Rand', 'Leonard Peikoff'];

export function PhilosopherPicker({ onConfirm, onClose, loading: externalLoading }) {
  const { t } = useTranslation();
  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [rosterError, setRosterError] = useState(null);
  const [selected, setSelected] = useState([]); // max 2
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    setRosterLoading(true);
    fetchPhilosopherRoster()
      .then((data) => {
        if (mounted) {
          // Exclude Objectivist picks — Philosify auto-assigns one
          const filtered = data.filter((p) => !OBJECTIVIST_PICKS.includes(p.name));
          setRoster(filtered);
          setRosterLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setRosterError(err.message);
          setRosterLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const toggleSelect = (name) => {
    setSelected((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      if (prev.length >= 2) return prev; // max 2
      return [...prev, name];
    });
  };

  const filtered = search.trim()
    ? roster.filter((p) => {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.era && p.era.toLowerCase().includes(q)) ||
          (p.school && p.school.toLowerCase().includes(q))
        );
      })
    : roster;

  const handleConfirm = () => {
    if (selected.length === 2) {
      onConfirm(selected);
    }
  };

  const isLoading = rosterLoading || externalLoading;

  return (
    <div className="philosopher-picker-overlay" onClick={isLoading ? undefined : onClose}>
      <div className="philosopher-picker" onClick={(e) => e.stopPropagation()}>
        <div className="philosopher-picker__header">
          <span className="philosopher-picker__title">
            {t('philosopherPanel.pickTitle', { defaultValue: 'Choose 2 Philosophers' })}
          </span>
          <button
            className="philosopher-picker__close"
            onClick={onClose}
            disabled={isLoading}
          >
            &times;
          </button>
        </div>

        <div className="philosopher-picker__auto-note">
          <span className="philosopher-picker__auto-icon">&#9733;</span>
          {t('philosopherPanel.autoNote', {
            defaultValue: 'Philosify will also assign Ayn Rand or Leonard Peikoff to the panel',
          })}
        </div>

        {rosterError && <div className="philosopher-picker__error">{rosterError}</div>}

        <div className="philosopher-picker__body">
          {rosterLoading ? (
            <div className="philosopher-picker__loading">
              {t('common.loading', { defaultValue: 'Loading...' })}
            </div>
          ) : (
            <>
              <div className="philosopher-picker__search-wrap">
                <input
                  type="text"
                  className="philosopher-picker__search"
                  placeholder={t('philosopherPanel.searchPlaceholder', {
                    defaultValue: 'Search by name, era, or school...',
                  })}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
                {search && (
                  <button
                    className="philosopher-picker__search-clear"
                    onClick={() => setSearch('')}
                    type="button"
                  >
                    &times;
                  </button>
                )}
              </div>

              <div className="philosopher-picker__count">
                {selected.length}/2{' '}
                {t('philosopherPanel.selected', { defaultValue: 'selected' })}
              </div>

              {filtered.length === 0 ? (
                <p className="philosopher-picker__empty">
                  {t('philosopherPanel.noMatch', {
                    defaultValue: 'No philosophers match your search',
                  })}
                </p>
              ) : (
                <div className="philosopher-picker__list">
                  {filtered.map((p) => {
                    const isSelected = selected.includes(p.name);
                    const isDisabled = !isSelected && selected.length >= 2;
                    return (
                      <button
                        key={p.name}
                        className={`philosopher-picker__item${isSelected ? ' philosopher-picker__item--selected' : ''}${isDisabled ? ' philosopher-picker__item--disabled' : ''}`}
                        onClick={() => !isDisabled && toggleSelect(p.name)}
                        disabled={isDisabled}
                      >
                        <div className="philosopher-picker__info">
                          <span className="philosopher-picker__name">{p.name}</span>
                          <span className="philosopher-picker__meta">
                            {p.era} &middot; {p.school}
                          </span>
                        </div>
                        <span className="philosopher-picker__check">
                          {isSelected ? '\u2713' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="philosopher-picker__footer">
          <button
            className="philosopher-picker__confirm"
            onClick={handleConfirm}
            disabled={selected.length !== 2 || isLoading}
          >
            {externalLoading
              ? t('philosopherPanel.analyzing', { defaultValue: 'Analyzing...' })
              : t('philosopherPanel.confirm', {
                  defaultValue: 'Start Panel Analysis (3 credits)',
                })}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PhilosopherPicker;
