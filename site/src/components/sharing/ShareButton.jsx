// ShareButton - Component for sharing analysis via multiple chat apps
// Auth: Uses HttpOnly cookies (credentials: 'include')
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Toast } from '../common';
import { getApiUrl } from '../../config';

export function ShareButton({ analysisId, songName, artist }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const createShareUrl = async () => {
    if (!analysisId) {
      setToast({ type: 'error', message: t('share.shareErrorNoAnalysis') });
      return null;
    }

    // Preferred: create a short share slug via API (enables referral tracking)
    try {
      const response = await fetch(`${getApiUrl()}/api/share`, {
        method: 'POST',
        credentials: 'include', // Send HttpOnly cookie for auth
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analysisId }),
      });

      if (response.status === 401) {
        setToast({ type: 'error', message: t('share.shareErrorNotAuthenticated') });
        return null;
      }

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success && data?.url) {
        return data.url;
      }

      // Fall back below (keeps sharing working even if token system isn't deployed)
      console.error('[ShareButton] Failed to create share token:', data);
    } catch (error) {
      console.error('[ShareButton] Error creating share token:', error);
      // Fall back below
    }

    // Fallback: direct URL (works if backend supports /shared/:analysisId)
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared/${analysisId}`;
  };

  const handleShare = async (platform) => {
    setLoading(true);

    const shareUrl = await createShareUrl();
    if (!shareUrl) {
      setLoading(false);
      return;
    }

    // Generate share text
    const shareText = t('share.shareWhatsAppText', {
      song: songName,
      artist: artist,
    });

    let targetUrl = '';

    switch (platform) {
      case 'whatsapp': {
        const whatsappText = encodeURIComponent(shareText + '\n\n' + shareUrl);
        const isAndroid = /Android/i.test(navigator.userAgent);
        targetUrl = isAndroid
          ? `intent://send?text=${whatsappText}#Intent;package=com.whatsapp;scheme=whatsapp;end`
          : `https://wa.me/?text=${whatsappText}`;
        break;
      }

      case 'whatsapp-business': {
        const wabText = encodeURIComponent(shareText + '\n\n' + shareUrl);
        const isAndroidWab = /Android/i.test(navigator.userAgent);
        targetUrl = isAndroidWab
          ? `intent://send?text=${wabText}#Intent;package=com.whatsapp.w4b;scheme=whatsapp;end`
          : `https://wa.me/?text=${wabText}`;
        break;
      }

      case 'telegram':
        targetUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        break;

      case 'wechat':
        // WeChat doesn't support direct URL sharing from web, so copy to clipboard
        navigator.clipboard
          .writeText(shareText + '\n\n' + shareUrl)
          .then(() => {
            setToast({ type: 'success', message: t('share.shareWeChatCopySuccess') });
          })
          .catch(() => {
            setToast({ type: 'error', message: t('share.shareCopyFailed') });
          });
        setLoading(false);
        return;

      case 'messenger':
        // Facebook Messenger requires a registered app_id; fall back to regular fb share
        targetUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;

      case 'line':
        targetUrl = `https://line.me/R/msg/text/?${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
        break;

      case 'viber':
        // Viber sharing - use the public account sharing URL
        targetUrl = `viber://pa?chatURI=&text=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
        break;

      case 'kakaotalk':
        // KakaoTalk sharing - fall back to copy link (Kakao SDK requires registered app_key)
        navigator.clipboard.writeText(shareUrl).then(() => {
          setToast({ type: 'success', message: t('share.shareCopySuccess') });
        });
        setLoading(false);
        return;

      case 'copy':
        navigator.clipboard.writeText(shareUrl).then(() => {
          setToast({ type: 'success', message: t('share.shareCopySuccess') });
        });
        setLoading(false);
        return;

      default:
        setLoading(false);
        return;
    }

    // Open share URL
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    setToast({ type: 'success', message: t('share.shareSuccess') });
    setLoading(false);
  };

  const shareButtons = [
    { platform: 'whatsapp', icon: '/WhatsApp.svg', label: 'WhatsApp', color: '#25D366' },
    {
      platform: 'whatsapp-business',
      icon: '/whatsapp-business.png',
      label: 'WA Business',
      color: '#128C7E',
    },
    { platform: 'telegram', icon: '/telegram-logo.svg', label: 'Telegram', color: '#0088cc' },
    { platform: 'wechat', icon: '/wechat-logo.svg', label: 'WeChat', color: '#09B83E' },
    { platform: 'messenger', icon: '/messenger-logo.svg', label: 'Messenger', color: '#0084FF' },
    { platform: 'line', icon: '/line-logo.svg', label: 'Line', color: '#00C300' },
    { platform: 'kakaotalk', icon: '/kakaotalk-logo.svg', label: 'KakaoTalk', color: '#FFE812' },
    { platform: 'viber', icon: '/viber-logo.svg', label: 'Viber', color: '#665CAC' },
    {
      platform: 'copy',
      icon: '/copy-icon.svg',
      label: t('share.shareCopyLinkLabel'),
      color: '#666',
    },
  ];

  const isDisabled = loading || !analysisId;

  return (
    <>
      <div className="share-button__container p-6 gap-6">
        {/* Instructional text */}
        <div className="text-center leading-relaxed">
          <p className="text-base text-dark font-bold mb-0">{t('share.shareInstructionTitle')}</p>
          <p className="text-base text-dark font-bold mb-0">
            {t('share.shareInstructionSubtitle')}
          </p>
        </div>

        {/* Share buttons - single horizontal line */}
        <div className="share-button__icon-row">
          {shareButtons.map(({ platform, icon, label }) => (
            <button
              key={platform}
              onClick={() => handleShare(platform)}
              disabled={isDisabled}
              title={label}
              className="share-button__btn"
              style={{ opacity: isDisabled ? 0.5 : 1 }}
            >
              <img src={icon} alt={label} className="share-button__icon-img" />
            </button>
          ))}
        </div>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </>
  );
}

export default ShareButton;
