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
        placeholder={t('constellation.findPhilosopher', 'Find a philosopher...')}
        style={styles.input}
      />

      {/* Results dropdown */}
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

const styles = {
  container: {
    position: 'absolute',
    left: 56,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 150,
  },

  input: {
    width: 180,
    height: 40,
    padding: '0 12px',
    background: 'rgba(20, 20, 30, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    color: '#F2F2F5',
    fontSize: 14,
    outline: 'none',
    backdropFilter: 'blur(8px)',
  },

  results: {
    position: 'absolute',
    top: '100%',
    left: 0,
    width: 220,
    marginTop: 4,
    background: 'rgba(20, 20, 30, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: 8,
    backdropFilter: 'blur(16px)',
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
    background: 'rgba(214, 21, 140, 0.2)',
  },

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
    fontSize: 13,
    fontWeight: 600,
    color: '#F2F2F5',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  resultMeta: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 1,
  },
};

export default ConstellationSearch;
