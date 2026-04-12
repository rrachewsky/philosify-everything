import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { api } from '@services/api';

function Dashboard() {
  const { t } = useTranslation();
  const { advertiser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [plansData, balanceData] = await Promise.all([
          api.get('/ads/plans'),
          api.get('/ads/billing/balance'),
        ]);

        setPlans(plansData.plans || []);
        setBalance(balanceData.balance_cents || 0);
      } catch (error) {
        console.error('Failed to load dashboard', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const totalBudget = plans.reduce((sum, plan) => sum + (plan.budget_cents || 0), 0);
    const awaitingPayment = plans.filter((plan) => plan.status === 'draft').length;
    const awaitingCreative = plans.filter((plan) => plan.status === 'pending_creative').length;
    const awaitingApproval = plans.filter((plan) => plan.status === 'pending_approval').length;
    const active = plans.filter((plan) => ['active', 'approved'].includes(plan.status)).length;

    return {
      totalBudget,
      awaitingPayment,
      awaitingCreative,
      awaitingApproval,
      active,
    };
  }, [plans]);

  if (loading) {
    return (
      <div className="status-shell">
        <div className="spinner" />
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  const recentPlans = plans.slice(0, 4);

  return (
    <div className="page-stack">
      <section className="hero-strip">
        <div>
          <p className="eyebrow">{t('dashboard.title')}</p>
          <h2>{t('dashboard.welcome')}, {advertiser?.company_name || ''}</h2>
        </div>
        <div className="hero-strip__actions">
          <Link to="/app/new" className="btn btn--primary btn--large">
            {t('dashboard.newCampaign')}
          </Link>
          <Link to="/app/campaigns" className="btn btn--secondary">
            {t('dashboard.reviewPipeline')}
          </Link>
          <Link to="/app/analytics" className="btn btn--secondary">
            {t('dashboard.analytics')}
          </Link>
        </div>
      </section>

      {advertiser?.status === 'pending' ? (
        <div className="alert alert--warning">
          {t('dashboard.pendingReview')}
        </div>
      ) : null}

      <section className="stats-grid">
        <article className="stat-panel">
          <span className="stat-panel__label">{t('dashboard.availableBalance')}</span>
          <strong className="stat-panel__value">${(balance / 100).toFixed(2)}</strong>
        </article>
        <article className="stat-panel">
          <span className="stat-panel__label">{t('dashboard.campaignInvestment')}</span>
          <strong className="stat-panel__value">${(stats.totalBudget / 100).toFixed(2)}</strong>
        </article>
        <article className="stat-panel">
          <span className="stat-panel__label">{t('dashboard.awaitingPayment')}</span>
          <strong className="stat-panel__value">{stats.awaitingPayment}</strong>
        </article>
        <article className="stat-panel">
          <span className="stat-panel__label">{t('dashboard.awaitingCreative')}</span>
          <strong className="stat-panel__value">{stats.awaitingCreative + stats.awaitingApproval}</strong>
        </article>
      </section>

      <section className="editorial-grid editorial-grid--dashboard">
        <article className="editorial-card">
          <p className="eyebrow">{t('dashboard.actionInbox')}</p>
          <h3>{t('dashboard.whatNeedsAttention')}</h3>
          <ul className="bullet-list">
            <li>{t('dashboard.draftsWaiting', { count: stats.awaitingPayment })}</li>
            <li>{t('dashboard.inStudio', { count: stats.awaitingCreative })}</li>
            <li>{t('dashboard.waitingApproval', { count: stats.awaitingApproval })}</li>
            <li>{t('dashboard.approvedActive', { count: stats.active })}</li>
          </ul>
        </article>
        <article className="editorial-card">
          <p className="eyebrow">{t('dashboard.recommendedFlow')}</p>
          <h3>{t('dashboard.keepLaunches')}</h3>
          <ul className="bullet-list">
            <li>{t('dashboard.defineBrief')}</li>
            <li>{t('dashboard.uploadAssets')}</li>
            <li>{t('dashboard.approveDraft')}</li>
          </ul>
        </article>
      </section>

      <section className="surface-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('dashboard.recentCampaigns')}</p>
            <h3>{t('dashboard.recentCampaigns')}</h3>
          </div>
          <Link to="/app/campaigns" className="btn btn--ghost">
            {t('dashboard.viewAll')}
          </Link>
        </div>

        {recentPlans.length === 0 ? (
          <div className="empty-state">
            <h4>{t('dashboard.noCampaigns')}</h4>
            <Link to="/app/new" className="btn btn--primary">
              {t('dashboard.newCampaign')}
            </Link>
          </div>
        ) : (
          <div className="collection-list">
            {recentPlans.map((plan) => (
              <Link key={plan.id} to={`/app/campaigns/${plan.id}`} className="collection-row">
                <div>
                  <strong>{plan.name}</strong>
                  <p>
                    {plan.goal} · {plan.creative_type === 'self' ? t('campaigns.uploaded') : t('campaigns.philosifyMock')} ·{' '}
                    ${(plan.total_cost_cents / 100).toFixed(2)}
                  </p>
                </div>
                <span className={`status-chip status-chip--${plan.status}`}>{plan.status}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
