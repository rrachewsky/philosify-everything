// LiteratureSidebar - Slide-out Sidebar for Book Analysis
// Mirrors MusicSidebar.jsx — reuses music-sidebar.css classes
// Uses ResultsContainer for analysis display with mediaType="literature"

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ResultsContainer } from '../results/ResultsContainer';
import { ListenButton } from '../results/ListenButton';
import { LoginModal, SignupModal, ForgotPasswordModal, PaymentModal } from '../index';
import { PhilosopherPicker } from '../common/PhilosopherPicker';
import { useModal } from '../../hooks';
import { setPendingAction } from '../../utils/pendingAction.js';
import { requestPhilosopherPanel } from '../../services/api/philosopherPanel.js';
import '../../styles/music-sidebar.css';

export function LiteratureSidebar({
  isOpen,
  onClose,
  query,
  setQuery,
  results,
  loading,
  hasSearched,
  selectedBook,
  selectBook,
  clearBook,
  isAnalyzing,
  analysisResult,
  analysisError,
  analyze,
  cancelAnalysis,
  elapsedTime,
  formatTime,
  user,
  balance,
  lang,
}) {
  const { t, i18n } = useTranslation();
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthor, setManualAuthor] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelResult, setPanelResult] = useState(null);
  const [panelError, setPanelError] = useState(null);
  const [panelElapsed, setPanelElapsed] = useState(0);
  const panelTimerRef = useRef(null);
  const inputRef = useRef(null);
  const sidebarRef = useRef(null);
  const contentRef = useRef(null);
  const manualTitleRef = useRef(null);

  // Internal modals (rendered inside sidebar)
  const loginModal = useModal();
  const signupModal = useModal();
  const forgotPasswordModal = useModal();
  const paymentModal = useModal();

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
      if (scrollY) window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
    }
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      if (scrollY) window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
    };
  }, [isOpen]);

  // Forward scroll/touch events from header to the content area
  useEffect(() => {
    if (!isOpen) return;
    const sidebar = sidebarRef.current;
    const content = contentRef.current;
    if (!sidebar || !content) return;

    const onWheel = (e) => {
      if (!content.contains(e.target)) {
        content.scrollTop += e.deltaY;
        e.preventDefault();
      }
    };

    let touchStartY = 0;
    let forwarding = false;

    const onTouchStart = (e) => {
      const isInteractive = e.target.closest('button, a, input, [role="button"]');
      if (!content.contains(e.target) && !isInteractive) {
        touchStartY = e.touches[0].clientY;
        forwarding = true;
      } else {
        forwarding = false;
      }
    };

    const onTouchMove = (e) => {
      if (forwarding) {
        const currentY = e.touches[0].clientY;
        const deltaY = touchStartY - currentY;
        touchStartY = currentY;
        content.scrollTop += deltaY;
        e.preventDefault();
      }
    };

    sidebar.addEventListener('wheel', onWheel, { passive: false });
    sidebar.addEventListener('touchstart', onTouchStart, { passive: true });
    sidebar.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      sidebar.removeEventListener('wheel', onWheel);
      sidebar.removeEventListener('touchstart', onTouchStart);
      sidebar.removeEventListener('touchmove', onTouchMove);
    };
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Auto-focus search input
  useEffect(() => {
    if (isOpen && inputRef.current && !selectedBook) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, selectedBook]);

  // Reset focused index when results change
  useEffect(() => {
    setFocusedIndex(results.length > 0 ? 0 : -1);
  }, [results]);

  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  const handleSelect = (book) => {
    selectBook(book);
    setFocusedIndex(-1);
    if (!user) {
      signupModal.open();
    }
  };

  const handleKeyDown = (e) => {
    if (results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((p) => Math.min(p + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((p) => Math.max(p - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0) handleSelect(results[focusedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleAnalyze = async () => {
    if (!user) {
      signupModal.open();
      return;
    }
    // No free analyses for books — always require credits
    if (!balance || balance.total === undefined || balance.total <= 0) {
      if (selectedBook) {
        setPendingAction({ type: 'book-analysis', book: selectedBook });
      }
      paymentModal.open();
      return;
    }
    await analyze(lang || i18n.language || 'en');
  };

  const canAnalyze = selectedBook && !isAnalyzing && !panelLoading;

  const handleOpenPanel = () => {
    if (!user) {
      signupModal.open();
      return;
    }
    if (!balance || balance.total === undefined || balance.total < 3) {
      if (selectedBook) {
        setPendingAction({ type: 'panel-analysis', book: selectedBook });
      }
      paymentModal.open();
      return;
    }
    setShowPicker(true);
  };

  const handlePanelConfirm = async (chosenPhilosophers) => {
    // Close picker immediately so the timer is visible
    setShowPicker(false);
    setPanelLoading(true);
    setPanelError(null);
    setPanelElapsed(0);
    const startTime = Date.now();
    panelTimerRef.current = setInterval(() => {
      setPanelElapsed(Date.now() - startTime);
    }, 100);
    try {
      const result = await requestPhilosopherPanel({
        mediaType: 'literature',
        title: selectedBook.title,
        artist: selectedBook.author,
        description: selectedBook.description || null,
        categories: selectedBook.categories ? selectedBook.categories.join(', ') : null,
        philosophers: chosenPhilosophers,
        lang: lang || i18n.language || 'en',
      });
      setPanelResult(result.panel);
      window.dispatchEvent(new CustomEvent('credits-changed'));
    } catch (err) {
      if (err.code === 'INSUFFICIENT_CREDITS') {
        paymentModal.open();
      } else {
        setPanelError(err.message);
      }
    } finally {
      setPanelLoading(false);
      if (panelTimerRef.current) {
        clearInterval(panelTimerRef.current);
        panelTimerRef.current = null;
      }
    }
  };

  // Show "no results" when search completed with 0 results
  const showNoResults = !selectedBook && !loading && hasSearched && results.length === 0 && query.length >= 2;

  // Handle manual entry toggle
  const handleShowManualEntry = () => {
    setShowManualEntry(true);
    setManualTitle(query || '');
    setManualAuthor('');
    setTimeout(() => manualTitleRef.current?.focus(), 100);
  };

  // Submit manual book entry
  const handleManualSubmit = () => {
    const title = manualTitle.trim();
    const author = manualAuthor.trim();
    if (!title) return;
    const manualBook = {
      title,
      author: author || 'Unknown Author',
      google_books_id: null,
      cover_url: null,
      year: null,
      manual: true,
    };
    setShowManualEntry(false);
    setManualTitle('');
    setManualAuthor('');
    selectBook(manualBook);
    if (!user) {
      signupModal.open();
    }
  };

  // Cancel manual entry
  const handleCancelManual = () => {
    setShowManualEntry(false);
    setManualTitle('');
    setManualAuthor('');
  };

  return (
    <>
      <div
        className={`music-backdrop ${isOpen ? 'music-backdrop--open' : ''}`}
        onClick={handleBackdropClick}
      />
      <div
        ref={sidebarRef}
        className={`music-sidebar ${isOpen ? 'music-sidebar--open' : ''}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="music-sidebar__header">
          <span className="music-sidebar__title">
            <span className="music-sidebar__icon">{'\u{1F4DA}'}</span>
            {t('home.categories.books.title')}
          </span>
          <button className="music-sidebar__close" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* No ticker for books — go straight to content */}

        <div ref={contentRef} className="music-sidebar__content">
          <div className="music-search">
            <div className="music-search__input-wrapper">
              <input
                ref={inputRef}
                type="text"
                className="music-search__input"
                placeholder={t('home.categories.books.searchPlaceholder', 'Search for a book...')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!!selectedBook}
                autoComplete="off"
              />
              {loading && (
                <div className="music-search__loading">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
              {query && !loading && !selectedBook && (
                <button className="music-search__clear" onClick={() => setQuery('')}>
                  &times;
                </button>
              )}
            </div>
            {selectedBook && (
              <div className="music-selected">
                <div className="music-selected__info">
                  <div className="music-selected__song">{selectedBook.title}</div>
                  <div className="music-selected__artist">{selectedBook.author}</div>
                </div>
                <button className="music-selected__clear" onClick={clearBook}>
                  &times;
                </button>
              </div>
            )}
          </div>

          {!selectedBook && results.length > 0 && (
            <div className="music-results">
              <div className="music-results__header">
                {t('landing.results', 'Results')} ({results.length})
              </div>
              <div className="music-results__list">
                {results.map((book, i) => (
                  <button
                    key={book.google_books_id || i}
                    className={`music-results__item ${i === focusedIndex ? 'music-results__item--focused' : ''}`}
                    onClick={() => handleSelect(book)}
                    onMouseEnter={() => setFocusedIndex(i)}
                  >
                    <span className="music-results__song">{book.title}</span>
                    <span className="music-results__artist">
                      {book.author}
                      {book.year ? ` (${book.year})` : ''}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No results message + manual entry fallback */}
          {showNoResults && !showManualEntry && (
            <div className="book-no-results">
              <div className="book-no-results__message">
                {t('home.categories.books.noResults', 'No books found for your search.')}
              </div>
              <button
                className="book-no-results__manual-btn"
                onClick={handleShowManualEntry}
              >
                {t('home.categories.books.enterManually', "Can't find your book? Enter it manually")}
              </button>
            </div>
          )}

          {/* Manual entry form */}
          {showManualEntry && !selectedBook && (
            <div className="book-manual-entry">
              <div className="book-manual-entry__title">
                {t('home.categories.books.manualEntry', 'Enter book details')}
              </div>
              <input
                ref={manualTitleRef}
                type="text"
                className="music-search__input"
                placeholder={t('home.categories.books.titlePlaceholder', 'Book title *')}
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleManualSubmit();
                  if (e.key === 'Escape') handleCancelManual();
                }}
                autoComplete="off"
              />
              <input
                type="text"
                className="music-search__input"
                placeholder={t('home.categories.books.authorPlaceholder', 'Author (optional)')}
                value={manualAuthor}
                onChange={(e) => setManualAuthor(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleManualSubmit();
                  if (e.key === 'Escape') handleCancelManual();
                }}
                style={{ marginTop: '8px' }}
                autoComplete="off"
              />
              <div className="book-manual-entry__actions">
                <button
                  className="music-analyze__button"
                  onClick={handleManualSubmit}
                  disabled={!manualTitle.trim()}
                >
                  {t('home.categories.books.useThisBook', 'Use this book')}
                </button>
                <button
                  className="book-manual-entry__cancel"
                  onClick={handleCancelManual}
                >
                  {t('listen.cancel', 'Cancel')}
                </button>
              </div>
            </div>
          )}

          {selectedBook && !analysisResult && !panelResult && (
            <div className="music-analyze">
              {!isAnalyzing && !panelLoading ? (
                <div className="music-analyze__buttons-row">
                  <button
                    className="music-analyze__button"
                    onClick={handleAnalyze}
                    disabled={!canAnalyze}
                  >
                    {t('home.categories.books.analyzeButton', 'Analyze Book')}
                    <span className="music-analyze__cost">1 {t('philosopherPanel.credit', { defaultValue: 'credit' })}</span>
                  </button>
                  <button
                    className="music-analyze__button music-analyze__button--panel"
                    onClick={handleOpenPanel}
                    disabled={!canAnalyze}
                  >
                    {t('philosopherPanel.button', { defaultValue: 'Philosopher Panel' })}
                    <span className="music-analyze__cost">3 {t('philosopherPanel.credits', { defaultValue: 'credits' })}</span>
                  </button>
                </div>
              ) : isAnalyzing ? (
                <button
                  className="music-analyze__button music-analyze__button--cancel"
                  onClick={cancelAnalysis}
                >
                  {t('listen.cancel')}
                </button>
              ) : null}
              {isAnalyzing && (
                <div className="music-timer">
                  <div className="music-timer__bar">
                    <div className="music-timer__fill"></div>
                  </div>
                  <div className="music-timer__time">
                    <span>&#9201;</span> {formatTime(elapsedTime)}
                  </div>
                  <div className="music-timer__label">{t('landing.analyzingContent')}</div>
                </div>
              )}
              {panelLoading && (
                <div className="music-timer">
                  <div className="music-timer__bar">
                    <div className="music-timer__fill"></div>
                  </div>
                  <div className="music-timer__time">
                    <span>&#9201;</span> {formatTime(panelElapsed)}
                  </div>
                  <div className="music-timer__label">{t('philosopherPanel.generating', { defaultValue: 'Philosophers are analyzing...' })}</div>
                </div>
              )}
              {(analysisError || panelError) && <div className="music-error">{analysisError || panelError}</div>}
            </div>
          )}

          {analysisResult && (
            <div className="music-analysis">
              <div className="music-analysis__header">
                <span className="music-analysis__complete-icon">&#10003;</span>
                {t('landing.analysisComplete')}
              </div>
              <div className="music-analysis__results-wrapper">
                <ResultsContainer
                  result={analysisResult}
                  showShareActions={true}
                  mediaType="literature"
                />
              </div>
              <button
                className="music-analyze__button music-analyze__button--another"
                onClick={clearBook}
              >
                {t('home.categories.books.analyzeAnother', 'Analyze Another Book')}
              </button>
            </div>
          )}

          {panelResult && (
            <div className="music-analysis">
              <div className="music-analysis__header">
                <span className="music-analysis__complete-icon">&#10003;</span>
                {t('philosopherPanel.complete', { defaultValue: 'Philosopher Panel Complete' })}
              </div>
              <div className="listen-section">
                <ListenButton result={{
                  panelId: panelResult.id,
                  panelText: panelResult.analysis,
                  panelTitle: `${panelResult.title} - ${panelResult.artist}`,
                  lang: panelResult.lang,
                }} />
              </div>
              <div className="music-analysis__results-wrapper">
                <div className="panel-analysis" dangerouslySetInnerHTML={{
                  __html: panelResult.analysis
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/\n\n/g, '</p><p>')
                    .replace(/\n/g, '<br/>')
                    .replace(/^/, '<p>')
                    .replace(/$/, '</p>')
                }} />
              </div>
              <button
                className="music-analyze__button music-analyze__button--another"
                onClick={() => { setPanelResult(null); clearBook(); }}
              >
                {t('home.categories.books.analyzeAnother', 'Analyze Another Book')}
              </button>
            </div>
          )}
        </div>

        {/* Philosopher Picker */}
        {showPicker && (
          <PhilosopherPicker
            onConfirm={handlePanelConfirm}
            onClose={() => setShowPicker(false)}
            loading={panelLoading}
          />
        )}

        {/* Internal modals - only render wrapper when a modal is open */}
        {(loginModal.isOpen ||
          signupModal.isOpen ||
          forgotPasswordModal.isOpen ||
          paymentModal.isOpen) && (
          <div className="music-sidebar__modals">
            {loginModal.isOpen && (
              <LoginModal
                isOpen={true}
                onClose={loginModal.close}
                onSwitchToSignup={() => {
                  loginModal.close();
                  signupModal.open();
                }}
                onSwitchToForgot={() => {
                  loginModal.close();
                  forgotPasswordModal.open();
                }}
              />
            )}
            {signupModal.isOpen && (
              <SignupModal
                isOpen={true}
                onClose={signupModal.close}
                onSwitchToLogin={() => {
                  signupModal.close();
                  loginModal.open();
                }}
              />
            )}
            {forgotPasswordModal.isOpen && (
              <ForgotPasswordModal
                isOpen={true}
                onClose={forgotPasswordModal.close}
                onSwitchToLogin={() => {
                  forgotPasswordModal.close();
                  loginModal.open();
                }}
              />
            )}
            {paymentModal.isOpen && <PaymentModal isOpen={true} onClose={paymentModal.close} />}
          </div>
        )}
      </div>
    </>
  );
}

export default LiteratureSidebar;
