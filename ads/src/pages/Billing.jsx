import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { api } from '@services/api';

const FUNDING_OPTIONS = [
  { amount: 50, label: '$50' },
  { amount: 100, label: '$100' },
  { amount: 250, label: '$250' },
  { amount: 500, label: '$500' },
  { amount: 1000, label: '$1,000' },
];

function Billing() {
  const { t } = useTranslation();
  const { advertiser } = useAuth();
  const [searchParams] = useSearchParams();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      const [balanceData, transactionsData] = await Promise.all([
        api.get('/ads/billing/balance'),
        api.get('/ads/billing/transactions'),
      ]);
      setBalance(balanceData.balance_cents || 0);
      const sorted = (transactionsData.transactions || []).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setTransactions(sorted);
    } catch (err) {
      console.error('Failed to load billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async () => {
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount;
    
    if (!amount || amount < 10) {
      setError(t('billing.minAmount'));
      return;
    }
    if (amount > 10000) {
      setError(t('billing.maxAmount'));
      return;
    }

    setError('');
    setProcessing(true);

    try {
      // Create Stripe checkout session
      const { checkout_url } = await api.post('/ads/billing/checkout', {
        amount_cents: Math.round(amount * 100),
      });

      // Redirect to Stripe
      window.location.href = checkout_url;
    } catch (err) {
      setError(err.message || t('billing.paymentFailed'));
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case 'deposit':
        return t('billing.deposit');
      case 'campaign_spend':
        return t('billing.spend');
      case 'refund':
        return t('billing.refund');
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="status-shell">
        <div className="spinner" />
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="section-heading">
        <div>
          <p className="eyebrow">{t('billing.title')}</p>
          <h2>{t('billing.title')}</h2>
        </div>
      </section>

      {searchParams.get('success') ? (
        <div className="alert alert--success">{t('billing.fundingCompleted')}</div>
      ) : null}
      {searchParams.get('canceled') ? (
        <div className="alert alert--warning">{t('billing.checkoutCancelled')}</div>
      ) : null}
      {error ? <div className="alert alert--error">{error}</div> : null}

      <div className="editorial-grid editorial-grid--billing">
        <section className="surface-card stack">
          <div className="stat-panel stat-panel--hero">
            <span className="stat-panel__label">{t('billing.currentBalance')}</span>
            <strong className="stat-panel__value">${(balance / 100).toFixed(2)}</strong>
          </div>

          <div className="choice-row choice-row--wrap">
            {FUNDING_OPTIONS.map((option) => (
              <button
                key={option.amount}
                type="button"
                className={`choice-pill ${selectedAmount === option.amount && !customAmount ? 'choice-pill--active' : ''}`}
                onClick={() => {
                  setSelectedAmount(option.amount);
                  setCustomAmount('');
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="field">
            <label htmlFor="custom-amount">{t('billing.customAmount')}</label>
            <input
              id="custom-amount"
              type="number"
              min="10"
              max="10000"
              step="1"
              value={customAmount}
              onChange={(event) => {
                setCustomAmount(event.target.value);
                setSelectedAmount(0);
              }}
              placeholder="250"
            />
          </div>

          <button type="button" className="btn btn--primary btn--large" onClick={handleAddFunds} disabled={processing}>
            {processing ? t('billing.addingFunds') : `${t('billing.addFunds')} $${customAmount || selectedAmount}`}
          </button>

          <p className="helper-text">
            {t('billing.stripeNote')}
          </p>
        </section>

        <section className="surface-card stack">
          <div>
            <p className="eyebrow">{t('billing.billingIdentity')}</p>
            <h3>{t('billing.accountDetails')}</h3>
          </div>
          <div className="detail-list">
            <div><span>{t('billing.emailLabel')}</span><strong>{advertiser?.email}</strong></div>
            <div><span>{t('billing.companyLabel')}</span><strong>{advertiser?.company_name || t('common.notSet')}</strong></div>
          </div>

          <div>
            <p className="eyebrow">{t('billing.faqTitle')}</p>
            <ul className="bullet-list">
              <li>{t('billing.faqFunds')}</li>
              <li>{t('billing.faqBalance')}</li>
              <li>{t('billing.faqRefund')}</li>
            </ul>
          </div>
        </section>
      </div>

      <section className="surface-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('billing.transactionHistory')}</p>
            <h3>{t('billing.transactionHistory')}</h3>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="empty-state">
            <h4>{t('billing.noTransactions')}</h4>
          </div>
        ) : (
          <div className="collection-list">
            {transactions.map((tx) => (
              <div key={tx.id} className="collection-row collection-row--stacked">
                <div className="collection-row__main">
                  <strong>{getTransactionTypeLabel(tx.type)}</strong>
                  <p>{formatDate(tx.created_at)} · {tx.description || t('billing.ledgerEntry')}</p>
                </div>
                <div className="collection-row__meta">
                  <span className={tx.amount_cents >= 0 ? 'amount-positive' : 'amount-negative'}>
                    {tx.amount_cents >= 0 ? '+' : ''}${(tx.amount_cents / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Billing;
