// PhilosopherPickerModal - v2 philosopher picker (ModalV2 transaction).
// Behavior lifted 1:1 from components/common/PhilosopherPicker.jsx:
// roster via GET /api/colloquium/roster (fetchPhilosopherRoster), search by
// name/era/school, exactly 3 selections, confirm shows the 3-credit cost.
import { useEffect, useState } from 'react';
import { ModalV2 } from '../../../components/v2/Modal.jsx';
import { Button } from '../../../components/v2/Button.jsx';
import { fetchPhilosopherRoster } from '../../../services/api/philosopherPanel.js';

export function PhilosopherPickerModal({ open, onClose, onConfirm, loading, t }) {
  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState(null);
  const [selected, setSelected] = useState([]); // max 3
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) {
      setSelected([]);
      setSearch('');
      return undefined;
    }
    let mounted = true;
    setRosterLoading(true);
    setRosterError(null);
    fetchPhilosopherRoster()
      .then((data) => {
        if (mounted) {
          setRoster(data);
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
  }, [open]);

  const toggleSelect = (name) => {
    setSelected((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      if (prev.length >= 3) return prev;
      return [...prev, name];
    });
    setSearch('');
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

  const isLoading = rosterLoading || loading;

  return (
    <ModalV2
      open={open}
      title={t('v2.news.panelPicker.title', 'CHOOSE 3 PHILOSOPHERS')}
      onClose={isLoading ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {t('v2.news.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={() => selected.length === 3 && onConfirm(selected)}
            disabled={selected.length !== 3 || isLoading}
          >
            {loading
              ? t('v2.news.panelPicker.analyzing', 'Analyzing…')
              : t('v2.news.panelPicker.confirm', 'Start panel analysis (3 credits)')}
          </Button>
        </>
      }
    >
      {rosterError && <div className="err">{rosterError}</div>}
      {rosterLoading ? (
        <div className="mnote">{t('v2.news.loading', 'Loading…')}</div>
      ) : (
        <>
          <input
            type="text"
            className="f"
            placeholder={t('v2.news.panelPicker.searchPlaceholder', 'Search by name, era, or school…')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
          <div className="pcount">
            {selected.length}/3 {t('v2.news.panelPicker.selected', 'selected')}
          </div>
          {filtered.length === 0 ? (
            <div className="mnote">
              {t('v2.news.panelPicker.noMatch', 'No philosophers match your search')}
            </div>
          ) : (
            <div className="plist">
              {filtered.map((p) => {
                const isSelected = selected.includes(p.name);
                const isDisabled = !isSelected && selected.length >= 3;
                return (
                  <button
                    key={p.name}
                    type="button"
                    className={`pitem${isSelected ? ' on' : ''}`}
                    onClick={() => !isDisabled && toggleSelect(p.name)}
                    disabled={isDisabled}
                  >
                    <span>
                      <span className="pname">{p.name}</span>
                      <span className="pmeta">
                        {p.era} · {p.school}
                      </span>
                    </span>
                    <span className="pcheck">{isSelected ? '✓' : ''}</span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </ModalV2>
  );
}

export default PhilosopherPickerModal;
