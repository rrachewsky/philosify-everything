import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@services/api';

export default function AgencyClients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newClient, setNewClient] = useState({ email: '', company_name: '' });
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    try {
      const data = await api.get('/ads/agency/clients');
      setClients(data.clients || []);
    } catch (err) {
      console.error('Failed to load clients:', err);
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
      setError(err.message || 'Failed to add client');
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Client Management</h1>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancel' : 'Add Client'}
        </button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3>Add New Client</h3>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleAddClient}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="client-email">Client Email</label>
                <input
                  id="client-email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  required
                  placeholder="client@company.com"
                />
              </div>
              <div className="form-group">
                <label htmlFor="client-company">Company Name</label>
                <input
                  id="client-company"
                  type="text"
                  value={newClient.company_name}
                  onChange={(e) => setNewClient({ ...newClient, company_name: e.target.value })}
                  placeholder="Company Inc."
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={adding}>
              {adding ? 'Adding...' : 'Add Client'}
            </button>
          </form>
        </div>
      )}

      {clients.length === 0 ? (
        <div className="empty-state">
          <p>No clients yet. Add your first client to start managing their ad campaigns on Philosify.</p>
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
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td><strong>{client.company_name || 'N/A'}</strong></td>
                  <td>{client.email}</td>
                  <td>
                    <span className={`badge badge-${client.status === 'approved' ? 'success' : client.status === 'pending' ? 'warning' : 'danger'}`}>
                      {client.status}
                    </span>
                  </td>
                  <td>{client.commission_rate}%</td>
                  <td>{new Date(client.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-sm"
                      onClick={() => navigate(`/agency/clients/${client.advertiser_id}/campaigns`)}
                    >
                      Campaigns
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
