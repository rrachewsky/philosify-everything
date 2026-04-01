// ============================================================
// CONSTELLATION SEARCH - Search philosophers with camera fly-to
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TRADITION_COLORS, SCHOOL_COLORS } from '@hooks/useConstellation';

// Helper to get translated philosopher name
const getTranslatedName = (node, t) => {
  if (!node?.id) return node?.name || '';
  const translatedName = t(`constellation.names.${node.id}`, { defaultValue: '' });
  return translatedName || node.name;
};

export function ConstellationSearch({
  searchPhilosopher,
  onSelect,
  onClose,
  formatYear,
}) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Search on query change
  useEffect(() => {
    if (query.trim()) {
      const matches = searchPhilosopher(query);
      setResults(matches);
      setSelectedIndex(0);
    } else {
      setResults([]);
    }
  }, [query, searchPhilosopher]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      onSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [results, selectedIndex, onSelect, onClose]);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.container} onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <div style={styles.inputWrapper}>
          <svg
            style={styles.searchIcon}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('constellation.searchPlaceholder')}
            style={styles.input}
          />
          <button style={styles.closeButton} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div style={styles.results}>
            {results.map((node, index) => {
              const schoolColor = SCHOOL_COLORS[node.school] || TRADITION_COLORS[node.tradition] || '#fff';
              return (
                <button
                  key={node.id}
                  style={{
                    ...styles.resultItem,
                    ...(index === selectedIndex ? styles.resultItemActive : {}),
                  }}
                  onClick={() => onSelect(node)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div
                    style={{
                      ...styles.traditionDot,
                      background: schoolColor,
                    }}
                  />
                  <div style={styles.resultInfo}>
                    <div style={styles.resultName}>{getTranslatedName(node, t)}</div>
                    <div style={styles.resultMeta}>
                      {formatYear(node.birth_year)} · {t(`constellation.schools.${node.school_of_thought}`, node.school_of_thought)}
                    </div>
                  </div>
                  <svg
                    style={styles.flyIcon}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>
        )}

        {/* No results */}
        {query.trim() && results.length === 0 && (
          <div style={styles.noResults}>
            {t('constellation.noResults')} "{query}"
          </div>
        )}

        {/* Hint */}
        {!query.trim() && (
          <div style={styles.hint}>
            {t('constellation.searchHint')}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: 100,
    zIndex: 200,
  },

  container: {
    width: '100%',
    maxWidth: 400,
    margin: '0 16px',
    background: 'rgba(25, 25, 35, 0.95)',
    borderRadius: 12,
    border: '1px solid rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(16px)',
    overflow: 'hidden',
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.4)',
  },

  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },

  searchIcon: {
    color: 'rgba(255, 255, 255, 0.5)',
    flexShrink: 0,
  },

  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#F2F2F5',
    fontSize: 15,
  },

  closeButton: {
    width: 28,
    height: 28,
    background: 'rgba(255, 255, 255, 0.08)',
    border: 'none',
    borderRadius: 6,
    color: 'rgba(255, 255, 255, 0.6)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  results: {
    maxHeight: 320,
    overflowY: 'auto',
  },

  resultItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '12px 20px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },

  resultItemActive: {
    background: 'rgba(214, 21, 140, 0.15)',
  },

  traditionDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
  },

  resultInfo: {
    flex: 1,
    minWidth: 0,
  },

  resultName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#F2F2F5',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  resultMeta: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  flyIcon: {
    color: 'rgba(255, 255, 255, 0.3)',
    flexShrink: 0,
  },

  noResults: {
    padding: '24px 20px',
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
  },

  hint: {
    padding: '24px 20px',
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 13,
  },
};

export default ConstellationSearch;
