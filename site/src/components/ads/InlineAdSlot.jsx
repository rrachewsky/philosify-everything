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
}) {
  const [ad, setAd] = useState(null);
  const [impressionId, setImpressionId] = useState(null);
  const [hasRecordedImpression, setHasRecordedImpression] = useState(false);
  const [hasTrackedClick, setHasTrackedClick] = useState(false);
  const impressionTimerRef = useRef(null);

  const recordImpression = useCallback(async () => {
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
        setAd(data.ad || null);
        setImpressionId(null);
        setHasRecordedImpression(false);
        setHasTrackedClick(false);
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
  }, [placement, refreshKey, userId]);

  useEffect(() => {
    if (!ad?.creative_url || hasRecordedImpression) {
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
  }, [ad, hasRecordedImpression, recordImpression]);

  const handleClick = () => {
    if (!impressionId || hasTrackedClick) {
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

  if (!ad?.creative_url || !ad?.target_url) {
    return null;
  }

  return (
    <aside className={`ad-slot ad-slot--${layout} ${className}`.trim()} aria-label="Sponsored message">
      <p className="ad-slot__label">{label}</p>
      <a
        className="ad-slot__card"
        href={ad.target_url}
        target="_blank"
        rel="noreferrer"
        onClick={handleClick}
      >
        <img
          className="ad-slot__image"
          src={ad.creative_url}
          alt="Sponsored creative"
          loading="lazy"
          onLoad={recordImpression}
        />
      </a>
    </aside>
  );
}
