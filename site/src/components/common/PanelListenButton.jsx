// PanelListenButton - Listen button for philosopher panel results
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { preloadPanelTTS, getPreloadedPanelAudio, getPanelAudioStatus } from '@/services/ttsCache';

export function PanelListenButton({ panel }) {
  const { i18n, t } = useTranslation();
  const lang = i18n.language || 'en';
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef(null);

  // Preload audio when panel is available
  useEffect(() => {
    if (panel?.id && panel?.analysis) {
      preloadPanelTTS(panel, lang);
    }
  }, [panel, lang]);

  // Poll for audio readiness
  useEffect(() => {
    if (!panel?.id) return;
    const interval = setInterval(() => {
      const status = getPanelAudioStatus(panel.id, lang);
      if (status === 'ready' || status === 'error') {
        setLoading(false);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [panel?.id, lang]);

  const handleListen = useCallback(() => {
    if (playing && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
      return;
    }

    const audioUrl = getPreloadedPanelAudio(panel.id, lang);
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onerror = () => setPlaying(false);
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      // Not ready yet, trigger preload and show loading
      setLoading(true);
      preloadPanelTTS(panel, lang);
    }
  }, [panel, lang, playing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const status = panel?.id ? getPanelAudioStatus(panel.id, lang) : 'none';
  const isReady = status === 'ready';
  const isLoading = status === 'loading' || loading;

  return (
    <button
      className={`panel-listen-button ${playing ? 'panel-listen-button--playing' : ''}`}
      onClick={handleListen}
      disabled={isLoading}
    >
      {isLoading
        ? t('listen.generating', { defaultValue: 'Generating audio...' })
        : playing
          ? t('listen.stop', { defaultValue: 'Stop' })
          : isReady
            ? t('listen.listen', { defaultValue: 'Listen' })
            : t('listen.listen', { defaultValue: 'Listen' })}
    </button>
  );
}

export default PanelListenButton;
