// Error Boundary - Catches React errors and shows fallback UI
import React from 'react';
import i18n from '@/i18n/config';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console (always, even in production)
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" aria-live="assertive" className="error-boundary">
          <h1 className="error-boundary__title">{i18n.t('errorBoundary.title')}</h1>
          <p className="error-boundary__message">{i18n.t('errorBoundary.message')}</p>
          <button onClick={this.handleRefresh} className="error-boundary__button">
            {i18n.t('errorBoundary.refreshButton')}
          </button>
          <p className="error-boundary__id">[Error ID: app-crash]</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
