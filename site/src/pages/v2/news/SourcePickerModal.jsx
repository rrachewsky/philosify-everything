// SourcePickerModal - v2 news source preferences picker (ModalV2 transaction).
// Behavior lifted 1:1 from components/news/NewsSourcePicker.jsx:
// locked state -> unlock for 1 credit (POST /api/user/news-preferences/unlock
// via useNewsPreferences.unlock); unlocked state -> category checkboxes,
// select all / clear all, auto-save on ANY close when the selection changed.
import { useEffect, useRef, useState } from 'react';
import { ModalV2 } from '../../../components/v2/Modal.jsx';
import { Button } from '../../../components/v2/Button.jsx';

export function SourcePickerModal({ open, onClose, prefs, balance, t }) {
  const {
    unlocked,
    unlocking,
    saving,
    availableSources,
    enabledSources,
    defaultSources,
    unlock,
    updateSources,
  } = prefs;

  const [selected, setSelected] = useState(new Set());
  const [justUnlocked, setJustUnlocked] = useState(false);
  const initialSelectionRef = useRef(null);

  const sources = availableSources || {};
  const defaults = defaultSources || [];

  // Initialize selection from enabled/default sources (same rules as the old picker)
  useEffect(() => {
    if (!open) return;
    if (justUnlocked) return;
    if (unlocked && enabledSources && enabledSources.length > 0) {
      setSelected(new Set(enabledSources));
      initialSelectionRef.current = new Set(enabledSources);
    } else if (unlocked && (!enabledSources || enabledSources.length === 0)) {
      const all = new Set();
      Object.values(sources).forEach((cat) => {
        (cat.sources || []).forEach((s) => all.add(s.id));
      });
      setSelected(all);
      initialSelectionRef.current = all;
    } else if (!unlocked) {
      setSelected(new Set(defaults));
      initialSelectionRef.current = new Set(defaults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, unlocked, enabledSources, defaultSources, availableSources, justUnlocked]);

  useEffect(() => {
    if (!open) setJustUnlocked(false);
  }, [open]);

  const toggleSource = (sourceId) => {
    if (!unlocked) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sourceId)) next.delete(sourceId);
      else next.add(sourceId);
      return next;
    });
  };

  const selectAll = () => {
    const all = new Set();
    Object.values(sources).forEach((cat) => {
      (cat.sources || []).forEach((s) => all.add(s.id));
    });
    setSelected(all);
  };

  const clearAll = () => setSelected(new Set());

  const hasChanged = () => {
    if (!initialSelectionRef.current) return selected.size > 0;
    if (selected.size !== initialSelectionRef.current.size) return true;
    for (const id of selected) {
      if (!initialSelectionRef.current.has(id)) return true;
    }
    return false;
  };

  // Save-and-close — used by ALL close paths (X, overlay, Escape, Save button)
  const saveAndClose = async () => {
    if (unlocked && hasChanged() && selected.size > 0) {
      try {
        await updateSources(Array.from(selected));
      } catch (err) {
        console.error('[SourcePickerModal] Save error:', err);
      }
    }
    onClose();
  };

  const handleUnlock = async () => {
    const result = await unlock();
    if (result?.success) {
      setJustUnlocked(true);
      selectAll();
    }
  };

  const hasCredits = balance && balance.total !== undefined && balance.total >= 1;

  return (
    <ModalV2
      open={open}
      title={t('v2.news.sourcePicker.title', 'NEWS SOURCES')}
      onClose={saveAndClose}
      footer={
        !unlocked ? (
          <Button onClick={handleUnlock} disabled={unlocking || !hasCredits}>
            {unlocking
              ? t('v2.news.sourcePicker.unlocking', 'Unlocking…')
              : t('v2.news.sourcePicker.unlockButton', 'Unlock source selection — 1 credit')}
          </Button>
        ) : (
          <>
            <span className="pcount" style={{ marginRight: 'auto', alignSelf: 'center' }}>
              {selected.size} {t('v2.news.sourcePicker.selected', 'selected')}
            </span>
            <Button onClick={saveAndClose} disabled={saving || selected.size === 0}>
              {saving
                ? t('v2.news.sourcePicker.saving', 'Saving…')
                : t('v2.news.sourcePicker.save', 'Save selection')}
            </Button>
          </>
        )
      }
    >
      {!unlocked ? (
        <div>
          <div className="ulk-title">
            {t('v2.news.sourcePicker.unlockTitle', 'Customize your news sources')}
          </div>
          <p className="ulk-desc">
            {t(
              'v2.news.sourcePicker.unlockDesc',
              'Choose which news outlets you want to see. Pay once, customize forever.'
            )}
          </p>
          <p className="ulk-def">
            {t('v2.news.sourcePicker.currentDefault', 'Current default sources:')}
            <br />
            {defaults.join(', ')}
          </p>
          {!hasCredits && (
            <div className="err">
              {t('v2.news.sourcePicker.noCredits', 'You need at least 1 credit to unlock.')}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="srcacts">
            <a
              href="#all"
              onClick={(e) => {
                e.preventDefault();
                selectAll();
              }}
            >
              {t('v2.news.sourcePicker.selectAll', 'Select all')}
            </a>
            <a
              href="#none"
              onClick={(e) => {
                e.preventDefault();
                clearAll();
              }}
            >
              {t('v2.news.sourcePicker.clearAll', 'Clear all')}
            </a>
          </div>
          {Object.entries(sources).map(([catKey, category]) => (
            <div key={catKey} className="srccat">
              <h4>{t(`v2.news.sourcePicker.categories.${catKey}`, category.label || catKey)}</h4>
              <div className="srcgrid">
                {(category.sources || []).map((source) => (
                  <label
                    key={source.id}
                    className={`srcitem${selected.has(source.id) ? ' on' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(source.id)}
                      onChange={() => toggleSource(source.id)}
                    />
                    <span>{source.name}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </ModalV2>
  );
}

export default SourcePickerModal;
