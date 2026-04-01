// ============================================================
// HISTORICAL EVENT TICKER - Breaking News style ticker
// Shows historical events as the timeline progresses
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { HISTORICAL_EVENTS, EVENT_CATEGORIES } from '@/data/historicalEvents.js';

export function HistoricalEventTicker({
  currentYear,
  formatYear,
  onEventClick,
  isPlaying,
}) {
  const { t } = useTranslation();
  const [activeEvent, setActiveEvent] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [eventQueue, setEventQueue] = useState([]);
  const shownEventsRef = useRef(new Set());
  const lastYearRef = useRef(currentYear);
  const timeoutRef = useRef(null);

  // Check for new events when year changes
  useEffect(() => {
    // Only trigger events when timeline is moving forward
    if (currentYear <= lastYearRef.current) {
      lastYearRef.current = currentYear;
      return;
    }

    // Find events in the year range we just passed
    const newEvents = HISTORICAL_EVENTS.filter(event => {
      const eventYear = event.year;
      return (
        eventYear > lastYearRef.current &&
        eventYear <= currentYear &&
        !shownEventsRef.current.has(event.year + event.title)
      );
    });

    // Add new events to queue
    if (newEvents.length > 0) {
      newEvents.forEach(event => {
        shownEventsRef.current.add(event.year + event.title);
      });
      setEventQueue(prev => [...prev, ...newEvents]);
    }

    lastYearRef.current = currentYear;
  }, [currentYear]);

  // Process event queue - show one event at a time
  useEffect(() => {
    if (eventQueue.length > 0 && !activeEvent) {
      const nextEvent = eventQueue[0];
      setActiveEvent(nextEvent);
      setIsVisible(true);
      setEventQueue(prev => prev.slice(1));

      // Auto-hide after 6 seconds
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => setActiveEvent(null), 500); // Wait for fade out
      }, 6000);
    }
  }, [eventQueue, activeEvent]);

  // Reset shown events when timeline resets to beginning
  useEffect(() => {
    if (currentYear <= -590) {
      shownEventsRef.current.clear();
    }
  }, [currentYear]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClick = () => {
    if (activeEvent && onEventClick) {
      onEventClick(activeEvent);
    }
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    setIsVisible(false);
    setTimeout(() => setActiveEvent(null), 300);
  };

  if (!activeEvent) return null;

  const category = EVENT_CATEGORIES[activeEvent.category] || EVENT_CATEGORIES.political;

  return (
    <div
      style={{
        ...styles.container,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
      }}
      onClick={handleClick}
    >
      {/* Breaking News Label */}
      <div style={styles.breakingLabel}>
        <span style={styles.breakingDot} />
        <span style={styles.breakingText}>BREAKING</span>
      </div>

      {/* Event Content */}
      <div style={styles.content}>
        <span style={styles.categoryIcon}>{category.icon}</span>
        <span style={styles.year}>{formatYear(activeEvent.year)}</span>
        <span style={styles.divider}>|</span>
        <span style={styles.title}>{activeEvent.title}</span>
        <span style={styles.description}>— {activeEvent.description}</span>
      </div>

      {/* Click hint */}
      <div style={styles.clickHint}>
        {t('constellation.clickForAnalysis', 'Click for analysis')} →
      </div>

      {/* Dismiss button */}
      <button style={styles.dismissButton} onClick={handleDismiss}>
        ✕
      </button>

      {/* Progress bar */}
      <div style={styles.progressBar}>
        <div style={styles.progressFill} />
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(90deg, #B91C1C 0%, #DC2626 50%, #B91C1C 100%)',
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    zIndex: 150,
    cursor: 'pointer',
    transition: 'all 0.4s ease',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
    borderBottom: '2px solid #991B1B',
  },

  breakingLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: '#fff',
    padding: '4px 10px',
    borderRadius: 4,
    flexShrink: 0,
  },

  breakingDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#DC2626',
    animation: 'pulse 1s infinite',
  },

  breakingText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1,
  },

  content: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },

  categoryIcon: {
    fontSize: 16,
    flexShrink: 0,
  },

  year: {
    color: '#FEE2E2',
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "'Orbitron', monospace",
    flexShrink: 0,
  },

  divider: {
    color: 'rgba(255, 255, 255, 0.4)',
    flexShrink: 0,
  },

  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },

  description: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  clickHint: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },

  dismissButton: {
    width: 24,
    height: 24,
    background: 'rgba(0, 0, 0, 0.2)',
    border: 'none',
    borderRadius: 4,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    background: 'rgba(0, 0, 0, 0.2)',
  },

  progressFill: {
    height: '100%',
    background: '#FEE2E2',
    animation: 'shrink 6s linear forwards',
  },
};

// Add keyframes for animations
if (typeof document !== 'undefined') {
  const styleId = 'historical-ticker-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
      @keyframes shrink {
        from { width: 100%; }
        to { width: 0%; }
      }
    `;
    document.head.appendChild(styleSheet);
  }
}

export default HistoricalEventTicker;
