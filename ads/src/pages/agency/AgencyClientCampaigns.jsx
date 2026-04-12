import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@services/api';

export default function AgencyClientCampaigns() {
  const { t } = useTranslation();
  const { clientId } = useParams();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get(`/ads/agency/clients/${clientId}/campaigns`);
        setCampaigns(data.campaigns || []);
      } catch (err) {
        setError(err.message || t('agency.loadCampaignsError'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [clientId]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <Link to="/agency/clients" className="btn btn-sm" style={{ marginBottom: '0.5rem' }}>
            &larr; {t('agency.backToClients')}
          </Link>
          <h1>{t('agency.clientCampaigns')}</h1>
        </div>
      </div>

      {error && <div className="auth-error">{error}</div>}

      {campaigns.length === 0 ? (
        <div className="empty-state">
          <p>{t('agency.noCampaignsClient')}</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('common.name')}</th>
                <th>{t('agency.placement')}</th>
                <th>{t('common.status')}</th>
                <th>{t('agency.impressions')}</th>
                <th>{t('agency.budget')}</th>
                <th>{t('agency.created')}</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.placement}</td>
                  <td>
                    <span className={`badge badge-${c.status === 'active' ? 'success' : c.status === 'completed' ? 'info' : 'warning'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    {c.impressions_delivered?.toLocaleString() || 0} / {c.impressions_ordered?.toLocaleString() || 0}
                  </td>
                  <td>${((c.total_cents || 0) / 100).toFixed(2)}</td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
