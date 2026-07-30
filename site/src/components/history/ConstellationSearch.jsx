// ============================================================
// CONSTELLATION SEARCH - Inline expanding search field
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
  isOpen,
}) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

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
      setQuery('');
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [results, selectedIndex, onSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={containerRef} style={styles.container}>
      {/* Search input */}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('constellation.search', 'Search...')}
        style={styles.input}
      />

      {/* Results dropdown */}
      {results.length > 0 && (
        <div style={styles.results}>
          {results.map((node, index) => {
            const schoolColor = SCHOOL_COLORS[node.school] || TRADITION_COLORS[node.tradition] || 'var(--ink-low)';
            return (
              <button
                key={node.id}
                style={{
                  ...styles.resultItem,
                  ...(index === selectedIndex ? styles.resultItemActive : {}),
                }}
                onClick={() => {
                  onSelect(node);
                  setQuery('');
                }}
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
                    {formatYear(node.birth_year)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// v2 tokens only (WP6.3) — kit input (6px radius, inset ground), square dropdown.
const styles = {
  container: {
    position: 'relative',
    zIndex: 150,
  },

  input: {
    width: 160,
    height: 40,
    padding: '0 12px',
    background: 'var(--bg-inset)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius-input)',
    color: 'var(--ink-hi)',
    font: '400 14px/1.4 var(--f-ui)',
    outline: 'none',
  },

  results: {
    position: 'absolute',
    top: '100%',
    left: 0,
    width: 220,
    marginTop: 4,
    background: 'var(--bg)',
    border: '1px solid var(--line-strong)',
    borderRadius: 0,
    overflow: 'hidden',
    maxHeight: 240,
    overflowY: 'auto',
  },

  resultItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '10px 12px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },

  resultItemActive: {
    background: 'var(--bg-cell)',
  },

  // School DATA color dot
  traditionDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },

  resultInfo: {
    flex: 1,
    minWidth: 0,
  },

  resultName: {
    font: '500 12.5px/1.4 var(--f-ui)',
    color: 'var(--ink-hi)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  resultMeta: {
    font: '400 10.5px/1.4 var(--f-ui)',
    fontVariantNumeric: 'tabular-nums',
    color: 'var(--ink-low)',
    marginTop: 1,
  },
};

export default ConstellationSearch;
