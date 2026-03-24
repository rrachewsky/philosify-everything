// ============================================================
// TIMELINE CONTROLS - Play/pause, scrubber, era filtering
// ============================================================

import React, { useCallback, useRef, useState } from 'react';
import { ERAS } from '@hooks/useConstellation';

const SPEEDS = [0.5, 1, 2, 4, 8];

export function TimelineControls({
  currentYear,
  setCurrentYear,
  isPlaying,
  togglePlay,
  playbackSpeed,
  setPlaybackSpeed,
  jumpToEra,
  formatYear,
  minYear,
  maxYear,
  selectedEra,
  toggleEraFilter,
}) {
  const sliderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showEras, setShowEras] = useState(false);

  // Calculate slider position (0-100)
  const sliderPercent = ((currentYear - minYear) / (maxYear - minYear)) * 100;

  // Handle slider drag
  const handleSliderChange = useCallback((e) => {
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const year = minYear + percent * (maxYear - minYear);
    setCurrentYear(year);
  }, [minYear, maxYear, setCurrentYear]);

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    handleSliderChange(e);
  }, [handleSliderChange]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      handleSliderChange(e);
    }
  }, [isDragging, handleSliderChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Attach/detach global mouse events
  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Cycle speed
  const cycleSpeed = useCallback(() => {
    const currentIndex = SPEEDS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % SPEEDS.length;
    setPlaybackSpeed(SPEEDS[nextIndex]);
  }, [playbackSpeed, setPlaybackSpeed]);

  return (
    <div style={styles.container}>
      {/* Era buttons */}
      <div style={styles.eraRow}>
        <button
          style={styles.eraToggle}
          onClick={() => setShowEras(!showEras)}
          aria-label="Show eras"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        
        {showEras && (
          <div style={styles.eraButtons}>
            {ERAS.map(era => (
              <button
                key={era.id}
                style={{
                  ...styles.eraButton,
                  ...(selectedEra === era.id ? styles.eraButtonActive : {}),
                }}
                onClick={() => toggleEraFilter(era.id)}
                title={`${era.startYear < 0 ? Math.abs(era.startYear) + ' BC' : era.startYear} - ${era.endYear < 0 ? Math.abs(era.endYear) + ' BC' : era.endYear}`}
              >
                {era.label}
              </button>
            ))}
            {/* Show All button */}
            {selectedEra && (
              <button
                style={{
                  ...styles.eraButton,
                  ...styles.eraButtonClear,
                }}
                onClick={() => toggleEraFilter(selectedEra)}
              >
                ✕ Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main controls row */}
      <div style={styles.controlsRow}>
        {/* Play/Pause */}
        <button
          style={styles.playButton}
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Slider */}
        <div
          ref={sliderRef}
          style={styles.sliderTrack}
          onMouseDown={handleMouseDown}
        >
          <div
            style={{
              ...styles.sliderFill,
              width: `${sliderPercent}%`,
            }}
          />
          <div
            style={{
              ...styles.sliderThumb,
              left: `${sliderPercent}%`,
            }}
          />
          
          {/* Era markers on slider */}
          {ERAS.map(era => {
            const percent = ((era.year - minYear) / (maxYear - minYear)) * 100;
            return (
              <div
                key={era.label}
                style={{
                  ...styles.eraMarker,
                  left: `${percent}%`,
                }}
                title={era.label}
              />
            );
          })}
        </div>

        {/* Speed control */}
        <button
          style={styles.speedButton}
          onClick={cycleSpeed}
          aria-label={`Speed: ${playbackSpeed}x`}
        >
          {playbackSpeed}x
        </button>
      </div>

      {/* Year range labels */}
      <div style={styles.rangeLabels}>
        <span>{formatYear(minYear)}</span>
        <span>{formatYear(maxYear)}</span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(transparent, rgba(10, 10, 15, 0.95))',
    padding: '40px 24px 24px',
    zIndex: 100,
  },

  eraRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },

  eraToggle: {
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
  },

  eraButtons: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },

  eraButton: {
    padding: '6px 12px',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  eraButtonActive: {
    background: 'rgba(214, 21, 140, 0.3)',
    borderColor: '#D6158C',
    color: '#F2F2F5',
  },

  eraButtonClear: {
    background: 'rgba(255, 100, 100, 0.15)',
    borderColor: 'rgba(255, 100, 100, 0.4)',
    color: 'rgba(255, 150, 150, 0.9)',
  },

  controlsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },

  playButton: {
    width: 48,
    height: 48,
    background: '#D6158C',
    border: 'none',
    borderRadius: '50%',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 20px rgba(214, 21, 140, 0.4)',
  },

  sliderTrack: {
    flex: 1,
    height: 8,
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    position: 'relative',
    cursor: 'pointer',
  },

  sliderFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    background: 'linear-gradient(90deg, #D6158C, #89CFF0)',
    borderRadius: 4,
    pointerEvents: 'none',
  },

  sliderThumb: {
    position: 'absolute',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: 18,
    height: 18,
    background: '#F2F2F5',
    borderRadius: '50%',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    pointerEvents: 'none',
  },

  eraMarker: {
    position: 'absolute',
    top: -4,
    transform: 'translateX(-50%)',
    width: 2,
    height: 16,
    background: 'rgba(255, 255, 255, 0.2)',
    pointerEvents: 'none',
  },

  speedButton: {
    padding: '8px 12px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    color: '#F2F2F5',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
    minWidth: 48,
  },

  rangeLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 8,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    paddingLeft: 64,
    paddingRight: 60,
  },
};

export default TimelineControls;
