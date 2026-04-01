// ============================================================
// HISTORICAL EVENT INFO PANEL - Detailed view with Objectivist analysis
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

  return (
    <div style={isMobile ? styles.containerMobile : styles.container}>
      {/* Mobile drag handle */}
      {isMobile && <div style={styles.dragHandle} />}

      {/* Close button */}
      <button
        style={isMobile ? styles.closeButtonMobile : styles.closeButton}
        onClick={onClose}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Scrollable content */}
      <div style={styles.scrollContainer}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ ...styles.categoryBadge, background: `${category.color}22`, borderColor: category.color }}>
            <span style={styles.categoryIcon}>{category.icon}</span>
            <span style={{ ...styles.categoryLabel, color: category.color }}>{category.label}</span>
          </div>
          <div style={styles.year}>{formatYear(event.year)}</div>
        </div>

        {/* Title */}
        <h2 style={styles.title}>{event.title}</h2>

        {/* Description */}
        <p style={styles.description}>{event.description}</p>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Objectivist Analysis Section */}
        <div style={styles.analysisSection}>
          <div style={styles.analysisBadge}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span>{t('constellation.objectivistAnalysis', 'Objectivist Analysis')}</span>
          </div>
          <p style={styles.analysisText}>{event.analysis}</p>
        </div>

        {/* Context note */}
        <div style={styles.contextNote}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <span>
            {t('constellation.analysisNote', 'Analysis based on principles of reason, individual rights, and capitalism.')}
          </span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  // Desktop: left sidebar
  container: {
    position: 'absolute',
    top: 60,
    left: 70,
    width: 380,
    maxHeight: 'calc(100vh - 180px)',
    background: 'rgba(15, 15, 25, 0.95)',
    borderRadius: 12,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(12px)',
    overflow: 'hidden',
    zIndex: 160,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  },

  // Mobile: bottom sheet
  containerMobile: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '75vh',
    maxHeight: '75vh',
    background: 'rgba(15, 15, 25, 0.98)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderBottom: 'none',
    backdropFilter: 'blur(16px)',
    overflow: 'hidden',
    zIndex: 200,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.5)',
  },

  dragHandle: {
    width: 40,
    height: 4,
    background: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    margin: '12px auto 8px',
    flexShrink: 0,
  },

  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: 6,
    color: '#F2F2F5',
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
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: 8,
    color: '#F2F2F5',
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

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  categoryBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 16,
    border: '1px solid',
  },

  categoryIcon: {
    fontSize: 14,
  },

  categoryLabel: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  year: {
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "'Orbitron', monospace",
    color: '#D6158C',
  },

  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#F2F2F5',
    margin: '0 0 12px 0',
    lineHeight: 1.3,
  },

  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 1.6,
    margin: 0,
  },

  divider: {
    height: 1,
    background: 'rgba(255, 255, 255, 0.1)',
    margin: '20px 0',
  },

  analysisSection: {
    marginBottom: 16,
  },

  analysisBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#D6158C',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  analysisText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 1.7,
    margin: 0,
    textAlign: 'justify',
  },

  contextNote: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    background: 'rgba(214, 21, 140, 0.1)',
    borderRadius: 8,
    border: '1px solid rgba(214, 21, 140, 0.2)',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 1.5,
  },
};

export default HistoricalEventInfoPanel;
