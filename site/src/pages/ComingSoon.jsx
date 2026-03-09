// ComingSoon - Placeholder page for features not yet available
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import '@/styles/homepage.css';

const CATEGORY_ICONS = {
  books: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8M8 11h6" />
    </svg>
  ),
  films: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="20" height="20" rx="2.18" />
      <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" />
    </svg>
  ),
  news: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
      <path d="M7 10h6M7 14h3" />
    </svg>
  ),
  ideas: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 18h6M10 22h4" />
      <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
    </svg>
  ),
};

export function ComingSoon({ category = 'books' }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const icon = CATEGORY_ICONS[category] || CATEGORY_ICONS.books;
  const title = t(`home.categories.${category}.title`, category);

  return (
    <div className="coming-soon-page">
      <div className="coming-soon-bg" />

      <motion.div
        className="coming-soon-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="coming-soon-icon">{icon}</div>

        <h1 className="coming-soon-title">{title}</h1>

        <div className="coming-soon-badge">{t('home.comingSoon', 'Coming Soon')}</div>

        <p className="coming-soon-desc">
          {t(
            `home.comingSoonDesc.${category}`,
            'We are working hard to bring philosophical analysis to this category. Stay tuned!'
          )}
        </p>

        <motion.button
          className="coming-soon-back"
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          &larr; {t('nav.backToHome', 'Back to Home')}
        </motion.button>
      </motion.div>

      <style>{`
        .coming-soon-page {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0020;
          padding: 20px;
        }

        .coming-soon-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(
            ellipse at center,
            rgba(124, 58, 237, 0.15) 0%,
            rgba(10, 0, 32, 1) 70%
          );
        }

        .coming-soon-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 500px;
        }

        .coming-soon-icon {
          width: 100px;
          height: 100px;
          color: rgba(120, 100, 180, 0.6);
          margin-bottom: 24px;
        }

        .coming-soon-icon svg {
          width: 100%;
          height: 100%;
        }

        .coming-soon-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: 4px;
          color: #ffffff;
          margin: 0 0 20px 0;
          text-transform: uppercase;
        }

        .coming-soon-badge {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.4), rgba(236, 72, 153, 0.4));
          border: 1px solid rgba(236, 72, 153, 0.5);
          border-radius: 20px;
          padding: 8px 20px;
          font-family: 'Orbitron', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 2px;
          color: #ec4899;
          text-transform: uppercase;
          margin-bottom: 24px;
        }

        .coming-soon-desc {
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 1rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0 32px 0;
        }

        .coming-soon-back {
          background: rgba(15, 8, 40, 0.8);
          border: 1px solid rgba(0, 240, 255, 0.4);
          border-radius: 12px;
          padding: 14px 28px;
          font-family: 'Orbitron', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 1px;
          color: #00f0ff;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .coming-soon-back:hover {
          background: rgba(0, 240, 255, 0.1);
          border-color: #00f0ff;
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
        }

        @media (max-width: 480px) {
          .coming-soon-title {
            font-size: 1.8rem;
            letter-spacing: 2px;
          }

          .coming-soon-icon {
            width: 80px;
            height: 80px;
          }
        }
      `}</style>
    </div>
  );
}

// Export specific category pages
export function BooksAnalysis() {
  return <ComingSoon category="books" />;
}

export function FilmsAnalysis() {
  return <ComingSoon category="films" />;
}

export function NewsAnalysis() {
  return <ComingSoon category="news" />;
}

export function IdeasAnalysis() {
  return <ComingSoon category="ideas" />;
}

export default ComingSoon;
