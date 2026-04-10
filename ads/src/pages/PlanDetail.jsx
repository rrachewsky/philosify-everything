import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '@services/api';

function PlanDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [plan, setPlan] = useState(null);
  const [orders, setOrders] = useState([]);
  const [creativeRequest, setCreativeRequest] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const paymentStatus = searchParams.get('payment');

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const data = await api.get(`/ads/plans/${id}`);
        setPlan(data.plan);
        setOrders(data.orders || []);
        setCreativeRequest(data.creativeRequest || null);
        setStats(data.stats || null);
      } catch (err) {
        setError(err.message || 'Could not load campaign.');
      } finally {
        setLoading(false);
      }
    };

    loadPlan();
  }, [id]);

  const stage = useMemo(() => {
    if (!plan) {
      return 'Draft';
    }

    if (creativeRequest?.status === 'review') {
      return 'Awaiting your review';
    }

    return plan.status.replaceAll('_', ' ');
  }, [plan, creativeRequest]);

  const runAction = async (callback) => {
    setActionLoading(true);
    setError('');
    try {
      await callback();
      const refreshed = await api.get(`/ads/plans/${id}`);
      setPlan(refreshed.plan);
      setOrders(refreshed.orders || []);
      setCreativeRequest(refreshed.creativeRequest || null);
      setStats(refreshed.stats || null);
    } catch (err) {
      setError(err.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckout = async () => {
    setActionLoading(true);
    try {
      const data = await api.post(`/ads/plans/${id}/checkout`);
      // SECURITY: Validate checkout URL to prevent open redirect
      if (data.checkoutUrl && data.checkoutUrl.startsWith('https://checkout.stripe.com/')) {
        window.location.href = data.checkoutUrl;
      } else {
        setError('Invalid checkout URL received');
        setActionLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Could not create checkout.');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="status-shell">
        <div className="spinner" />
        <p>Loading campaign...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="status-shell">
        <div className="alert alert--error">{error || 'Campaign not found.'}</div>
        <Link to="/app/campaigns" className="btn btn--secondary">
          Back to campaigns
        </Link>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="section-heading">
        <div>
          <Link to="/app/campaigns" className="back-link">
            Back to campaigns
          </Link>
          <h2>{plan.name}</h2>
          <p className="lead">Stage: {stage}</p>
        </div>
        <div className="button-row">
          {plan.status === 'draft' ? (
            <button type="button" className="btn btn--primary" onClick={handleCheckout} disabled={actionLoading}>
              {actionLoading ? 'Preparing payment...' : `Pay $${(plan.total_cost_cents / 100).toFixed(2)}`}
            </button>
          ) : null}
        </div>
      </section>

      {paymentStatus === 'success' ? (
        <div className="alert alert--success">
          Payment received. Your campaign is now moving through the creative and approval pipeline.
        </div>
      ) : null}
      {paymentStatus === 'cancelled' ? (
        <div className="alert alert--warning">Payment was cancelled. You can resume when ready.</div>
      ) : null}
      {error ? <div className="alert alert--error">{error}</div> : null}

      <section className="stats-grid">
        <article className="stat-panel">
          <span className="stat-panel__label">Status</span>
          <strong className="stat-panel__value">{stage}</strong>
        </article>
        <article className="stat-panel">
          <span className="stat-panel__label">Delivery</span>
          <strong className="stat-panel__value">{stats?.deliveryPercent || 0}%</strong>
        </article>
        <article className="stat-panel">
          <span className="stat-panel__label">Impressions</span>
          <strong className="stat-panel__value">
            {stats?.totalDelivered?.toLocaleString() || 0} / {stats?.totalOrdered?.toLocaleString() || 0}
          </strong>
        </article>
        <article className="stat-panel">
          <span className="stat-panel__label">Budget</span>
          <strong className="stat-panel__value">${(plan.budget_cents / 100).toFixed(2)}</strong>
        </article>
      </section>

      <section className="editorial-grid editorial-grid--detail">
        <article className="surface-card stack">
          <div>
            <p className="eyebrow">Campaign details</p>
            <h3>Brief and launch settings</h3>
          </div>
          <div className="detail-list">
            <div><span>Goal</span><strong>{plan.goal}</strong></div>
            <div><span>Creative mode</span><strong>{plan.creative_type === 'self' ? 'Uploaded creative' : 'Philosify mock'}</strong></div>
            <div><span>Schedule</span><strong>{plan.start_date ? `${new Date(plan.start_date).toLocaleDateString()} - ${new Date(plan.end_date).toLocaleDateString()}` : 'Flexible'}</strong></div>
            <div><span>Destination</span><strong>{plan.target_url}</strong></div>
          </div>
        </article>

        <article className="surface-card stack">
          <div>
            <p className="eyebrow">Creative desk</p>
            <h3>Review and approvals</h3>
          </div>
          {plan.creative_type === 'philosify' ? (
            <>
              <p className="helper-text">
                Current creative status: {creativeRequest?.status || plan.creative_status || 'pending'}
              </p>
              {creativeRequest?.current_draft_url ? (
                <img src={creativeRequest.current_draft_url} alt="Current creative draft" className="detail-preview" />
              ) : plan.creative_url ? (
                <img src={plan.creative_url} alt="Campaign creative" className="detail-preview" />
              ) : (
                <p className="helper-text">No draft has been delivered yet.</p>
              )}

              {creativeRequest?.status === 'review' ? (
                <div className="button-row">
                  <button
                    type="button"
                    className="btn btn--primary"
                    disabled={actionLoading}
                    onClick={() => runAction(() => api.post(`/ads/plans/${id}/creative/approve`))}
                  >
                    Approve draft
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    disabled={actionLoading}
                    onClick={() =>
                      runAction(() =>
                        api.post(`/ads/plans/${id}/creative/revision`, {
                          feedback: 'Please refine the concept and return a new version.',
                        })
                      )
                    }
                  >
                    Request revision
                  </button>
                </div>
              ) : null}
            </>
          ) : plan.creative_url ? (
            <img src={plan.creative_url} alt="Campaign creative" className="detail-preview" />
          ) : (
            <p className="helper-text">Creative upload is attached to this campaign.</p>
          )}
        </article>
      </section>

      <section className="surface-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Placement plan</p>
            <h3>Orders inside this campaign</h3>
          </div>
        </div>
        <div className="collection-list">
          {orders.map((order) => (
            <div key={order.id} className="collection-row collection-row--stacked">
              <div className="collection-row__main">
                <strong>{order.placement}</strong>
                <p>
                  {order.duration}s · {order.impressions_delivered?.toLocaleString() || 0} /{' '}
                  {order.impressions_ordered?.toLocaleString() || 0} impressions
                </p>
              </div>
              <div className="collection-row__meta">
                <span>${(order.total_cents / 100).toFixed(2)}</span>
                <span className={`status-chip status-chip--${order.status}`}>{order.status}</span>
              </div>
              <div className="collection-row__actions" style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {order.status === 'active' && (
                  <button
                    className="btn btn-sm"
                    disabled={actionLoading}
                    onClick={() => runAction(() => api.post(`/ads/orders/${order.id}/pause`))}
                  >
                    Pause
                  </button>
                )}
                {order.status === 'paused' && (
                  <button
                    className="btn btn-sm btn--primary"
                    disabled={actionLoading}
                    onClick={() => runAction(() => api.post(`/ads/orders/${order.id}/resume`))}
                  >
                    Resume
                  </button>
                )}
                {['active', 'paused', 'pending_creative', 'pending_approval'].includes(order.status) && (
                  <button
                    className="btn btn-sm btn--danger"
                    disabled={actionLoading}
                    onClick={() => {
                      if (confirm('Cancel this order? Undelivered impressions will be refunded.')) {
                        runAction(() => api.post(`/ads/orders/${order.id}/cancel`));
                      }
                    }}
                  >
                    Cancel
                  </button>
                )}
                {['draft', 'pending_creative', 'pending_approval'].includes(order.status) && (
                  <button
                    className="btn btn-sm"
                    disabled={actionLoading}
                    onClick={() => {
                      const newUrl = prompt('New destination URL:', order.target_url);
                      if (newUrl && newUrl !== order.target_url) {
                        runAction(() => api.put(`/ads/orders/${order.id}`, { target_url: newUrl }));
                      }
                    }}
                  >
                    Edit URL
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default PlanDetail;
