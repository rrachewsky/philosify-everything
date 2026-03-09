// ScoreCard - Philosophical score display card
import { useTranslation } from 'react-i18next';

export function ScoreCard({ branch, score, justification, weight }) {
  const { t } = useTranslation();

  // Color based on score
  const getScoreColor = (score) => {
    if (score >= 7) return '#4CAF50'; // Green - Revolutionary
    if (score >= 3) return '#8BC34A'; // Light green
    if (score >= -2) return '#FFC107'; // Yellow - Neutral
    if (score >= -6) return '#FF9800'; // Orange
    return '#F44336'; // Red - Conformist
  };

  const scoreColor = getScoreColor(score);
  const barWidth = `${((score + 10) / 20) * 100}%`;

  return (
    <div className="score-card">
      {/* Header with branch name and score */}
      <div className="score-card__header">
        <div className="score-card__branch">{t(branch.toLowerCase())}</div>
        <div className="score-card__score" style={{ color: scoreColor }}>
          {score > 0 ? '+' : ''}
          {score}
        </div>
      </div>

      {/* Weight indicator */}
      {weight && (
        <div className="score-card__weight">
          {t('weight')}: {weight}
        </div>
      )}

      {/* Score bar */}
      <div className="score-card__bar">
        <div
          className="score-card__bar-fill"
          style={{ width: barWidth, backgroundColor: scoreColor }}
        />
      </div>

      {/* Justification */}
      {justification && (
        <div className="score-card__justification">
          <strong>{t('justification')}:</strong> {justification}
        </div>
      )}
    </div>
  );
}

export default ScoreCard;
