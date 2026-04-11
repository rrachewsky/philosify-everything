import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { api } from '@services/api';

function Plans() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await api.get('/ads/plans');
      setPlans(data.plans || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="status-shell">
        <div className="spinner" />
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="section-heading">
        <div>
          <p className="eyebrow">{t('campaigns.title')}</p>
          <h2>{t('campaigns.title')}</h2>
        </div>
        <Link to="/app/new" className="btn btn--primary">
          {t('dashboard.newCampaign')}
        </Link>
      </section>

      {error ? <div className="alert alert--error">{error}</div> : null}

      <section className="surface-card">
        {plans.length === 0 ? (
          <div className="empty-state">
            <h4>{t('campaigns.noCampaigns')}</h4>
            <Link to="/app/new" className="btn btn--primary">
              {t('create.createCampaign')}
            </Link>
          </div>
        ) : (
          <div className="collection-list">
            {plans.map((plan) => (
              <Link key={plan.id} to={`/app/campaigns/${plan.id}`} className="collection-row collection-row--stacked">
                <div className="collection-row__main">
                  <strong>{plan.name}</strong>
                  <p>
                    {plan.goal} · {plan.creative_type === 'self' ? t('campaigns.uploaded') : t('campaigns.philosifyMock')} ·{' '}
                    {(plan.start_date && plan.end_date)
                      ? `${new Date(plan.start_date).toLocaleDateString()} - ${new Date(plan.end_date).toLocaleDateString()}`
                      : t('campaigns.flexible')}
                  </p>
                </div>
                <div className="collection-row__meta">
                  <span>${(plan.total_cost_cents / 100).toFixed(2)}</span>
                  <span className={`status-chip status-chip--${plan.status}`}>{plan.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Plans;
