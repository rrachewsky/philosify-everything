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
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
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
    <div className="page-stack">
      <section className="hero-strip">
        <div>
          <p className="eyebrow">{t('agency.clientManagement')}</p>
          <h2>{t('agency.clients')}</h2>
        </div>
        <div className="hero-strip__actions">
          <button className="btn btn--primary" onClick={() => { setShowAdd(!showAdd); setShowInvite(false); }}>
            {showAdd ? t('common.cancel') : '+ ' + t('agency.addClient')}
          </button>
          <button className="btn btn--secondary" onClick={() => { setShowInvite(!showInvite); setShowAdd(false); }}>
            {showInvite ? t('common.cancel') : t('agency.inviteExisting')}
          </button>
        </div>
      </section>

      {showInvite && (
        <section className="surface-card">
          <h3>{t('agency.inviteExistingClient')}</h3>
          {error && <div className="alert alert--error">{error}</div>}
          <div className="field">
            <input
              type="email"
              placeholder={t('agency.clientEmailPlaceholder')}
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          <button
            className="btn btn--primary"
            disabled={inviting || !inviteEmail}
            onClick={async () => {
              setInviting(true);
              setError('');
              try {
                await api.post('/ads/agency/clients/invite', { email: inviteEmail });
                setInviteEmail('');
                setShowInvite(false);
                await loadClients();
              } catch (err) {
                setError(err.message);
              } finally {
                setInviting(false);
              }
            }}
          >
            {inviting ? t('agency.adding') : t('agency.sendInvite')}
          </button>
        </section>
      )}

      {showAdd && (
        <section className="surface-card">
          <h3>{t('agency.addNewClient')}</h3>
          {error && <div className="alert alert--error">{error}</div>}
          <form onSubmit={handleAddClient} className="stack">
            <div className="field-grid">
              <div className="field">
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
              <div className="field">
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
            <button type="submit" className="btn btn--primary" disabled={adding}>
              {adding ? t('agency.adding') : t('agency.addClient')}
            </button>
          </form>
        </section>
      )}

      {loadError && <div className="alert alert--error">{loadError}</div>}

      <section className="surface-card">
        {clients.length === 0 && !loadError ? (
          <div className="empty-state">
            <h4>{t('agency.noClients')}</h4>
            <p>{t('agency.noClientsMessage')}</p>
          </div>
        ) : (
          <div className="collection-list">
            {clients.map((client) => (
              <div key={client.id} className="collection-row collection-row--stacked">
                <div className="collection-row__main">
                  <strong>{client.company_name || t('common.na')}</strong>
                  <p>{client.email} · {t('agency.joined')}: {new Date(client.created_at).toLocaleDateString()}</p>
                </div>
                <div className="collection-row__meta">
                  <span className={`status-chip status-chip--${client.status}`}>{client.status}</span>
                  <div className="commission-control">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="1"
                      defaultValue={client.commission_rate}
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
                    />
                    <span>%</span>
                  </div>
                  <button
                    className="btn btn--secondary btn--small"
                    onClick={() => navigate(`/agency/clients/${client.advertiser_id}/campaigns`)}
                  >
                    {t('agency.campaigns')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
