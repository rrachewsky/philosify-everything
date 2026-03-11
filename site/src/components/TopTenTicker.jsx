// TopTenTicker.jsx - Spotify Top 50 scrolling ticker
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './TopTenTicker.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.philosify.org';

export default function TopTenTicker({ onSongSelect }) {
  const { t } = useTranslation();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const trackRef = useRef(null);

  useEffect(() => {
    const fetchTop50 = async () => {
      try {
        const response = await fetch(`${API_URL}/api/top10`);
        if (response.ok) {
          const data = await response.json();
          setTracks(data.tracks || []);
        }
      } catch (error) {
        console.error('Failed to fetch top 50:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTop50();
    // Refresh every 5 minutes
    const interval = setInterval(fetchTop50, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Drag handlers for manual scrolling
  const handleMouseDown = (e) => {
    if (!trackRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - trackRef.current.offsetLeft);
    setScrollLeft(trackRef.current.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    trackRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTrackClick = (track) => {
    if (onSongSelect) {
      onSongSelect({
        song: track.song_title,
        artist: track.artist,
        spotify_id: track.spotify_id,
        isFree: !!track.is_free,
      });
    }
  };

  if (loading || tracks.length === 0) {
    return null;
  }

  // Triplicate tracks for seamless loop with scroll both directions
  const duplicatedTracks = [...tracks, ...tracks, ...tracks];
  const trackCount = tracks.length;

  // 8 seconds per song to cross the screen
  const animationDuration = trackCount * 8;

  return (
    <div className="top-ten-ticker" style={{ direction: 'ltr' }}>
      <div className="ticker-label">
        <span className="ticker-icon">🎵</span>
        <span>TOP 50</span>
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
          {duplicatedTracks.map((track, index) => {
            const rank = (index % trackCount) + 1;
            const showFreeBadge = !!track.is_free;
            return (
              <button
                key={`${track.spotify_id}-${index}`}
                className="ticker-item"
                onClick={() => handleTrackClick(track)}
                title={t('analyze')}
                style={{ direction: 'ltr' }}
              >
                <span className="ticker-rank">#{rank}</span>
                <span className="ticker-song">{track.song_title}</span>
                <span className="ticker-separator">-</span>
                <span className="ticker-artist">{track.artist}</span>
                {showFreeBadge && (
                  <span className="ticker-free">{t('topTen.free', { defaultValue: 'FREE' })}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
