// TranslateButton - On-demand translation for any text content
// Shows "Translate" link below a message. On click, calls API and shows translated text.
// Toggle back to "Show original" to hide translation.
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { translateText } from '../../services/api/translate.js';

export function TranslateButton({ text }) {
  const { t, i18n } = useTranslation();
  const [translated, setTranslated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTranslation, setShowTranslation] = useState(false);

  const currentLang = i18n.language || 'en';

  const handleTranslate = useCallback(async () => {
    // Toggle back to original
    if (showTranslation && translated) {
      setShowTranslation(false);
      return;
    }

    // Already translated, just show it
    if (translated) {
      setShowTranslation(true);
      return;
    }

    // Fetch translation
    setLoading(true);
    setError(null);
    try {
      const result = await translateText(text, currentLang);
      setTranslated(result);
      setShowTranslation(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [text, currentLang, showTranslation, translated]);

  return (
    <div className="translate-wrapper">
      <button className="translate-btn" onClick={handleTranslate} disabled={loading}>
        {loading
          ? t('community.translate.translating')
          : showTranslation
            ? t('community.translate.showOriginal')
            : t('community.translate.button')}
      </button>
      {error && <span className="translate-error">{t('community.translate.error')}</span>}
      {showTranslation && translated && <div className="translate-result">{translated}</div>}
    </div>
  );
}

export default TranslateButton;
