// ============================================================
// HISTORICAL EVENT TICKER - EXACT same design as NEWS ticker
// Uses TopTenTicker.css classes, same colors, same speed
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

  // Get events up to current year
  const visibleEvents = HISTORICAL_EVENTS.filter(event => event.year <= currentYear);

  if (visibleEvents.length === 0) return null;

  // Duplicate for seamless loop (same as NEWS ticker)
  const duplicated = [...visibleEvents, ...visibleEvents, ...visibleEvents];
  const count = visibleEvents.length;
  const animationDuration = count * 12; // 12 seconds per item

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
      >
        <div
          className={`ticker-content ${isDragging ? 'paused' : ''}`}
          style={{ animationDuration: `${animationDuration}s` }}
        >
          {duplicated.map((event, i) => {
            const category = EVENT_CATEGORIES[event.category] || EVENT_CATEGORIES.political;
            return (
              <button
                key={`${event.year}-${event.title}-${i}`}
                className="ticker-item"
                onClick={() => onEventClick(event)}
                style={{ direction: 'ltr' }}
              >
                <span className="ticker-rank">{category.icon} {formatYear(event.year)}</span>
                <span className="ticker-separator">—</span>
                <span className="ticker-song">{event.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HistoricalEventTicker;
