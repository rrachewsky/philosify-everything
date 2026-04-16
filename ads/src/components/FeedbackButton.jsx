import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function FeedbackButton() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [type, setType] = useState('general');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setSending(true);
    try {
      // Send feedback to a simple endpoint (you can implement this later)
      const response = await fetch('/api/ads/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message: feedback,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setIsOpen(false);
          setSubmitted(false);
          setFeedback('');
          setType('general');
        }, 2000);
      }
    } catch (err) {
      console.error('Feedback submission error:', err);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        className="feedback-trigger"
        onClick={() => setIsOpen(true)}
        aria-label={t('feedback.openFeedback')}
        title={t('feedback.openFeedback')}
      >
        💬
      </button>
    );
  }

  return (
    <>
      <div className="feedback-overlay" onClick={() => setIsOpen(false)} />
      <div className="feedback-modal">
        <div className="feedback-modal__header">
          <h3 className="feedback-modal__title">{t('feedback.title')}</h3>
          <button
            className="feedback-modal__close"
            onClick={() => setIsOpen(false)}
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="feedback-success">
            <div className="feedback-success__icon">✓</div>
            <p className="feedback-success__message">{t('feedback.thankYou')}</p>
          </div>
        ) : (
          <form className="feedback-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="feedback-type">{t('feedback.typeLabel')}</label>
              <select
                id="feedback-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="general">{t('feedback.typeGeneral')}</option>
                <option value="bug">{t('feedback.typeBug')}</option>
                <option value="feature">{t('feedback.typeFeature')}</option>
                <option value="ux">{t('feedback.typeUX')}</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="feedback-message">{t('feedback.messageLabel')}</label>
              <textarea
                id="feedback-message"
                rows={5}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={t('feedback.messagePlaceholder')}
                required
              />
            </div>

            <div className="feedback-form__actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setIsOpen(false)}
              >
                {t('common.cancel')}
              </button>
              <button type="submit" className="btn btn--primary" disabled={sending || !feedback.trim()}>
                {sending ? t('feedback.sending') : t('feedback.submit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
