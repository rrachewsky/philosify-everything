import { useEffect, useState } from 'react';
import { useAgency } from '@contexts/AgencyContext';
import { api } from '@services/api';

export default function AgencyEarnings() {
  const { agency } = useAgency();
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutResult, setPayoutResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get('/ads/agency/earnings');
        setEarnings(data);
      } catch (err) {
        setError(err.message || 'Failed to load earnings');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handlePayout() {
    setPayoutLoading(true);
    setError('');
    setPayoutResult(null);
    try {
      const data = await api.post('/ads/agency/payout', {
        amount_cents: earnings?.balance_cents,
        payout_method: 'bank_transfer',
      });
      setPayoutResult(data);
      // Refresh earnings
      const updated = await api.get('/ads/agency/earnings');
      setEarnings(updated);
    } catch (err) {
      setError(err.message || 'Payout request failed');
    } finally {
      setPayoutLoading(false);
    }
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const balance = (earnings?.balance_cents || 0) / 100;
  const totalEarned = (earnings?.total_earned_cents || 0) / 100;
  const totalPaid = (earnings?.total_paid_cents || 0) / 100;
  const canPayout = (earnings?.balance_cents || 0) >= 10000;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Earnings & Payouts</h1>
      </div>

      {error && <div className="auth-error">{error}</div>}
      {payoutResult && (
        <div className="success-banner">
          Payout of ${(payoutResult.amount_cents / 100).toFixed(2)} requested.
          {payoutResult.message}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Available Balance</div>
          <div className="stat-value">${balance.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Earned</div>
          <div className="stat-value">${totalEarned.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Paid Out</div>
          <div className="stat-value">${totalPaid.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Commission Rate</div>
          <div className="stat-value">{agency?.default_commission_pct || 10}%</div>
        </div>
      </div>

      <div className="section" style={{ marginTop: '2rem' }}>
        <h2>Request Payout</h2>
        {canPayout ? (
          <div className="payout-card">
            <p>
              You have <strong>${balance.toFixed(2)}</strong> available.
              Minimum payout is $100.00. Processing typically takes 3-5 business days.
            </p>
            <button
              className="btn btn-primary"
              onClick={handlePayout}
              disabled={payoutLoading}
            >
              {payoutLoading ? 'Processing...' : `Request Payout ($${balance.toFixed(2)})`}
            </button>
          </div>
        ) : (
          <div className="empty-state">
            <p>
              Minimum payout is $100.00. Current balance: ${balance.toFixed(2)}.
              Keep managing campaigns to earn more commissions.
            </p>
          </div>
        )}
      </div>

      {earnings?.transactions?.length > 0 && (
        <div className="section" style={{ marginTop: '2rem' }}>
          <h2>Transaction History</h2>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Balance After</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {earnings.transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{new Date(tx.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge badge-${tx.type === 'commission' ? 'success' : 'info'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className={tx.amount_cents >= 0 ? 'text-success' : 'text-danger'}>
                      {tx.amount_cents >= 0 ? '+' : ''}${(tx.amount_cents / 100).toFixed(2)}
                    </td>
                    <td>${(tx.balance_after_cents / 100).toFixed(2)}</td>
                    <td>{tx.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
