// ============================================================
// HISTORICAL EVENT TICKER - Continuous chronological flow
// Events scroll from oldest to newest, no looping/restart
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HISTORICAL_EVENTS, EVENT_CATEGORIES } from '@/data/historicalEvents.js';
import '../TopTenTicker.css';

export function HistoricalEventTicker({
  currentYear,
  formatYear,
  onEventClick,
}) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const trackRef = useRef(null);
  const contentRef = useRef(null);
  const lastScrollRef = useRef(0);

  // Get events up to current year (chronological order - oldest first)
  const visibleEvents = HISTORICAL_EVENTS.filter(event => event.year <= currentYear);

  // Auto-scroll to keep newest events visible
  useEffect(() => {
    if (contentRef.current && trackRef.current && !isDragging) {
      // Scroll to show the end (most recent events)
      const scrollWidth = contentRef.current.scrollWidth;
      const clientWidth = trackRef.current.clientWidth;
      if (scrollWidth > clientWidth) {
        // Smooth scroll to end
        trackRef.current.scrollLeft = scrollWidth - clientWidth;
      }
    }
  }, [visibleEvents.length, isDragging]);

  if (visibleEvents.length === 0) return null;

  const handleMouseDown = (e) => {
    if (!trackRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - trackRef.current.offsetLeft);
    setScrollLeftState(trackRef.current.scrollLeft);
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    trackRef.current.scrollLeft = scrollLeftState - (x - startX) * 2;
  };

  return (
    <div className="top-ten-ticker" style={{ direction: 'ltr', position: 'relative', borderRadius: '6px' }}>
      <div className="ticker-label">
        <span className="ticker-icon">&#128240;</span>
        <span>{t('constellation.breakingNews', 'BREAKING')}</span>
      </div>
      <div
        className="ticker-track"
        ref={trackRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{ overflowX: 'auto' }}
      >
        <div
          ref={contentRef}
          className="ticker-content"
          style={{ 
            animation: 'none',
            width: 'max-content',
          }}
        >
          {visibleEvents.map((event, i) => {
            const category = EVENT_CATEGORIES[event.category] || EVENT_CATEGORIES.political;
            // Try to get translated title, fallback to English
            const translatedTitle = t(`historicalEvents.${event.id}`, { defaultValue: event.title });
            return (
              <button
                key={event.id || `${event.year}-${i}`}
                className="ticker-item"
                onClick={() => onEventClick(event)}
                style={{ direction: 'ltr' }}
              >
                <span className="ticker-rank">{category.icon} {formatYear(event.year)}</span>
                <span className="ticker-separator">—</span>
                <span className="ticker-song">{translatedTitle}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HistoricalEventTicker;
