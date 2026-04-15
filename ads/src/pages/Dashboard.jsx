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
  const [invitations, setInvitations] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [plansData, balanceData, invData] = await Promise.all([
          api.get('/ads/plans'),
          api.get('/ads/billing/balance'),
          api.get('/ads/account/invitations').catch(() => ({ invitations: [] })),
        ]);

        setPlans(plansData.plans || []);
        setBalance(balanceData.balance_cents || 0);
        setInvitations((invData.invitations || []).filter((i) => i.status === 'pending'));
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
      <section className="dashboard-hero">
        <div className="dashboard-hero__content">
          <p className="eyebrow">{t('dashboard.title')}</p>
          <h2>{advertiser?.company_name || t('dashboard.welcome')}</h2>
          <p className="dashboard-hero__subtitle">{t('dashboard.subtitle')}</p>
        </div>
        <Link to="/app/new" className="btn btn--primary btn--large btn--cta">
          + {t('dashboard.newCampaign')}
        </Link>
      </section>

      {advertiser?.status === 'pending' ? (
        <div className="alert alert--warning">
          {t('dashboard.pendingReview')}
        </div>
      ) : null}

      {invitations.length > 0 && (
        <section className="alert alert--info">
          <strong>{t('dashboard.agencyInvitations')}</strong>: {invitations.length} {t('dashboard.pendingInvitationsCount')}
          <Link to="/app/settings" className="btn btn--ghost btn--small">{t('common.review')}</Link>
        </section>
      )}

      <section className="stats-grid stats-grid--prominent">
        <article className="stat-card stat-card--primary">
          <div className="stat-card__icon">💰</div>
          <div>
            <span className="stat-card__label">{t('dashboard.availableBalance')}</span>
            <strong className="stat-card__value">${(balance / 100).toFixed(2)}</strong>
          </div>
          <Link to="/app/billing" className="stat-card__action">{t('dashboard.addFunds')}</Link>
        </article>
        <article className="stat-card">
          <div className="stat-card__icon">📊</div>
          <div>
            <span className="stat-card__label">{t('dashboard.activeCampaigns')}</span>
            <strong className="stat-card__value">{stats.active}</strong>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-card__icon">⏳</div>
          <div>
            <span className="stat-card__label">{t('dashboard.pending')}</span>
            <strong className="stat-card__value">{stats.awaitingPayment + stats.awaitingCreative + stats.awaitingApproval}</strong>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-card__icon">💵</div>
          <div>
            <span className="stat-card__label">{t('dashboard.totalInvestment')}</span>
            <strong className="stat-card__value">${(stats.totalBudget / 100).toFixed(2)}</strong>
          </div>
        </article>
      </section>

      {stats.awaitingPayment + stats.awaitingCreative + stats.awaitingApproval > 0 && (
        <section className="quick-actions">
          <h3>{t('dashboard.quickActions')}</h3>
          <div className="quick-actions__grid">
            {stats.awaitingPayment > 0 && (
              <Link to="/app/campaigns?status=draft" className="quick-action-card">
                <span className="quick-action-card__badge">{stats.awaitingPayment}</span>
                <span>{t('dashboard.completeDrafts')}</span>
              </Link>
            )}
            {stats.awaitingCreative > 0 && (
              <Link to="/app/campaigns?status=pending_creative" className="quick-action-card">
                <span className="quick-action-card__badge">{stats.awaitingCreative}</span>
                <span>{t('dashboard.uploadCreatives')}</span>
              </Link>
            )}
            {stats.awaitingApproval > 0 && (
              <Link to="/app/campaigns?status=pending_approval" className="quick-action-card">
                <span className="quick-action-card__badge">{stats.awaitingApproval}</span>
                <span>{t('dashboard.reviewApprovals')}</span>
              </Link>
            )}
          </div>
        </section>
      )}

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
