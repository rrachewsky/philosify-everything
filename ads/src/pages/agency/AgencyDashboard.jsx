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
    <div className="page-content">
      <div className="page-header">
        <h1>{t('agency.dashboard')}</h1>
        <p className="text-muted">{t('agency.welcome')}, {agency?.company_name}</p>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">{t('agency.balance')}</div>
          <div className="stat-value">${((earnings?.balance_cents || 0) / 100).toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('agency.totalEarned')}</div>
          <div className="stat-value">${((earnings?.total_earned_cents || 0) / 100).toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('agency.clients')}</div>
          <div className="stat-value">{clients.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('agency.commissionRate')}</div>
          <div className="stat-value">{agency?.default_commission_pct || 10}%</div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>{t('agency.clients')}</h2>
          <Link to="/agency/clients/new" className="btn btn-primary btn-sm">
            {t('agency.addClient')}
          </Link>
        </div>

        {clients.length === 0 ? (
          <div className="empty-state">
            <p>{t('agency.noClients')}</p>
            <Link to="/agency/clients/new" className="btn btn-primary">{t('agency.addClient')}</Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('agency.company')}</th>
                  <th>{t('common.email')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('agency.commission')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td>{client.company_name || client.email}</td>
                    <td>{client.email}</td>
                    <td>
                      <span className={`badge badge-${client.status === 'approved' ? 'success' : 'warning'}`}>
                        {client.status}
                      </span>
                    </td>
                    <td>{client.commission_rate || agency?.default_commission_pct}%</td>
                    <td>
                      <Link to={`/agency/clients/${client.advertiser_id}/campaigns`} className="btn btn-sm">
                        {t('agency.campaigns')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(earnings?.balance_cents || 0) >= 10000 && (
        <div className="section">
          <div className="section-header">
            <h2>{t('agency.requestPayout')}</h2>
          </div>
          <div className="payout-card">
            <p>{t('agency.payoutAvailable', { amount: ((earnings?.balance_cents || 0) / 100).toFixed(2) })}</p>
            <Link to="/agency/earnings" className="btn btn-primary">{t('agency.requestPayout')}</Link>
          </div>
        </div>
      )}
    </div>
  );
}
