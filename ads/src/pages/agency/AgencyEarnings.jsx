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
    <div className="page-stack">
      <section className="hero-strip">
        <div>
          <p className="eyebrow">{t('agency.earningsTitle')}</p>
          <h2>{t('agency.earnings')}</h2>
        </div>
      </section>

      {error && <div className="alert alert--error">{error}</div>}
      {payoutResult && (
        <div className="alert alert--success">
          {t('agency.payoutRequested')} ${(payoutResult.amount_cents / 100).toFixed(2)}.
          {payoutResult.message}
        </div>
      )}

      <section className="stats-grid stats-grid--prominent">
        <article className="stat-card stat-card--primary">
          <div className="stat-card__icon">💰</div>
          <div>
            <span className="stat-card__label">{t('agency.availableBalance')}</span>
            <strong className="stat-card__value">${balance.toFixed(2)}</strong>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-card__icon">📈</div>
          <div>
            <span className="stat-card__label">{t('agency.totalEarned')}</span>
            <strong className="stat-card__value">${totalEarned.toFixed(2)}</strong>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-card__icon">💵</div>
          <div>
            <span className="stat-card__label">{t('agency.totalPaidOut')}</span>
            <strong className="stat-card__value">${totalPaid.toFixed(2)}</strong>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-card__icon">📊</div>
          <div>
            <span className="stat-card__label">{t('agency.commissionRate')}</span>
            <strong className="stat-card__value">{agency?.default_commission_pct || 10}%</strong>
          </div>
        </article>
      </section>

      <section className="surface-card">
        <header className="surface-card__header">
          <h2 className="surface-card__title">{t('agency.requestPayout')}</h2>
        </header>
        <div className="surface-card__content">
          {canPayout ? (
            <div className="payout-ready">
              <p className="payout-ready__message">
                {t('agency.payoutAvailable', { amount: balance.toFixed(2) })}
                {' '}{t('agency.processingTime')}
              </p>
              <button
                className="btn btn--primary btn--large"
                onClick={handlePayout}
                disabled={payoutLoading}
              >
                {payoutLoading ? t('agency.processing') : `${t('agency.requestPayout')} ($${balance.toFixed(2)})`}
              </button>
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-state__message">
                {t('agency.payoutMinBalance', { amount: balance.toFixed(2) })}
              </p>
            </div>
          )}
        </div>
      </section>

      {earnings?.transactions?.length > 0 && (
        <section className="surface-card">
          <header className="surface-card__header">
            <h2 className="surface-card__title">{t('agency.transactionHistory')}</h2>
          </header>
          <div className="collection-list">
            {earnings.transactions.map((tx) => (
              <article key={tx.id} className="transaction-item">
                <div className="transaction-item__main">
                  <div className="transaction-item__header">
                    <span className="transaction-item__date">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </span>
                    <span className={`badge badge--${tx.type === 'commission' ? 'success' : 'info'}`}>
                      {tx.type}
                    </span>
                  </div>
                  <p className="transaction-item__description">{tx.description}</p>
                </div>
                <div className="transaction-item__amounts">
                  <div className={`transaction-item__amount ${tx.amount_cents >= 0 ? 'transaction-item__amount--positive' : 'transaction-item__amount--negative'}`}>
                    {tx.amount_cents >= 0 ? '+' : ''}${(tx.amount_cents / 100).toFixed(2)}
                  </div>
                  <div className="transaction-item__balance">
                    {t('agency.balanceAfter')}: ${(tx.balance_after_cents / 100).toFixed(2)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
