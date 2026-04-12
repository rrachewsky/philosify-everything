import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@services/api';

export default function AgencyClients() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newClient, setNewClient] = useState({ email: '', company_name: '' });
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    try {
      const data = await api.get('/ads/agency/clients');
      setClients(data.clients || []);
    } catch (err) {
      setLoadError(err.message || t('agency.loadClientsError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleAddClient(e) {
    e.preventDefault();
    setError('');
    setAdding(true);
    try {
      await api.post('/ads/agency/clients', newClient);
      setNewClient({ email: '', company_name: '' });
      setShowAdd(false);
      await loadClients();
    } catch (err) {
      setError(err.message || t('agency.addClientError'));
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>{t('agency.clientManagement')}</h1>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? t('common.cancel') : t('agency.addClient')}
        </button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3>{t('agency.addNewClient')}</h3>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleAddClient}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="client-email">{t('agency.clientEmail')}</label>
                <input
                  id="client-email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  required
                  placeholder={t('agency.clientEmailPlaceholder')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="client-company">{t('agency.clientCompany')}</label>
                <input
                  id="client-company"
                  type="text"
                  value={newClient.company_name}
                  onChange={(e) => setNewClient({ ...newClient, company_name: e.target.value })}
                  placeholder={t('agency.companyPlaceholder')}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={adding}>
              {adding ? t('agency.adding') : t('agency.addClient')}
            </button>
          </form>
        </div>
      )}

      {loadError && <div className="auth-error">{loadError}</div>}

      {clients.length === 0 && !loadError ? (
        <div className="empty-state">
          <p>{t('agency.noClients')}</p>
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
                <th>{t('agency.joined')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td><strong>{client.company_name || t('common.na')}</strong></td>
                  <td>{client.email}</td>
                  <td>
                    <span className={`badge badge-${client.status === 'approved' ? 'success' : client.status === 'pending' ? 'warning' : 'danger'}`}>
                      {client.status}
                    </span>
                  </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="1"
                        defaultValue={client.commission_rate}
                        style={{ width: '60px', textAlign: 'center' }}
                        onBlur={async (e) => {
                          const newRate = parseInt(e.target.value, 10);
                          if (newRate !== client.commission_rate && newRate >= 0 && newRate <= 50) {
                            try {
                              await api.put(`/ads/agency/clients/${client.id}/commission`, { commission_rate: newRate });
                              loadClients();
                            } catch (err) {
                              setLoadError(err.message || t('agency.updateCommissionError'));
                            }
                          }
                        }}
                      />%
                    </td>
                  <td>{new Date(client.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-sm"
                      onClick={() => navigate(`/agency/clients/${client.advertiser_id}/campaigns`)}
                    >
                      {t('agency.campaigns')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
