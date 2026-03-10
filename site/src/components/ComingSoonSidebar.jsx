// ============================================================
// ComingSoonSidebar - Placeholder sidebar for upcoming categories
// ============================================================
// Used for Books, Films, News, Ideas until they're implemented.
// Same 520px layout as CommunityHub and MusicSidebar.

import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/music-sidebar.css'; // Reuse same styles

// Category icons (Unicode symbols)
const CATEGORY_ICONS = {
  books: '\u{1F4DA}', // 📚
  films: '\u{1F3AC}', // 🎬
  news: '\u{1F4F0}', // 📰
  ideas: '\u{1F4A1}', // 💡
};

export function ComingSoonSidebar({ isOpen, onClose, category }) {
  const { t } = useTranslation();

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
      }
    }
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
      }
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  const icon = CATEGORY_ICONS[category] || '\u{2728}'; // ✨ fallback
  const title = t(`home.categories.${category}.title`, category);
  const description = t(`home.categories.${category}.description`, '');

  return (
    <>
      {/* Backdrop */}
      <div
        className={`music-backdrop ${isOpen ? 'music-backdrop--open' : ''}`}
        onClick={handleBackdropClick}
      />

      {/* Sidebar */}
      <div
        className={`music-sidebar ${isOpen ? 'music-sidebar--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className="music-sidebar__header">
          <span className="music-sidebar__title">
            <span className="music-sidebar__icon">{icon}</span>
            {title}
          </span>
          <button className="music-sidebar__close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="music-sidebar__content">
          <div className="coming-soon-content">
            <div className="coming-soon-content__icon">{icon}</div>
            <h2 className="coming-soon-content__title">{title}</h2>
            <div className="coming-soon-content__badge">{t('comingSoon.badge', 'Coming Soon')}</div>
            {description && <p className="coming-soon-content__description">{description}</p>}
            <p className="coming-soon-content__message">
              {t(
                'comingSoon.message',
                "We're working on bringing philosophical analysis to this category. Stay tuned!"
              )}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .coming-soon-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 20px;
          min-height: 50vh;
        }
        .coming-soon-content__icon {
          font-size: 64px;
          margin-bottom: 16px;
          filter: grayscale(0.3);
        }
        .coming-soon-content__title {
          font-family: 'Orbitron', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #00f0ff;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin: 0 0 16px 0;
        }
        .coming-soon-content__badge {
          display: inline-block;
          padding: 8px 20px;
          background: linear-gradient(135deg, #ec4899 0%, #7c3aed 100%);
          border-radius: 20px;
          font-family: 'Orbitron', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 24px;
        }
        .coming-soon-content__description {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
          max-width: 320px;
          margin: 0 0 16px 0;
        }
        .coming-soon-content__message {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.5;
          max-width: 280px;
          margin: 0;
        }
      `}</style>
    </>
  );
}

export default ComingSoonSidebar;
