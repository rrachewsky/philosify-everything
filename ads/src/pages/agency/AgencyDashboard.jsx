import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAgency } from '@contexts/AgencyContext';
import { api } from '@services/api';

export default function AgencyDashboard() {
  const { t } = useTranslation();
  const { agency } = useAgency();
  const [clients, setClients] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [clientsData, earningsData] = await Promise.all([
          api.get('/ads/agency/clients'),
          api.get('/ads/agency/earnings'),
        ]);
        setClients(clientsData.clients || []);
        setEarnings(earningsData);
      } catch (err) {
        setError(err.message || t('agency.loadDashboardError'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page-stack">
      <section className="dashboard-hero">
        <div className="dashboard-hero__content">
          <p className="eyebrow">{t('agency.dashboard')}</p>
          <h2>{agency?.company_name || t('agency.welcome')}</h2>
          <p className="dashboard-hero__subtitle">{t('agency.manageClients')}</p>
        </div>
        <Link to="/agency/clients/new" className="btn btn--primary btn--large btn--cta">
          + {t('agency.addClient')}
        </Link>
      </section>

      {error && <div className="alert alert--error">{error}</div>}

      <section className="stats-grid stats-grid--prominent">
        <article className="stat-card stat-card--primary">
          <div className="stat-card__icon">💰</div>
          <div>
            <span className="stat-card__label">{t('agency.balance')}</span>
            <strong className="stat-card__value">${((earnings?.balance_cents || 0) / 100).toFixed(2)}</strong>
          </div>
          <Link to="/agency/earnings" className="stat-card__action">{t('agency.requestPayout')}</Link>
        </article>
        <article className="stat-card">
          <div className="stat-card__icon">📈</div>
          <div>
            <span className="stat-card__label">{t('agency.totalEarned')}</span>
            <strong className="stat-card__value">${((earnings?.total_earned_cents || 0) / 100).toFixed(2)}</strong>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-card__icon">👥</div>
          <div>
            <span className="stat-card__label">{t('agency.clients')}</span>
            <strong className="stat-card__value">{clients.length}</strong>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-card__icon">💵</div>
          <div>
            <span className="stat-card__label">{t('agency.commissionRate')}</span>
            <strong className="stat-card__value">{agency?.default_commission_pct || 10}%</strong>
          </div>
        </article>
      </section>

      <section className="surface-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('agency.recentClients')}</p>
            <h3>{t('agency.clients')}</h3>
          </div>
          <Link to="/agency/clients" className="btn btn--ghost">
            {t('common.viewAll')}
          </Link>
        </div>

        {clients.length === 0 ? (
          <div className="empty-state">
            <h4>{t('agency.noClients')}</h4>
            <Link to="/agency/clients/new" className="btn btn--primary">{t('agency.addClient')}</Link>
          </div>
        ) : (
          <div className="collection-list">
            {clients.slice(0, 5).map((client) => (
              <Link key={client.id} to={`/agency/clients/${client.advertiser_id}/campaigns`} className="collection-row">
                <div>
                  <strong>{client.company_name || client.email}</strong>
                  <p>{client.email} · {t('agency.commission')}: {client.commission_rate || agency?.default_commission_pct}%</p>
                </div>
                <span className={`status-chip status-chip--${client.status}`}>{client.status}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
