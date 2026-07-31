// ============================================================
// HISTORICAL EVENT INFO PANEL - Detailed view with Philosify's analysis
// ============================================================

import React from 'react';
import { useTranslation } from 'react-i18next';
import { EVENT_CATEGORIES } from '@/data/historicalEvents.js';

export function HistoricalEventInfoPanel({
  event,
  onClose,
  formatYear,
  isMobile,
}) {
  const { t } = useTranslation();

  if (!event) return null;

  const category = EVENT_CATEGORIES[event.category] || EVENT_CATEGORIES.political;

  // Get translated content with fallbacks to English data
  const translatedTitle = t(`historicalEvents.${event.id}.title`, { defaultValue: event.title });
  const translatedDescription = t(`historicalEvents.${event.id}.description`, { defaultValue: event.description });
  const translatedAnalysis = t(`historicalEvents.${event.id}.analysis`, { defaultValue: event.analysis });

  return (
    <div style={isMobile ? styles.containerMobile : styles.container}>
      {/* Mobile drag handle */}
      {isMobile && <div style={styles.dragHandle} />}

      {/* Close button — kit .mhead .x text glyph */}
      <button
        style={isMobile ? styles.closeButtonMobile : styles.closeButton}
        onClick={onClose}
        aria-label={t('constellation.close')}
      >
        ✕
      </button>

      {/* Scrollable content */}
      <div style={styles.scrollContainer}>
        {/* Year - positioned at top left, away from close button */}
        <div style={styles.yearContainer}>
          <div style={styles.year}>{formatYear(event.year)}</div>
        </div>

        {/* Header — category pill: chrome label + category DATA color dot */}
        <div style={styles.header}>
          <div style={styles.categoryBadge}>
            <span style={{ ...styles.categoryDot, background: category.color }} />
            <span style={styles.categoryLabel}>
              {t(`constellation.eventCategories.${event.category}`, category.label)}
            </span>
          </div>
        </div>

        {/* Title */}
        <h2 style={styles.title}>{translatedTitle}</h2>

        {/* Description */}
        <p style={styles.description}>{translatedDescription}</p>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Philosify's Analysis Section */}
        <div style={styles.analysisSection}>
          <div style={styles.analysisBadge}>
            <span>{t('constellation.philosifyAnalysis', "Philosify's Analysis")}</span>
          </div>
          <p style={styles.analysisText}>
            {(() => {
              // Match "Philosify's view:", "Philosify:", "Visão do Philosify:", etc.
              const match = translatedAnalysis.match(/(.*?)((?:[^.]*?)?Philosify(?:'s view|'s View)?[^:]*:)(.*)/s);
              if (!match) return translatedAnalysis;
              return (
                <>
                  {match[1]}
                  {/* the silver register — flat, one key phrase per cell (Law §2.3) */}
                  <span style={{ color: 'var(--silver)' }}>{match[2]}</span>
                  {match[3]}
                </>
              );
            })()}
          </p>
        </div>
      </div>
    </div>
  );
}

// v2 tokens only (WP6.3) — square-cornered instrument panel over the globe.
const styles = {
  // Desktop: left sidebar
  container: {
    position: 'absolute',
    top: 60,
    left: 70,
    width: 380,
    maxHeight: 'calc(100vh - 180px)',
    background: 'var(--bg)',
    borderRadius: 0,
    border: '1px solid var(--line-strong)',
    overflow: 'hidden',
    zIndex: 160,
    display: 'flex',
    flexDirection: 'column',
  },

  // Mobile: bottom sheet floating ABOVE the timeline controls stack (same
  // rule as ConstellationInfoPanel) so the filters stay reachable.
  containerMobile: {
    position: 'fixed',
    bottom: 138,
    left: 0,
    right: 0,
    height: 'min(62vh, calc(100dvh - 190px))',
    maxHeight: 'calc(100dvh - 190px)',
    background: 'var(--bg)',
    borderRadius: 0,
    border: '1px solid var(--line-strong)',
    overflow: 'hidden',
    zIndex: 200,
    display: 'flex',
    flexDirection: 'column',
  },

  dragHandle: {
    width: 40,
    height: 3,
    background: 'var(--line-strong)',
    borderRadius: 0,
    margin: '12px auto 8px',
    flexShrink: 0,
  },

  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    background: 'var(--bg)',
    border: '1px solid var(--line-strong)',
    borderRadius: 0,
    color: 'var(--ink-hi)',
    font: '400 14px/1 var(--f-ui)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  closeButtonMobile: {
    position: 'absolute',
    top: 8,
    right: 12,
    width: 40,
    height: 40,
    background: 'var(--bg)',
    border: '1px solid var(--line-strong)',
    borderRadius: 0,
    color: 'var(--ink-hi)',
    font: '400 16px/1 var(--f-ui)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  scrollContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px 24px',
  },

  yearContainer: {
    marginBottom: 8,
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },

  categoryBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '4px 11px',
    borderRadius: 'var(--radius-pill)',
    border: '1px solid var(--line-strong)',
  },

  // Category DATA color, carried by the dot only
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },

  categoryLabel: {
    font: '500 9.5px/1 var(--f-ui)',
    letterSpacing: '.14em',
    textTransform: 'uppercase',
    color: 'var(--ink-mid)',
  },

  // Display numeral — silver Michroma (the region's one silver)
  year: {
    fontFamily: 'var(--f-disp)',
    fontSize: 16,
    fontWeight: 400,
    color: 'var(--silver)',
    letterSpacing: '.08em',
  },

  title: {
    fontFamily: 'var(--f-disp)',
    fontSize: 16,
    fontWeight: 400,
    letterSpacing: '.06em',
    color: 'var(--ink-hi)',
    margin: '0 0 12px 0',
    lineHeight: 1.4,
  },

  // Reading tier — WHITE, justified (Law §2.1 / §3, 30 Jul)
  description: {
    font: '400 14.5px/1.7 var(--f-prose)',
    color: 'var(--ink-text)',
    textAlign: 'justify',
    margin: 0,
  },

  divider: {
    height: 1,
    background: 'var(--line)',
    margin: '20px 0',
  },

  analysisSection: {
    marginBottom: 16,
  },

  analysisBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: 'var(--ink-low)',
    font: '500 10px/1.4 var(--f-ui)',
    letterSpacing: '.18em',
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  analysisText: {
    font: '400 14.5px/1.75 var(--f-prose)',
    color: 'var(--ink-text)',
    margin: 0,
    textAlign: 'justify',
  },
};

export default HistoricalEventInfoPanel;
