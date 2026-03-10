// ScorecardTable - Weighted philosophical scorecard with 5 branches
// Layout: Branch title row + 2-column body (score | justification)
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
    <div className="result-card scorecard-card">
      <h3 className="result-card-title">
        {t('scorecard', { defaultValue: 'Weighted Philosophical Scorecard' })}
      </h3>

      <div className="scorecard-sections">
        {BRANCH_ORDER.map((branch) => {
          const branchData = scorecard[branch];
          if (!branchData) return null;

          const score = branchData.score;
          const justification = branchData.justification || '';
          const weight = WEIGHTS[branch];
          const branchName =
            t(`branches.${branch}`) || branch.charAt(0).toUpperCase() + branch.slice(1);

          return (
            <div key={branch} className="scorecard-branch">
              <div className="scorecard-branch__title">
                <span className="scorecard-branch__name">
                  {branchName.toUpperCase()} ({weight}%)
                </span>
                <span className="scorecard-branch__score">
                  {score > 0 ? '+' : ''}
                  {score}
                </span>
              </div>
              <div className="scorecard-branch__justification">
                <div
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(stripTrailingWordCount(justification)),
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ScorecardTable;
