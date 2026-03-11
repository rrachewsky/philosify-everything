// ============================================================
// IdeasHub - Slide-out Sidebar for Philosify Ideas (Debates & Colloquiums)
// ============================================================
// Single-purpose sidebar for the Ideas category.
// Uses DebatePanel for debates and colloquiums functionality.
// Same design pattern as CommunityHub.

import { useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DebatePanel } from '../community/DebatePanel.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import '../../styles/community.css';

export function IdeasHub({ isOpen, onClose, deepLinkDebateId, clearDeepLinkDebate }) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const contentRef = useRef(null);

  // Lock body scroll when sidebar is open (preserve scroll position)
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

  // Focus content area when sidebar opens for keyboard scrolling
  useEffect(() => {
    if (isOpen && contentRef.current) {
      // Small delay to ensure sidebar animation has started and content is rendered
      const timer = setTimeout(() => {
        contentRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  // Render content
  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <div className="community-auth-required">
          <div className="community-auth-required__text">{t('community.signInRequired')}</div>
        </div>
      );
    }

    return (
      <DebatePanel deepLinkDebateId={deepLinkDebateId} clearDeepLinkDebate={clearDeepLinkDebate} />
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`community-backdrop ${isOpen ? 'community-backdrop--open' : ''}`}
        onClick={handleBackdropClick}
      />

      {/* Sidebar - reuses community-hub styles */}
      <div
        className={`community-hub ${isOpen ? 'community-hub--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('home.categories.ideas.title')}
      >
        {/* Header */}
        <div className="community-hub__header">
          <span className="community-hub__title">{t('home.categories.ideas.title')}</span>
          <button className="community-hub__close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Subtitle */}
        <div className="community-hub__subtitle">{t('home.categories.ideas.description')}</div>

        {/* Content - tabIndex enables keyboard scrolling */}
        <div
          className="community-hub__content"
          ref={contentRef}
          tabIndex={-1}
          style={{ outline: 'none' }}
        >
          {renderContent()}
        </div>
      </div>
    </>
  );
}

export default IdeasHub;
