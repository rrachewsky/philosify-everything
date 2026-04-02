// ============================================================
// HISTORICAL EVENT TICKER
// Same structure as Music/News/Cinema/Literature tickers:
//   .top-ten-ticker > .ticker-label + .ticker-track > .ticker-content > .ticker-item[]
//
// Only difference: NO looping. Single pass from -600 to 2026.
// Constant visual scroll speed (like the other tickers).
// translateX on .ticker-content is driven by currentYear.
// Dragging the ticker scrubs the global timeline.
// ============================================================

import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { HISTORICAL_EVENTS, EVENT_CATEGORIES, EVENT_HEADLINES } from '@/data/historicalEvents.js';
import '../TopTenTicker.css';

// Pre-sort events once (chronological, earliest first).
const SORTED_EVENTS = [...HISTORICAL_EVENTS].sort((a, b) => a.year - b.year);

export function HistoricalEventTicker({
  currentYear,
  setCurrentYear,
  formatYear,
  onEventClick,
  isPlaying,
  minYear,
  maxYear,
}) {
  const { t } = useTranslation();
  const trackRef = useRef(null);
  const contentRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(1000);
  const [itemOffsets, setItemOffsets] = useState(null);

  // Drag state — using mouse/touch events (like working tickers) instead of
  // pointer capture, so button clicks propagate naturally.
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const didDragRef = useRef(false);

  // ---- Measure container width ----
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => setContainerWidth(track.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    return () => ro.disconnect();
  }, []);

  // ---- Measure actual item positions after first render ----
  useLayoutEffect(() => {
    if (itemOffsets) return;
    const content = contentRef.current;
    if (!content) return;
    const items = content.querySelectorAll('.ticker-item');
    if (items.length !== SORTED_EVENTS.length) return;

    const contentRect = content.getBoundingClientRect();
    const offsets = Array.from(items).map(
      (item) => item.getBoundingClientRect().left - contentRect.left
    );
    setItemOffsets(offsets);
  });

  // ---- Year <-> pixel offset mapping ----
  const { yearToOffset, offsetToYear } = useMemo(() => {
    if (!itemOffsets || itemOffsets.length === 0) {
      return {
        yearToOffset: () => -99999,
        offsetToYear: () => minYear,
      };
    }

    const anchors = SORTED_EVENTS.map((event, i) => ({
      year: event.year,
      offset: itemOffsets[i],
    }));

    const avgItemWidth = itemOffsets.length > 1
      ? (itemOffsets[itemOffsets.length - 1] - itemOffsets[0]) / (itemOffsets.length - 1)
      : 400;
    const firstEventYear = anchors[0].year;
    const lastEventYear = anchors[anchors.length - 1].year;
    const earlyAvgYears = anchors.length > 1
      ? (anchors[1].year - anchors[0].year)
      : 100;
    const lateAvgYears = anchors.length > 1
      ? (anchors[anchors.length - 1].year - anchors[anchors.length - 2].year)
      : 100;
    const earlyRate = avgItemWidth / earlyAvgYears;
    const lateRate = avgItemWidth / lateAvgYears;

    const _yearToOffset = (year) => {
      if (year <= firstEventYear) {
        return anchors[0].offset - (firstEventYear - year) * earlyRate;
      }
      if (year >= lastEventYear) {
        return anchors[anchors.length - 1].offset
          + (year - lastEventYear) * lateRate;
      }
      for (let i = 0; i < anchors.length - 1; i++) {
        if (year >= anchors[i].year && year <= anchors[i + 1].year) {
          const ratio =
            (year - anchors[i].year) / (anchors[i + 1].year - anchors[i].year);
          return anchors[i].offset + ratio * (anchors[i + 1].offset - anchors[i].offset);
        }
      }
      return 0;
    };

    const _offsetToYear = (offset) => {
      if (offset <= anchors[0].offset) {
        return firstEventYear - (anchors[0].offset - offset) / earlyRate;
      }
      if (offset >= anchors[anchors.length - 1].offset) {
        return lastEventYear
          + (offset - anchors[anchors.length - 1].offset) / lateRate;
      }
      for (let i = 0; i < anchors.length - 1; i++) {
        if (offset >= anchors[i].offset && offset <= anchors[i + 1].offset) {
          const ratio =
            (offset - anchors[i].offset) / (anchors[i + 1].offset - anchors[i].offset);
          return anchors[i].year + ratio * (anchors[i + 1].year - anchors[i].year);
        }
      }
      return minYear;
    };

    return { yearToOffset: _yearToOffset, offsetToYear: _offsetToYear };
  }, [itemOffsets, minYear]);

  // ---- Drag handlers (mouse/touch, same pattern as working tickers) ----
  const handleMouseDown = useCallback((e) => {
    if (!trackRef.current) return;
    setIsDragging(true);
    didDragRef.current = false;
    dragStartXRef.current = e.pageX;
    dragStartOffsetRef.current = yearToOffset(currentYear);
  }, [currentYear, yearToOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    const deltaX = e.pageX - dragStartXRef.current;
    if (Math.abs(deltaX) > 3) didDragRef.current = true;
    const newOffset = dragStartOffsetRef.current - deltaX;
    const newYear = Math.max(minYear, Math.min(maxYear, offsetToYear(newOffset)));
    setCurrentYear(newYear);
  }, [isDragging, minYear, maxYear, setCurrentYear, offsetToYear]);

  const handleTouchStart = useCallback((e) => {
    setIsDragging(true);
    didDragRef.current = false;
    dragStartXRef.current = e.touches[0].pageX;
    dragStartOffsetRef.current = yearToOffset(currentYear);
  }, [currentYear, yearToOffset]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].pageX - dragStartXRef.current;
    if (Math.abs(deltaX) > 3) didDragRef.current = true;
    const newOffset = dragStartOffsetRef.current - deltaX;
    const newYear = Math.max(minYear, Math.min(maxYear, offsetToYear(newOffset)));
    setCurrentYear(newYear);
  }, [isDragging, minYear, maxYear, setCurrentYear, offsetToYear]);

  // ---- Click handler (only fires if user didn't drag) ----
  const handleEventClick = useCallback((event) => {
    if (didDragRef.current) return;
    onEventClick(event);
  }, [onEventClick]);

  // ---- Render ----
  if (SORTED_EVENTS.length === 0) return null;

  const scrollOffset = yearToOffset(currentYear);
  const translateX = containerWidth - scrollOffset;

  return (
    <div className="top-ten-ticker" style={{ direction: 'ltr', position: 'relative', borderRadius: '6px' }}>
      <div className="ticker-label">
        <span className="ticker-icon">&#128240;</span>
        <span>{t('constellation.breakingNews', 'BREAKING')}</span>
      </div>
      <div
        className="ticker-track"
        ref={trackRef}
        style={{
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >
        <div
          ref={contentRef}
          className="ticker-content"
          style={{
            transform: `translateX(${translateX}px)`,
            animation: 'none',
          }}
        >
          {SORTED_EVENTS.map((event) => {
            const cat = EVENT_CATEGORIES[event.category] || EVENT_CATEGORIES.political;
            const headline = t(`historicalEvents.${event.id}.headline`, {
              defaultValue: EVENT_HEADLINES[event.id] || event.title,
            });

            return (
              <button
                key={event.id}
                className="ticker-item"
                onClick={() => handleEventClick(event)}
                style={{ direction: 'ltr' }}
              >
                <span className="ticker-rank">{cat.icon} {formatYear(event.year)}</span>
                <span className="ticker-separator">&mdash;</span>
                <span
                  className="ticker-song"
                  style={{ maxWidth: 'none', overflow: 'visible', textOverflow: 'unset' }}
                >
                  {headline}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HistoricalEventTicker;
