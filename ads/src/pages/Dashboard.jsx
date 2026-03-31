import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { api } from '@services/api';

function Dashboard() {
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
        <p>Composing your dashboard...</p>
      </div>
    );
  }

  const recentPlans = plans.slice(0, 4);

  return (
    <div className="page-stack">
      <section className="hero-strip">
        <div>
          <p className="eyebrow">Advertiser workspace</p>
          <h2>{advertiser?.company_name || 'Your atelier'} at a glance</h2>
          <p className="lead">
            Move from brief to approved launch with a dashboard built around the next useful action.
          </p>
        </div>
        <div className="hero-strip__actions">
          <Link to="/app/new" className="btn btn--primary btn--large">
            New campaign
          </Link>
          <Link to="/app/campaigns" className="btn btn--secondary">
            Review pipeline
          </Link>
        </div>
      </section>

      {advertiser?.status === 'pending' ? (
        <div className="alert alert--warning">
          Your account is still under review. You can compose campaigns now, but launch begins after
          Philosify approves the account.
        </div>
      ) : null}

      <section className="stats-grid">
        <article className="stat-panel">
          <span className="stat-panel__label">Available balance</span>
          <strong className="stat-panel__value">${(balance / 100).toFixed(2)}</strong>
        </article>
        <article className="stat-panel">
          <span className="stat-panel__label">Campaign investment</span>
          <strong className="stat-panel__value">${(stats.totalBudget / 100).toFixed(2)}</strong>
        </article>
        <article className="stat-panel">
          <span className="stat-panel__label">Awaiting payment</span>
          <strong className="stat-panel__value">{stats.awaitingPayment}</strong>
        </article>
        <article className="stat-panel">
          <span className="stat-panel__label">Awaiting creative or review</span>
          <strong className="stat-panel__value">{stats.awaitingCreative + stats.awaitingApproval}</strong>
        </article>
      </section>

      <section className="editorial-grid editorial-grid--dashboard">
        <article className="editorial-card">
          <p className="eyebrow">Action inbox</p>
          <h3>What needs attention now</h3>
          <ul className="bullet-list">
            <li>{stats.awaitingPayment} draft campaigns are waiting for payment.</li>
            <li>{stats.awaitingCreative} campaigns are in the studio.</li>
            <li>{stats.awaitingApproval} campaigns are waiting for approval.</li>
            <li>{stats.active} campaigns are approved or active.</li>
          </ul>
        </article>
        <article className="editorial-card">
          <p className="eyebrow">Recommended flow</p>
          <h3>Keep launches graceful.</h3>
          <ul className="bullet-list">
            <li>Define the brief and destination URL clearly.</li>
            <li>Upload assets or request a Philosify mock.</li>
            <li>Approve the draft quickly once it is ready.</li>
          </ul>
        </article>
      </section>

      <section className="surface-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Recent campaigns</p>
            <h3>Latest work in the atelier</h3>
          </div>
          <Link to="/app/campaigns" className="btn btn--ghost">
            View all
          </Link>
        </div>

        {recentPlans.length === 0 ? (
          <div className="empty-state">
            <h4>No campaigns yet</h4>
            <p>Your first campaign starts with a brief, a budget, and a placement choice.</p>
            <Link to="/app/new" className="btn btn--primary">
              Start a campaign
            </Link>
          </div>
        ) : (
          <div className="collection-list">
            {recentPlans.map((plan) => (
              <Link key={plan.id} to={`/app/campaigns/${plan.id}`} className="collection-row">
                <div>
                  <strong>{plan.name}</strong>
                  <p>
                    {plan.goal} · {plan.creative_type === 'self' ? 'Uploaded creative' : 'Philosify mock'} ·{' '}
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
