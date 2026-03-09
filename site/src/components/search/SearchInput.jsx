// SearchInput - Song search input with Spotify autocomplete
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSpotifySearch } from '@/hooks';

export function SearchInput({ onSelectTrack, clearTrigger, externalTrack }) {
  const { t } = useTranslation();
  const { query, results, loading, setQuery, selectTrack, clearAll } = useSpotifySearch();

  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Backend already returns intelligent filtered + sorted results
  // No need for additional frontend filtering
  const sortedResults = results;

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- intentional state sync from derived data */
    if (loading) {
      setShowDropdown(false);
      return;
    }
    const shouldShow = sortedResults.length > 0 && query.trim().length > 0;
    setShowDropdown(shouldShow);
    /* eslint-enable react-hooks/set-state-in-effect */
    if (sortedResults.length > 0) {
      setFocusedIndex(0);
    } else {
      setFocusedIndex(-1);
    }
  }, [sortedResults, query, loading]);

  // Clear search when clearTrigger changes
  useEffect(() => {
    if (clearTrigger) {
      clearAll();
    }
  }, [clearTrigger, clearAll]);

  // Handle external track selection (from ticker) - just populate the search field visually
  const lastExternalTimestampRef = useRef(null);
  useEffect(() => {
    if (externalTrack && externalTrack.song && externalTrack.artist) {
      // Only process if timestamp changed (prevents loops)
      if (externalTrack.timestamp && externalTrack.timestamp !== lastExternalTimestampRef.current) {
        lastExternalTimestampRef.current = externalTrack.timestamp;
        // Populate search field with track info (visual only - parent already set selectedTrack)
        selectTrack({
          song: externalTrack.song,
          artist: externalTrack.artist,
          id: externalTrack.id || externalTrack.spotify_id,
        });
      }
    }
  }, [externalTrack]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle click outside to close dropdown (works for both mouse and touch)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click/touch is outside both the dropdown and input
      const target = event.target;
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);
      const isOutsideInput = inputRef.current && !inputRef.current.contains(target);

      if (isOutsideDropdown && isOutsideInput) {
        // Small delay to allow touch events to complete
        setTimeout(() => {
          setShowDropdown(false);
        }, 100);
      }
    };

    // Use a single event listener that handles both mouse and touch
    // Use 'click' event which fires after both mousedown/touchstart and mouseup/touchend
    document.addEventListener('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, []);

  const handleSelect = (track) => {
    selectTrack(track);
    if (onSelectTrack) {
      onSelectTrack(track);
    }
    setShowDropdown(false);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown || sortedResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev < sortedResults.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < sortedResults.length) {
          handleSelect(sortedResults[focusedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        break;
      default:
        break;
    }
  };

  const handleClear = () => {
    clearAll();
    inputRef.current?.focus();
  };

  return (
    <div className="search-container">
      <input
        ref={inputRef}
        className="input"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder=""
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
        aria-label={t('placeholder')}
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        role="combobox"
        inputMode="text"
      />

      {/* Clear button (X) - shows when there's text */}
      {query && (
        <button
          type="button"
          className="search-clear-btn"
          onClick={handleClear}
          aria-label="Clear search"
        >
          ×
        </button>
      )}

      {/* Custom placeholder inside input - hides on focus */}
      {!query && !isFocused && (
        <div className="search-placeholder-overlay">
          <div>{t('placeholder')}</div>
        </div>
      )}

      {/* Loading indicator while searching */}
      {loading && query.trim().length > 0 && (
        <div
          className="search-flip-window search-loading-indicator"
          role="status"
          aria-label="Searching"
        >
          <div className="search-loading-dots" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}

      {/* Single flip window - shows only one song at a time */}
      {!loading &&
        showDropdown &&
        sortedResults.length > 0 &&
        focusedIndex >= 0 &&
        focusedIndex < sortedResults.length && (
          <div ref={dropdownRef} className="search-flip-window">
            <div
              className="search-flip-content"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(sortedResults[focusedIndex]);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(sortedResults[focusedIndex]);
              }}
            >
              <span className="search-flip-song">{sortedResults[focusedIndex].song}</span>
              <span className="search-flip-separator"> - </span>
              <span className="search-flip-artist">{sortedResults[focusedIndex].artist}</span>
            </div>
            <div className="search-flip-footer">
              <button
                className="search-nav-arrow"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setFocusedIndex((prev) => Math.max(prev - 1, 0));
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setFocusedIndex((prev) => Math.max(prev - 1, 0));
                }}
                disabled={focusedIndex === 0}
                aria-label="Previous result"
              >
                &lt;
              </button>
              <div className="search-flip-counter">
                {focusedIndex + 1} / {sortedResults.length}
              </div>
              <button
                className="search-nav-arrow"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setFocusedIndex((prev) => Math.min(prev + 1, sortedResults.length - 1));
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setFocusedIndex((prev) => Math.min(prev + 1, sortedResults.length - 1));
                }}
                disabled={focusedIndex === sortedResults.length - 1}
                aria-label="Next result"
              >
                &gt;
              </button>
            </div>
          </div>
        )}
    </div>
  );
}

export default SearchInput;
