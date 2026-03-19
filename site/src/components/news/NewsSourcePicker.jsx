// ============================================================
// NewsSourcePicker - Modal for selecting news sources
// ============================================================
// Displays available news sources grouped by category.
// Users can unlock (1 credit) and then customize their selection.
// ============================================================

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/music-sidebar.css';

export function NewsSourcePicker({
  isOpen,
  onClose,
  unlocked,
  unlocking,
  saving,
  availableSources,
  enabledSources,
  defaultSources,
  onUnlock,
  onSave,
  balance,
}) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(new Set());

  // Initialize selected from enabledSources or defaultSources
  useEffect(() => {
    if (unlocked && enabledSources) {
      setSelected(new Set(enabledSources));
    } else {
      setSelected(new Set(defaultSources));
    }
  }, [unlocked, enabledSources, defaultSources]);

  if (!isOpen) return null;

  const toggleSource = (sourceId) => {
    if (!unlocked) return;
    const newSelected = new Set(selected);
    if (newSelected.has(sourceId)) {
      newSelected.delete(sourceId);
    } else {
      newSelected.add(sourceId);
    }
    setSelected(newSelected);
  };

  const selectAll = () => {
    const all = new Set();
    Object.values(availableSources).forEach((cat) => {
      cat.sources.forEach((s) => all.add(s.id));
    });
    setSelected(all);
  };

  const clearAll = () => {
    setSelected(new Set());
  };

  const handleSave = () => {
    onSave(Array.from(selected));
  };

  const handleUnlock = async () => {
    const result = await onUnlock();
    if (result.success) {
      // After unlock, initialize with all sources
      selectAll();
    }
  };

  const hasCredits = balance && balance.total !== undefined && balance.total >= 1;

  return (
    <div className="philosopher-picker-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="philosopher-picker">
        <div className="philosopher-picker__header">
          <h3 className="philosopher-picker__title">
            {t('news.sourcePicker.title')}
          </h3>
          <button className="philosopher-picker__close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="philosopher-picker__content">
          {!unlocked ? (
            // Locked state - show unlock prompt
            <div className="news-source-unlock">
              <div className="news-source-unlock__icon">&#128274;</div>
              <h4 className="news-source-unlock__title">
                {t('news.sourcePicker.unlockTitle')}
              </h4>
              <p className="news-source-unlock__desc">
                {t('news.sourcePicker.unlockDesc')}
              </p>
              <p className="news-source-unlock__default">
                {t('news.sourcePicker.currentDefault')}
                <br />
                <span className="news-source-unlock__default-list">
                  {defaultSources.join(', ')}
                </span>
              </p>
              <button
                className="music-analyze__button"
                onClick={handleUnlock}
                disabled={unlocking || !hasCredits}
              >
                {unlocking ? (
                  t('news.sourcePicker.unlocking')
                ) : (
                  <>
                    {t('news.sourcePicker.unlockButton')}
                    <span className="music-analyze__cost">
                      1 {t('philosopherPanel.credit')}
                    </span>
                  </>
                )}
              </button>
              {!hasCredits && (
                <p className="news-source-unlock__no-credits">
                  {t('news.sourcePicker.noCredits')}
                </p>
              )}
            </div>
          ) : (
            // Unlocked state - show source selection
            <>
              <div className="news-source-actions">
                <button
                  className="news-source-actions__btn"
                  onClick={selectAll}
                  type="button"
                >
                  {t('news.sourcePicker.selectAll')}
                </button>
                <button
                  className="news-source-actions__btn"
                  onClick={clearAll}
                  type="button"
                >
                  {t('news.sourcePicker.clearAll')}
                </button>
              </div>

              <div className="news-source-categories">
                {Object.entries(availableSources).map(([catKey, category]) => (
                  <div key={catKey} className="news-source-category">
                    <h4 className="news-source-category__title">
                      {t(`news.sourcePicker.categories.${catKey}`, category.label)}
                    </h4>
                    <div className="news-source-category__sources">
                      {category.sources.map((source) => (
                        <label
                          key={source.id}
                          className={`news-source-item ${selected.has(source.id) ? 'news-source-item--selected' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={selected.has(source.id)}
                            onChange={() => toggleSource(source.id)}
                          />
                          <span className="news-source-item__name">{source.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="news-source-footer">
                <span className="news-source-footer__count">
                  {selected.size} {t('news.sourcePicker.selected')}
                </span>
                <button
                  className="music-analyze__button"
                  onClick={handleSave}
                  disabled={saving || selected.size === 0}
                >
                  {saving
                    ? t('news.sourcePicker.saving')
                    : t('news.sourcePicker.save')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default NewsSourcePicker;
