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
        setError(err.message || 'Failed to load dashboard');
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
          <div className="stat-label">Commission Rate</div>
          <div className="stat-value">{agency?.default_commission_pct || 10}%</div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Clients</h2>
          <Link to="/agency/clients/new" className="btn btn-primary btn-sm">
            Add Client
          </Link>
        </div>

        {clients.length === 0 ? (
          <div className="empty-state">
            <p>No clients yet. Add your first client to start managing their campaigns.</p>
            <Link to="/agency/clients/new" className="btn btn-primary">Add Client</Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Commission</th>
                  <th>Actions</th>
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
                        Campaigns
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
            <h2>Payouts</h2>
          </div>
          <div className="payout-card">
            <p>You have <strong>${((earnings?.balance_cents || 0) / 100).toFixed(2)}</strong> available for payout.</p>
            <Link to="/agency/earnings" className="btn btn-primary">Request Payout</Link>
          </div>
        </div>
      )}
    </div>
  );
}
