import { useCallback, useEffect, useRef, useState } from 'react';
import { config } from '@/config';
import '@/styles/ads.css';

const IMPRESSION_DELAY_MS = 1200;

export default function InlineAdSlot({
  userId,
  placement = 'sidebar',
  layout = 'card',
  refreshKey = 'default',
  className = '',
  label = 'Sponsored',
  onAdLoaded,
  mediaType = null, // For sidebar: filter by 'video' or 'image' to maintain consistency
}) {
  const [ad, setAd] = useState(null);
  const [impressionId, setImpressionId] = useState(null);
  const [hasRecordedImpression, setHasRecordedImpression] = useState(false);
  const [hasTrackedClick, setHasTrackedClick] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const impressionTimerRef = useRef(null);
  const adContainerRef = useRef(null);
  const videoRef = useRef(null);

  const recordImpression = useCallback(async () => {
    // Skip tracking for house ads (Philosify promotional content, not billed)
    if (ad?.is_house_ad) {
      setHasRecordedImpression(true);
      return;
    }

    if (!ad?.impression_token || hasRecordedImpression) {
      return;
    }

    try {
      const response = await fetch(`${config.apiUrl}/api/ads/impression`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          impression_token: ad.impression_token,
          user_id: userId || undefined,
        }),
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setImpressionId(data.impression_id || null);
      setHasRecordedImpression(true);
    } catch {
      // Ignore ad telemetry failures so the homepage stays responsive.
    }
  }, [ad, hasRecordedImpression, userId]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAd() {
      try {
        const params = new URLSearchParams({ placement });
        if (userId) {
          params.set('user_id', userId);
        }

        const response = await fetch(`${config.apiUrl}/api/ads/serve?${params.toString()}`, {
          credentials: 'include',
          signal: controller.signal,
        });

        if (!response.ok) {
          setAd(null);
          return;
        }

        const data = await response.json();
        console.log('[Ad] Received ad data:', data);
        
        // For sidebar: filter by media type to maintain consistency (video→video, image→image)
        if (mediaType && data.ad && data.ad.media_type !== mediaType) {
          console.log(`[Ad] Skipping ${data.ad.media_type} ad, waiting for ${mediaType}`);
          setAd(null);
          return;
        }
        
        setAd(data.ad || null);
        setImpressionId(null);
        setHasRecordedImpression(false);
        setHasTrackedClick(false);
        setIsClosed(false);
        setIsMuted(true); // Reset to muted for new ad
        // Report contracted duration to parent so analysis holds long enough
        if (data.ad?.duration && onAdLoaded) {
          onAdLoaded({ duration: data.ad.duration, mediaType: data.ad.media_type });
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          setAd(null);
        }
      }
    }

    loadAd();

    return () => {
      controller.abort();
      if (impressionTimerRef.current) {
        clearTimeout(impressionTimerRef.current);
      }
    };
  }, [placement, refreshKey, userId, mediaType, onAdLoaded]);

  // Track viewport visibility with IntersectionObserver
  useEffect(() => {
    if (!adContainerRef.current || !ad?.creative_url) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.5 } // at least 50% visible
    );

    observer.observe(adContainerRef.current);
    return () => observer.disconnect();
  }, [ad]);

  // Only start impression timer when ad is visible
  useEffect(() => {
    if (!ad?.creative_url || hasRecordedImpression || !isVisible) {
      return undefined;
    }

    impressionTimerRef.current = setTimeout(() => {
      recordImpression();
    }, IMPRESSION_DELAY_MS);

    return () => {
      if (impressionTimerRef.current) {
        clearTimeout(impressionTimerRef.current);
      }
    };
  }, [ad, hasRecordedImpression, isVisible, recordImpression]);

  const handleClick = () => {
    // Skip click tracking for house ads
    if (ad?.is_house_ad || !impressionId || hasTrackedClick) {
      return;
    }

    setHasTrackedClick(true);
    void fetch(`${config.apiUrl}/api/ads/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      keepalive: true,
      body: JSON.stringify({ impression_id: impressionId }),
    });
  };

  const handleClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsClosed(true);
  };

  const handleVideoEnded = () => {
    // Constellation videos auto-close when finished
    if (placement === 'constellation') {
      setIsClosed(true);
    }
  };

  const toggleMute = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  if (!ad?.creative_url || !ad?.target_url || isClosed) {
    console.log('[Ad] Not rendering - missing data or closed:', { 
      creative_url: ad?.creative_url, 
      target_url: ad?.target_url,
      isClosed,
    });
    return null;
  }

  return (
    <aside ref={adContainerRef} className={`ad-slot ad-slot--${layout} ${className}`.trim()} aria-label="Sponsored message">
      <p className="ad-slot__label">{label}</p>
      {placement === 'constellation' && (
        <button
          className="ad-slot__close"
          onClick={handleClose}
          aria-label="Close ad"
          title="Close ad"
        >
          ✕
        </button>
      )}
      <a
        className="ad-slot__card"
        href={ad.target_url}
        target="_blank"
        rel="noreferrer"
        onClick={handleClick}
      >
        <div className="ad-slot__creative">
          {ad.media_type === 'video' ? (
            <>
              <video
                ref={videoRef}
                className="ad-slot__video"
                src={ad.creative_url}
                autoPlay
                muted={isMuted}
                loop={placement !== 'constellation'} // Constellation videos don't loop
                playsInline
                onLoadedData={recordImpression}
                onEnded={handleVideoEnded}
              />
              <button
                className="ad-slot__mute"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute ad' : 'Mute ad'}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
            </>
          ) : (
            <img
              className="ad-slot__image"
              src={ad.creative_url}
              alt="Sponsored creative"
              loading="lazy"
              onLoad={recordImpression}
            />
          )}
          {ad.brand_name && (
            <div className="ad-slot__overlay">
              <span className="ad-slot__brand">{ad.brand_name}</span>
              {ad.domain && <span className="ad-slot__domain">{ad.domain}</span>}
            </div>
          )}
        </div>
      </a>
    </aside>
  );
}
