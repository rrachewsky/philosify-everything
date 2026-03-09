// ScorecardTable - Weighted philosophical scorecard with 5 branches
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';

const WEIGHTS = {
  ethics: 40,
  metaphysics: 20,
  epistemology: 20,
  politics: 10,
  aesthetics: 10,
};

const BRANCH_ORDER = ['ethics', 'metaphysics', 'epistemology', 'politics', 'aesthetics'];

export function ScorecardTable({ scorecard }) {
  const { t } = useTranslation();

  if (!scorecard) return null;

  const stripTrailingWordCount = (value) => {
    if (!value) return value;
    const s = String(value);
    return s.replace(/\s*\(\s*\d+\s*(palavras|words)\s*\)\s*$/i, '').trim();
  };

  return (
    <div className="result-card">
      <h3 className="result-card-title">
        {t('scorecard', { defaultValue: 'Weighted Philosophical Scorecard' })}
      </h3>

      <table className="scorecard-table">
        <thead>
          <tr>
            <th>{t('branch', { defaultValue: 'Branch' })}</th>
            <th>{t('scoreRange', { defaultValue: 'Score Range\n(-10 to +10)' })}</th>
            <th>{t('justification', { defaultValue: 'Philosophical Justification' })}</th>
          </tr>
        </thead>
        <tbody>
          {BRANCH_ORDER.map((branch) => {
            const branchData = scorecard[branch];
            if (!branchData) return null;

            const score = branchData.score;
            const justification = branchData.justification || '';
            const weight = WEIGHTS[branch];

            return (
              <tr key={branch}>
                <td className="scorecard-axis">
                  {t(`branches.${branch}`) || branch.charAt(0).toUpperCase() + branch.slice(1)}
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#000',
                      marginTop: '4px',
                      fontWeight: 'normal',
                    }}
                  >
                    ({t('weight', { defaultValue: 'weight' })} {weight}%)
                  </div>
                </td>
                <td className="scorecard-score">
                  {score > 0 ? '+' : ''}
                  {score}
                </td>
                <td className="scorecard-justification">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(stripTrailingWordCount(justification)),
                    }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ScorecardTable;
