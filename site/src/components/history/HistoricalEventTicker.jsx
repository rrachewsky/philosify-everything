// ============================================================
// HISTORICAL EVENT TICKER - Breaking News style ticker
// Uses same design as NEWS category ticker (TopTenTicker.css)
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { HISTORICAL_EVENTS, EVENT_CATEGORIES } from '@/data/historicalEvents.js';
import '../TopTenTicker.css';

export function HistoricalEventTicker({
  currentYear,
  formatYear,
  onEventClick,
  isPlaying,
}) {
  const { t } = useTranslation();
  const [activeEvent, setActiveEvent] = useState(null);
  const [eventQueue, setEventQueue] = useState([]);
  const shownEventsRef = useRef(new Set());
  const lastYearRef = useRef(currentYear);
  const timeoutRef = useRef(null);
  const trackRef = useRef(null);
  
  // Drag state for manual scrolling
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

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
      setEventQueue(prev => prev.slice(1));

      // Auto-dismiss after 8 seconds
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setActiveEvent(null);
      }, 8000);
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

  // Drag handlers for manual scrolling
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

  const category = activeEvent 
    ? (EVENT_CATEGORIES[activeEvent.category] || EVENT_CATEGORIES.political)
    : null;

  return (
    <div 
      className="top-ten-ticker" 
      style={{ 
        direction: 'ltr', 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        borderRadius: 0,
        // Red theme for historical events (like CNN breaking news)
        background: 'linear-gradient(90deg, rgba(139, 0, 0, 0.95) 0%, rgba(185, 28, 28, 0.95) 50%, rgba(139, 0, 0, 0.95) 100%)',
        borderBottom: '1px solid rgba(220, 38, 38, 0.5)',
        boxShadow: '0 2px 15px rgba(185, 28, 28, 0.3)',
      }}
    >
      {/* Year Display Label */}
      <div 
        className="ticker-label" 
        style={{ 
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          minWidth: 90,
          justifyContent: 'center',
        }}
      >
        <span className="ticker-icon" style={{ fontSize: 12 }}>&#128337;</span>
        <span style={{ fontFamily: "'Orbitron', monospace", letterSpacing: 1 }}>
          {formatYear(currentYear)}
        </span>
      </div>

      {/* Breaking News Label (when event active) */}
      {activeEvent && (
        <div 
          className="ticker-label" 
          style={{ 
            background: '#fff',
            marginLeft: 0,
          }}
        >
          <span 
            style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              background: '#DC2626',
              animation: 'pulse 1s infinite',
            }} 
          />
          <span style={{ color: '#DC2626', fontWeight: 800 }}>BREAKING</span>
        </div>
      )}

      {/* Scrolling Track */}
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
          style={{ 
            animationDuration: activeEvent ? '30s' : '0s',
            animation: activeEvent ? undefined : 'none',
          }}
        >
          {activeEvent ? (
            <button
              className="ticker-item"
              onClick={handleClick}
              style={{ 
                direction: 'ltr',
                borderRight: 'none',
              }}
            >
              <span className="ticker-rank" style={{ color: '#FCA5A5' }}>
                {category?.icon} {formatYear(activeEvent.year)}
              </span>
              <span className="ticker-separator">|</span>
              <span className="ticker-song" style={{ maxWidth: 'none', fontWeight: 700 }}>
                {activeEvent.title}
              </span>
              <span className="ticker-separator">—</span>
              <span className="ticker-artist" style={{ maxWidth: 'none', color: 'rgba(255,255,255,0.85)' }}>
                {activeEvent.description}
              </span>
              <span 
                style={{ 
                  marginLeft: 12,
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 11,
                  whiteSpace: 'nowrap',
                }}
              >
                {t('constellation.clickForAnalysis', 'Click for analysis')} &rarr;
              </span>
            </button>
          ) : (
            <div 
              style={{ 
                padding: '0 16px',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>&#128205;</span>
              <span>{t('constellation.timelineHint', 'Play timeline to see historical events')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Dismiss button when event active */}
      {activeEvent && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveEvent(null);
          }}
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: 'none',
            borderRadius: 4,
            color: 'rgba(255,255,255,0.8)',
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginRight: 8,
            flexShrink: 0,
            fontSize: 12,
          }}
        >
          &#10005;
        </button>
      )}
    </div>
  );
}

// Add keyframes for pulse animation
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
    `;
    document.head.appendChild(styleSheet);
  }
}

export default HistoricalEventTicker;
