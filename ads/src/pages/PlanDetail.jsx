import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '@services/api';

function PlanDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [plan, setPlan] = useState(null);
  const [orders, setOrders] = useState([]);
  const [creativeRequest, setCreativeRequest] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [editingDates, setEditingDates] = useState(false);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editingUrl, setEditingUrl] = useState(false);
  const [editUrl, setEditUrl] = useState('');
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [uploading, setUploading] = useState(false);

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
        setError(err.message || t('detail.couldNotLoad'));
      } finally {
        setLoading(false);
      }
    };

    loadPlan();
  }, [id]);

  const stage = useMemo(() => {
    if (!plan) {
      return t('detail.stageDraft');
    }

    if (creativeRequest?.status === 'review') {
      return t('detail.stageReview');
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
      setError(err.message || t('detail.actionFailed'));
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
        setError(t('detail.invalidCheckout'));
        setActionLoading(false);
      }
    } catch (err) {
      setError(err.message || t('detail.couldNotCheckout'));
      setActionLoading(false);
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

  if (!plan) {
    return (
      <div className="status-shell">
        <div className="alert alert--error">{error || t('detail.notFound')}</div>
        <Link to="/app/campaigns" className="btn btn--secondary">
          {t('common.back')}
        </Link>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="section-heading">
        <div>
          <Link to="/app/campaigns" className="back-link">
            {t('common.back')}
          </Link>
          <h2>{plan.name}</h2>
          <p className="lead">{t('detail.stage')}: {stage}</p>
        </div>
        <div className="button-row">
          {plan.status === 'draft' ? (
            <button type="button" className="btn btn--primary" onClick={handleCheckout} disabled={actionLoading}>
              {actionLoading ? t('common.loading') : `${t('detail.pay')} $${(plan.total_cost_cents / 100).toFixed(2)}`}
            </button>
          ) : null}
        </div>
      </section>

      {paymentStatus === 'success' ? (
        <div className="alert alert--success">
          {t('detail.paymentReceived')}
        </div>
      ) : null}
      {paymentStatus === 'cancelled' ? (
        <div className="alert alert--warning">{t('detail.paymentCancelled')}</div>
      ) : null}
      {error ? <div className="alert alert--error">{error}</div> : null}

      <section className="stats-grid">
        <article className="stat-panel">
          <span className="stat-panel__label">{t('common.status')}</span>
          <strong className="stat-panel__value">{stage}</strong>
        </article>
        <article className="stat-panel">
          <span className="stat-panel__label">{t('detail.delivery')}</span>
          <strong className="stat-panel__value">{stats?.deliveryPercent || 0}%</strong>
        </article>
        <article className="stat-panel">
          <span className="stat-panel__label">{t('detail.impressions')}</span>
          <strong className="stat-panel__value">
            {stats?.totalDelivered?.toLocaleString() || 0} / {stats?.totalOrdered?.toLocaleString() || 0}
          </strong>
        </article>
        <article className="stat-panel">
          <span className="stat-panel__label">{t('detail.budget')}</span>
          <strong className="stat-panel__value">${(plan.budget_cents / 100).toFixed(2)}</strong>
        </article>
      </section>

      <section className="editorial-grid editorial-grid--detail">
        <article className="surface-card stack">
          <div>
            <p className="eyebrow">{t('detail.campaignDetails')}</p>
            <h3>{t('detail.briefAndSettings')}</h3>
          </div>
          <div className="detail-list">
            <div><span>{t('create.goal')}</span><strong>{plan.goal}</strong></div>
            <div><span>{t('create.creativeMode')}</span><strong>{plan.creative_type === 'self' ? t('campaigns.uploaded') : t('campaigns.philosifyMock')}</strong></div>
            <div>
              <span>{t('create.schedule')}</span>
              {editingDates ? (
                <div className="inline-edit" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
                  <input
                    type="date"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--text)' }}
                  />
                  <span>—</span>
                  <input
                    type="date"
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--text)' }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn--primary"
                    disabled={actionLoading || !editStart || !editEnd}
                    onClick={() => {
                      runAction(() => api.put(`/ads/plans/${id}`, { start_date: editStart, end_date: editEnd }));
                      setEditingDates(false);
                    }}
                  >
                    {t('common.save')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn--secondary"
                    onClick={() => setEditingDates(false)}
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              ) : (
                <strong>
                  {plan.start_date ? `${new Date(plan.start_date).toLocaleDateString()} - ${new Date(plan.end_date).toLocaleDateString()}` : t('campaigns.flexible')}
                  {['draft', 'pending_creative', 'pending_approval'].includes(plan.status) && (
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ marginLeft: '8px' }}
                      onClick={() => {
                        setEditStart(plan.start_date || '');
                        setEditEnd(plan.end_date || '');
                        setEditingDates(true);
                      }}
                    >
                      {t('common.edit')}
                    </button>
                  )}
                </strong>
              )}
            </div>
            <div>
              <span>{t('detail.destination')}</span>
              {editingUrl ? (
                <div className="inline-edit" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
                  <input
                    type="url"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    placeholder="https://example.com"
                    style={{ flex: 1, minWidth: '200px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--text)' }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn--primary"
                    disabled={actionLoading || !editUrl}
                    onClick={() => {
                      runAction(() => api.put(`/ads/plans/${id}`, { target_url: editUrl }));
                      setEditingUrl(false);
                    }}
                  >
                    {t('common.save')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn--secondary"
                    onClick={() => setEditingUrl(false)}
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              ) : (
                <strong>
                  {plan.target_url}
                  {['draft', 'pending_creative', 'pending_approval'].includes(plan.status) && (
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ marginLeft: '8px' }}
                      onClick={() => {
                        setEditUrl(plan.target_url || '');
                        setEditingUrl(true);
                      }}
                    >
                      {t('common.edit')}
                    </button>
                  )}
                </strong>
              )}
            </div>
          </div>
        </article>

        <article className="surface-card stack">
          <div>
            <p className="eyebrow">{t('detail.creativeDesk')}</p>
            <h3>{t('detail.reviewAndApprovals')}</h3>
          </div>
          {plan.creative_type === 'philosify' ? (
            <>
              <p className="helper-text">
                {t('detail.creativeStatus')}: {creativeRequest?.status || plan.creative_status || 'pending'}
              </p>
              {creativeRequest?.current_draft_url ? (
                <img src={creativeRequest.current_draft_url} alt={t('detail.currentDraft')} className="detail-preview" />
              ) : plan.creative_url ? (
                <img src={plan.creative_url} alt={t('detail.campaignCreative')} className="detail-preview" />
              ) : (
                <p className="helper-text">{t('detail.noDraft')}</p>
              )}

              {creativeRequest?.status === 'review' ? (
                <div className="stack stack--tight">
                  <div className="button-row" style={{ flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn--primary"
                      disabled={actionLoading}
                      onClick={() => runAction(() => api.post(`/ads/plans/${id}/creative/approve`))}
                    >
                      {t('detail.approveDraft')}
                    </button>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      disabled={actionLoading}
                      onClick={() => setShowRevisionForm(!showRevisionForm)}
                    >
                      {t('detail.requestRevision')}
                    </button>
                    <label
                      className="btn btn--secondary"
                      style={{ cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.6 : 1 }}
                    >
                      {uploading ? t('detail.uploadingOwn') : t('detail.uploadOwn')}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp"
                        style={{ display: 'none' }}
                        disabled={uploading || actionLoading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploading(true);
                          setError('');
                          try {
                            const uploadResult = await api.uploadFile('/ads/creatives/upload', file);
                            if (uploadResult?.url) {
                              await api.put(`/ads/plans/${id}`, { creative_url: uploadResult.url });
                              await api.post(`/ads/plans/${id}/creative/approve`);
                              const refreshed = await api.get(`/ads/plans/${id}`);
                              setPlan(refreshed.plan);
                              setOrders(refreshed.orders || []);
                              setCreativeRequest(refreshed.creativeRequest || null);
                              setStats(refreshed.stats || null);
                            }
                          } catch (err) {
                            setError(err.message || t('detail.uploadFailed'));
                          } finally {
                            setUploading(false);
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                  </div>
                  {showRevisionForm && (
                    <div className="stack stack--tight" style={{ marginTop: '12px' }}>
                      <textarea
                        value={revisionFeedback}
                        onChange={(e) => setRevisionFeedback(e.target.value)}
                        placeholder={t('detail.revisionPlaceholder')}
                        rows={3}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--text)', resize: 'vertical' }}
                      />
                      <button
                        type="button"
                        className="btn btn--secondary"
                        disabled={actionLoading || !revisionFeedback.trim()}
                        onClick={() => {
                          runAction(() =>
                            api.post(`/ads/plans/${id}/creative/revision`, {
                              feedback: revisionFeedback.trim(),
                            })
                          );
                          setShowRevisionForm(false);
                          setRevisionFeedback('');
                        }}
                      >
                        {t('detail.sendRevision')}
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </>
          ) : plan.creative_url ? (
            <img src={plan.creative_url} alt={t('detail.campaignCreative')} className="detail-preview" />
          ) : (
            <p className="helper-text">{t('detail.creativeAttached')}</p>
          )}
        </article>
      </section>

      <section className="surface-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('detail.placementPlan')}</p>
            <h3>{t('detail.ordersInside')}</h3>
          </div>
        </div>
        <div className="collection-list">
          {orders.map((order) => {
            const deliveryPct = order.impressions_ordered > 0
              ? Math.round((order.impressions_delivered / order.impressions_ordered) * 100)
              : 0;
            const cpmDisplay = order.cpm_cents ? `$${(order.cpm_cents / 100).toFixed(2)}` : '—';
            const subtotalDisplay = order.subtotal_cents ? `$${(order.subtotal_cents / 100).toFixed(2)}` : null;
            const creativeFeeDisplay = order.creative_fee_total_cents ? `$${(order.creative_fee_total_cents / 100).toFixed(2)}` : null;

            return (
            <div key={order.id} className="collection-row collection-row--stacked">
              <div className="collection-row__main" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ textTransform: 'capitalize' }}>{order.placement}</strong>
                  <span className={`status-chip status-chip--${order.status}`}>{order.status}</span>
                </div>

                {/* Delivery progress bar */}
                <div style={{ margin: '8px 0', background: 'var(--surface)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(deliveryPct, 100)}%`, height: '100%', background: deliveryPct >= 100 ? 'var(--success)' : 'var(--accent)', borderRadius: '4px', transition: 'width 0.3s ease' }} />
                </div>

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: '12px', color: 'var(--muted)' }}>
                  <span>{t('detail.impressions')}</span>
                  <span style={{ textAlign: 'right', color: 'var(--text)' }}>
                    {order.impressions_delivered?.toLocaleString() || 0} / {order.impressions_ordered?.toLocaleString() || 0} ({deliveryPct}%)
                  </span>

                  <span>{t('detail.duration')}</span>
                  <span style={{ textAlign: 'right', color: 'var(--text)' }}>{order.duration}s</span>

                  <span>CPM</span>
                  <span style={{ textAlign: 'right', color: 'var(--text)' }}>{cpmDisplay}</span>

                  {order.schedule_type === 'scheduled' && order.start_date && (
                    <>
                      <span>{t('create.schedule')}</span>
                      <span style={{ textAlign: 'right', color: 'var(--text)' }}>
                        {new Date(order.start_date).toLocaleDateString()} — {new Date(order.end_date).toLocaleDateString()}
                      </span>
                    </>
                  )}

                  {subtotalDisplay && (
                    <>
                      <span>{t('detail.subtotal')}</span>
                      <span style={{ textAlign: 'right', color: 'var(--text)' }}>{subtotalDisplay}</span>
                    </>
                  )}

                  {creativeFeeDisplay && (
                    <>
                      <span>{t('detail.creativeFee')}</span>
                      <span style={{ textAlign: 'right', color: 'var(--text)' }}>{creativeFeeDisplay}</span>
                    </>
                  )}

                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{t('create.totalCost')}</span>
                  <span style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text)' }}>${(order.total_cents / 100).toFixed(2)}</span>
                </div>

                {/* Targeting details */}
                {order.targeting && Object.keys(order.targeting).some((k) => {
                  const v = order.targeting[k];
                  return Array.isArray(v) ? v.length > 0 : !!v;
                }) && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--line)', fontSize: '12px', color: 'var(--muted)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '4px' }}>{t('create.targeting')}</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {order.targeting.genres?.length > 0 && (
                        <span style={{ background: 'var(--surface)', padding: '2px 8px', borderRadius: '10px' }}>
                          {t('create.targetingCategories.genres')}: {order.targeting.genres.join(', ')}
                        </span>
                      )}
                      {order.targeting.countries?.length > 0 && (
                        <span style={{ background: 'var(--surface)', padding: '2px 8px', borderRadius: '10px' }}>
                          {t('create.targetingCategories.countries')}: {order.targeting.countries.join(', ')}
                        </span>
                      )}
                      {order.targeting.languages?.length > 0 && (
                        <span style={{ background: 'var(--surface)', padding: '2px 8px', borderRadius: '10px' }}>
                          {t('create.targetingCategories.languages')}: {order.targeting.languages.join(', ')}
                        </span>
                      )}
                      {order.targeting.philosophies?.length > 0 && (
                        <span style={{ background: 'var(--surface)', padding: '2px 8px', borderRadius: '10px' }}>
                          {t('create.targetingCategories.philosophies')}: {order.targeting.philosophies.join(', ')}
                        </span>
                      )}
                      {order.targeting.engagement?.length > 0 && (
                        <span style={{ background: 'var(--surface)', padding: '2px 8px', borderRadius: '10px' }}>
                          {t('create.targetingCategories.engagement')}: {order.targeting.engagement.join(', ')}
                        </span>
                      )}
                      {order.targeting.content?.length > 0 && (
                        <span style={{ background: 'var(--surface)', padding: '2px 8px', borderRadius: '10px' }}>
                          {t('create.targetingCategories.content')}: {order.targeting.content.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="collection-row__actions" style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {order.status === 'active' && (
                  <button
                    className="btn btn-sm"
                    disabled={actionLoading}
                    onClick={() => runAction(() => api.post(`/ads/orders/${order.id}/pause`))}
                  >
                    {t('detail.pause')}
                  </button>
                )}
                {order.status === 'paused' && (
                  <button
                    className="btn btn-sm btn--primary"
                    disabled={actionLoading}
                    onClick={() => runAction(() => api.post(`/ads/orders/${order.id}/resume`))}
                  >
                    {t('detail.resume')}
                  </button>
                )}
                {['active', 'paused', 'pending_creative', 'pending_approval'].includes(order.status) && (
                  <button
                    className="btn btn-sm btn--danger"
                    disabled={actionLoading}
                    onClick={() => {
                      if (confirm(t('detail.cancelConfirm'))) {
                        runAction(() => api.post(`/ads/orders/${order.id}/cancel`));
                      }
                    }}
                  >
                    {t('detail.cancelOrder')}
                  </button>
                )}
                {['draft', 'pending_creative', 'pending_approval'].includes(order.status) && (
                  <button
                    className="btn btn-sm"
                    disabled={actionLoading}
                    onClick={() => {
                      const newUrl = prompt(t('detail.newDestPrompt'), order.target_url);
                      if (newUrl && newUrl !== order.target_url) {
                        runAction(() => api.put(`/ads/orders/${order.id}`, { target_url: newUrl }));
                      }
                    }}
                  >
                    {t('detail.editUrl')}
                  </button>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default PlanDetail;
