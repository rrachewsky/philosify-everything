import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAgency } from '@contexts/AgencyContext';
import { api } from '@services/api';

export default function AgencyEarnings() {
  const { t } = useTranslation();
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
        setError(err.message || t('agency.loadEarningsError'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // SECURITY: Synchronous guard prevents double-click race condition
  const payoutInFlight = useRef(false);

  async function handlePayout() {
    if (payoutInFlight.current) return;
    if (!confirm(t('agency.payoutConfirm', { amount: balance.toFixed(2) }))) return;
    payoutInFlight.current = true;
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
      setError(err.message || t('agency.payoutError'));
    } finally {
      setPayoutLoading(false);
      payoutInFlight.current = false;
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
        <h1>{t('agency.earningsTitle')}</h1>
      </div>

      {error && <div className="auth-error">{error}</div>}
      {payoutResult && (
        <div className="success-banner">
          {t('agency.payoutRequested')} ${(payoutResult.amount_cents / 100).toFixed(2)}.
          {payoutResult.message}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">{t('agency.availableBalance')}</div>
          <div className="stat-value">${balance.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('agency.totalEarned')}</div>
          <div className="stat-value">${totalEarned.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('agency.totalPaidOut')}</div>
          <div className="stat-value">${totalPaid.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('agency.commissionRate')}</div>
          <div className="stat-value">{agency?.default_commission_pct || 10}%</div>
        </div>
      </div>

      <div className="section" style={{ marginTop: '2rem' }}>
        <h2>{t('agency.requestPayout')}</h2>
        {canPayout ? (
          <div className="payout-card">
            <p>
              {t('agency.payoutAvailable', { amount: balance.toFixed(2) })}
              {' '}{t('agency.processingTime')}
            </p>
            <button
              className="btn btn-primary"
              onClick={handlePayout}
              disabled={payoutLoading}
            >
              {payoutLoading ? t('agency.processing') : `${t('agency.requestPayout')} ($${balance.toFixed(2)})`}
            </button>
          </div>
        ) : (
          <div className="empty-state">
            <p>
              {t('agency.payoutMinBalance', { amount: balance.toFixed(2) })}
            </p>
          </div>
        )}
      </div>

      {earnings?.transactions?.length > 0 && (
        <div className="section" style={{ marginTop: '2rem' }}>
          <h2>{t('agency.transactionHistory')}</h2>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('common.date')}</th>
                  <th>{t('agency.type')}</th>
                  <th>{t('common.amount')}</th>
                  <th>{t('agency.balanceAfter')}</th>
                  <th>{t('common.description')}</th>
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
