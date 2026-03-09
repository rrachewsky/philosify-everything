// AnalyzeButton - Main analyze action button
import { useTranslation } from 'react-i18next';

// Force 11px font size on mobile - inline style overrides all CSS
const mobileStyle = { fontSize: '11px' };

export function AnalyzeButton({ onClick, onCancel, loading, disabled, disabledReason }) {
  const { t } = useTranslation();

  // Build tooltip message based on why button is disabled
  const getTooltip = () => {
    if (loading) return '';
    if (!disabledReason) return '';

    if (disabledReason === 'no-track') {
      return t('selectSongFirst', { defaultValue: 'Please select a song first' });
    }
    if (disabledReason === 'no-model') {
      return t('selectModelFirst', { defaultValue: 'Please select an AI model first' });
    }
    return '';
  };

  return (
    <div className="analyze-button-container">
      <button
        className="button"
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        title={getTooltip()}
        style={mobileStyle}
      >
        <span style={mobileStyle}>{loading ? t('analyzing') : t('analyze')}</span>
        {loading && <span className="btn-spinner" aria-hidden="true"></span>}
      </button>

      {loading && onCancel && (
        <button
          className="analyze-cancel-btn"
          type="button"
          onClick={onCancel}
          title="Cancel analysis"
          aria-label="Cancel analysis"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default AnalyzeButton;
