// ============================================================
// TIMELINE CONTROLS - Play/pause, scrubber, era filtering, school filtering
// ============================================================

import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ERAS, SCHOOL_COLORS } from '@hooks/useConstellation';

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
  selectedSchool,
  toggleSchoolFilter,
  schools = [],
}) {
  const { t } = useTranslation();
  const sliderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showEras, setShowEras] = useState(false);
  const [showSchools, setShowSchools] = useState(false);

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
      {/* Filter toggles row */}
      <div style={styles.topRow}>
        {/* Era toggle */}
        <button
          style={{
            ...styles.filterToggle,
            ...(showEras ? styles.filterToggleActive : {}),
          }}
          onClick={() => setShowEras(!showEras)}
          aria-label={t('constellation.showEras')}
        >
          <span>{t('constellation.eras.label', 'Eras')}</span>
        </button>

        {/* School toggle */}
        <button
          style={{
            ...styles.filterToggle,
            ...(showSchools ? styles.filterToggleActive : {}),
          }}
          onClick={() => setShowSchools(!showSchools)}
          aria-label={t('constellation.filterBySchool')}
        >
          <span>{t('constellation.schools.label', 'Schools')}</span>
        </button>
      </div>

      {/* Era filter pills - show when expanded */}
      {showEras && (
        <div style={styles.filterRow}>
          {ERAS.map(era => (
            <button
              key={era.id}
              style={{
                ...styles.filterPill,
                ...(selectedEra === era.id ? styles.filterPillActive : {}),
              }}
              onClick={() => toggleEraFilter(era.id)}
              title={`${era.startYear < 0 ? Math.abs(era.startYear) + ' ' + t('constellation.bc') : era.startYear} - ${era.endYear < 0 ? Math.abs(era.endYear) + ' ' + t('constellation.bc') : era.endYear}`}
            >
              {t(`constellation.eras.${era.id}`, era.label)}
            </button>
          ))}
          {selectedEra && (
            <button
              style={{ ...styles.filterPill, ...styles.filterPillClear }}
              onClick={() => toggleEraFilter(selectedEra)}
            >
              ✕ {t('constellation.clear')}
            </button>
          )}
        </div>
      )}

      {/* School filter pills - show when expanded */}
      {showSchools && (
        <div style={styles.filterRow}>
          {schools.map(school => {
            const color = SCHOOL_COLORS[school] || 'var(--ink-low)'; // school color = DATA
            const isSelected = selectedSchool === school;
            return (
              <button
                key={school}
                style={{
                  // Monochrome pill chrome; the school COLOR lives in the dot (data).
                  ...styles.filterPill,
                  ...(isSelected ? styles.filterPillActive : {}),
                }}
                onClick={() => toggleSchoolFilter(school)}
                title={t(`constellation.schools.${school}`, school)}
              >
                <span style={{ ...styles.schoolDot, background: color }} />
                {t(`constellation.schools.${school}`, school)}
              </button>
            );
          })}
          {selectedSchool && (
            <button
              style={{ ...styles.filterPill, ...styles.filterPillClear }}
              onClick={() => toggleSchoolFilter(selectedSchool)}
            >
              ✕ {t('constellation.clear')}
            </button>
          )}
        </div>
      )}

      {/* Main controls row */}
      <div style={styles.controlsRow}>
        {/* Play/Pause */}
        {/* v2 kit play affordance (AudioBar glyphs) */}
        <button
          style={styles.playButton}
          onClick={togglePlay}
          aria-label={isPlaying ? t('constellation.pause') : t('constellation.play')}
        >
          {isPlaying ? '❚❚' : '▶'}
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
            // Use startYear for era marker position
            const percent = ((era.startYear - minYear) / (maxYear - minYear)) * 100;
            return (
              <div
                key={era.id}
                style={{
                  ...styles.eraMarker,
                  left: `${percent}%`,
                }}
                title={t(`constellation.eras.${era.id}`, era.label)}
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

// v2 tokens only (WP6.3) — monochrome + silver; pills 999px, square controls.
const styles = {
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(transparent, var(--bg))',
    padding: '40px 24px 24px',
    zIndex: 100,
  },

  // Top row with filter toggles
  topRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },

  filterToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 13px',
    background: 'var(--bg)',
    border: '1px solid var(--line-strong)',
    borderRadius: 'var(--radius-pill)',
    color: 'var(--ink-mid)',
    font: '500 10px/1 var(--f-ui)',
    letterSpacing: '.14em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'all 0.16s',
  },

  filterToggleActive: {
    background: 'var(--bg)',
    borderColor: 'var(--ink-hi)',
    color: 'var(--ink-hi)',
  },

  // Filter pills row (eras or schools)
  filterRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 12,
    maxHeight: 100,
    overflowY: 'auto',
  },

  filterPill: {
    padding: '5px 12px',
    background: 'var(--bg)',
    border: '1px solid var(--line-strong)',
    borderRadius: 'var(--radius-pill)',
    color: 'var(--ink-mid)',
    font: '500 10px/1 var(--f-ui)',
    letterSpacing: '.14em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'all 0.16s',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap',
  },

  filterPillActive: {
    background: 'var(--bg)',
    borderColor: 'var(--ink-hi)',
    color: 'var(--ink-hi)',
  },

  filterPillClear: {
    background: 'var(--bg)',
    borderColor: 'var(--line-strong)',
    color: 'var(--ink-hi)',
  },

  schoolDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },

  controlsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },

  // Square instrument control (kit .audio .play register)
  playButton: {
    width: 44,
    height: 44,
    background: 'var(--bg)',
    border: '1px solid var(--line-strong)',
    borderRadius: 0,
    color: 'var(--ink-hi)',
    font: '400 13px/1 var(--f-ui)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Timeline rail: hairline track, white fill, node thumb (mrail motif)
  sliderTrack: {
    flex: 1,
    height: 2,
    background: 'var(--line)',
    borderRadius: 0,
    position: 'relative',
    cursor: 'pointer',
  },

  sliderFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    background: 'var(--ink-hi)',
    borderRadius: 0,
    pointerEvents: 'none',
  },

  sliderThumb: {
    position: 'absolute',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: 10,
    height: 10,
    background: 'var(--ink-hi)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },

  eraMarker: {
    position: 'absolute',
    top: -5,
    transform: 'translateX(-50%)',
    width: 1,
    height: 12,
    background: 'var(--line-strong)',
    pointerEvents: 'none',
  },

  speedButton: {
    padding: '8px 12px',
    background: 'var(--bg)',
    border: '1px solid var(--line-strong)',
    borderRadius: 0,
    color: 'var(--ink-hi)',
    font: '500 11px/1 var(--f-ui)',
    letterSpacing: '.1em',
    textTransform: 'uppercase',
    fontVariantNumeric: 'tabular-nums',
    cursor: 'pointer',
    flexShrink: 0,
    minWidth: 48,
  },

  rangeLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 8,
    font: '500 10px/1 var(--f-ui)',
    letterSpacing: '.16em',
    textTransform: 'uppercase',
    fontVariantNumeric: 'tabular-nums',
    color: 'var(--ink-low)',
    paddingLeft: 60,
    paddingRight: 60,
  },
};

export default TimelineControls;
