// CollectiveFeed - Song-grouped analysis feed for a collective
// Groups analyses by song name, with language-specific entries underneath
import { useState, useCallback, useMemo } from 'react';
import { collectiveService } from '../../services/api/collective.js';

// Calculate philosophical note (1-10) from weighted score (-10 to +10)
// Same logic as backend calculator.js
function calculatePhilosophicalNote(finalScore) {
  if (finalScore === undefined || finalScore === null) return null;
  if (finalScore >= 8.1) return 10;
  if (finalScore >= 6.1) return 9;
  if (finalScore >= 4.1) return 8;
  if (finalScore >= 2.1) return 7;
  if (finalScore >= 0.1) return 6;
  if (finalScore >= -2.0) return 5;
  if (finalScore >= -4.0) return 4;
  if (finalScore >= -6.0) return 3;
  if (finalScore >= -8.0) return 2;
  return 1;
}

export function CollectiveFeed({ groupId, analyses: initialAnalyses, onSelectAnalysis }) {
  const [analyses, setAnalyses] = useState(initialAnalyses || []);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  // Load more analyses (pagination)
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);

    try {
      const offset = analyses.length;
      const { analyses: newAnalyses, hasMore: more } =
        await collectiveService.getCollectiveAnalyses(groupId, offset);
      setAnalyses((prev) => [...prev, ...newAnalyses]);
      setHasMore(more);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [groupId, analyses.length, loading, hasMore]);

  // Get color based on philosophical note (1-10)
  const getScoreColor = (note) => {
    if (note == null) return 'rgba(255, 255, 255, 0.4)';
    if (note >= 8) return '#00e0a0'; // Green for 8-10
    if (note >= 5) return '#ffc832'; // Yellow for 5-7
    return '#ff4680'; // Red for 1-4
  };

  // Group analyses by song name (case-insensitive)
  // Sort groups by best score within group (descending)
  // Within each group, sort entries by score descending
  const songGroups = useMemo(() => {
    const groupMap = new Map();

    for (const analysis of analyses) {
      const key = (analysis.song_name || '').toLowerCase().trim();
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          songName: analysis.song_name,
          bestScore: analysis.score,
          entries: [],
        });
      }
      const group = groupMap.get(key);
      group.entries.push(analysis);
      if (analysis.score != null && (group.bestScore == null || analysis.score > group.bestScore)) {
        group.bestScore = analysis.score;
      }
    }

    // Sort entries within each group by score descending
    for (const group of groupMap.values()) {
      group.entries.sort((a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity));
    }

    // Sort groups by best score descending
    return Array.from(groupMap.values()).sort(
      (a, b) => (b.bestScore ?? -Infinity) - (a.bestScore ?? -Infinity)
    );
  }, [analyses]);

  if (analyses.length === 0 && !loading) {
    return (
      <div className="collective-feed">
        <div className="collective-feed__empty">
          No analyses yet.
          <br />
          Analyze a song by this artist to add it here!
        </div>
      </div>
    );
  }

  return (
    <div className="collective-feed">
      {error && <div className="collective-feed__error">{error}</div>}

      <div className="collective-feed__list">
        {songGroups.map((group) => (
          <div key={group.songName} className="song-group">
            <div className="song-group__name">{group.songName}</div>
            <div className="song-group__entries">
              {group.entries.map((analysis) => {
                const note = calculatePhilosophicalNote(analysis.score);
                return (
                  <div
                    key={analysis.id}
                    className="song-group__entry"
                    onClick={() => onSelectAnalysis(analysis.id)}
                  >
                    <span className="song-group__score" style={{ color: getScoreColor(note) }}>
                      {note != null ? note : '?'}
                    </span>
                    {analysis.language && (
                      <span className="song-group__lang">{analysis.language.toUpperCase()}</span>
                    )}
                    <span className="song-group__comments">
                      {analysis.comment_count || 0}{' '}
                      {analysis.comment_count === 1 ? 'comment' : 'comments'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button className="collective-feed__load-more" onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}

export default CollectiveFeed;
