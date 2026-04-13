import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '@contexts/AdminContext';
import { api } from '@services/api';

function AdminDashboard() {
  const { t } = useTranslation();
  const { adminSecret } = useAdmin();
  const [overview, setOverview] = useState(null);
  const [advertisers, setAdvertisers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [creativeRequests, setCreativeRequests] = useState([]);
  const [draftUrls, setDraftUrls] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [overviewData, pendingData, plansData, requestsData] = await Promise.all([
        api.adminGet('/ads/admin/overview', adminSecret),
        api.adminGet('/ads/admin/pending', adminSecret),
        api.adminGet('/ads/admin/plans', adminSecret),
        api.adminGet('/ads/admin/creative-requests', adminSecret),
      ]);

      setOverview(overviewData.counts || null);
      setAdvertisers(pendingData.advertisers || []);
      setPlans(plansData.plans || []);
      setCreativeRequests(requestsData.requests || []);
    } catch (err) {
      setError(err.message || t('admin.loadError'));
    } finally {
      setLoading(false);
    }
  }, [adminSecret]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const actionablePlans = useMemo(
    () => plans.filter((plan) => ['pending_approval', 'approved', 'active', 'draft', 'pending_creative'].includes(plan.status)),
    [plans]
  );

  const approveAdvertiser = async (advertiserId, approved) => {
    const endpoint = approved ? `/ads/admin/approve/${advertiserId}` : `/ads/admin/reject/${advertiserId}`;
    await api.adminPost(endpoint, adminSecret, {});
    await loadData();
  };

  const submitDraft = async (requestId) => {
    const draftUrl = draftUrls[requestId];
    if (!draftUrl) {
      return;
    }

    await api.adminPost(`/ads/admin/creative-requests/${requestId}/draft`, adminSecret, {
      draft_url: draftUrl,
    });
    await loadData();
  };

  const approvePlan = async (planId) => {
    await api.adminPost(`/ads/admin/plans/${planId}/approve`, adminSecret, {});
    await loadData();
  };

  const [generating, setGenerating] = useState({});
  const [rejectBrief, setRejectBrief] = useState({});
  const [showReject, setShowReject] = useState({});
  const generateCreative = async (planId) => {
    setGenerating((prev) => ({ ...prev, [planId]: true }));
    try {
      await api.adminPost(`/ads/admin/plans/${planId}/generate-creative`, adminSecret, {});
      await loadData();
    } catch (err) {
      setError(err.message || t('admin.generateFailed'));
    } finally {
      setGenerating((prev) => ({ ...prev, [planId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="status-shell">
        <div className="spinner" />
        <p>{t('admin.loading')}</p>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="hero-strip">
        <div>
          <p className="eyebrow">{t('admin.controlRoom')}</p>
          <h2>{t('admin.pipelineTitle')}</h2>
          <p className="lead">
            {t('admin.pipelineDesc')}
          </p>
        </div>
      </section>

      {error ? <div className="alert alert--error">{error}</div> : null}

      <section className="stats-grid">
        <article className="stat-panel">
          <span className="stat-panel__label">{t('admin.pendingAdvertisers')}</span>
          <strong className="stat-panel__value">{overview?.pendingAdvertisers || 0}</strong>
        </article>
        <article className="stat-panel">
          <span className="stat-panel__label">{t('admin.creativeInProgress')}</span>
          <strong className="stat-panel__value">{overview?.creativeInProgress || 0}</strong>
        </article>
        <article className="stat-panel">
          <span className="stat-panel__label">{t('admin.awaitingClient')}</span>
          <strong className="stat-panel__value">{overview?.awaitingClientApproval || 0}</strong>
        </article>
        <article className="stat-panel">
          <span className="stat-panel__label">{t('admin.awaitingAdmin')}</span>
          <strong className="stat-panel__value">{overview?.awaitingAdminApproval || 0}</strong>
        </article>
      </section>

      <section className="surface-card stack">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('admin.applications')}</p>
            <h3>{t('admin.pendingApproval')}</h3>
          </div>
        </div>

        {advertisers.length === 0 ? (
          <p className="helper-text">{t('admin.noApprovals')}</p>
        ) : (
          <div className="collection-list">
            {advertisers.map((advertiser) => (
              <div key={advertiser.id} className="collection-row collection-row--stacked">
                <div className="collection-row__main">
                  <strong>{advertiser.company_name}</strong>
                  <p>{advertiser.email} · {t('agency.score')} {advertiser.vetting_score ?? 'n/a'}</p>
                </div>
                <div className="button-row">
                  <button type="button" className="btn btn--secondary" onClick={() => approveAdvertiser(advertiser.id, false)}>
                    {t('admin.reject')}
                  </button>
                  <button type="button" className="btn btn--primary" onClick={() => approveAdvertiser(advertiser.id, true)}>
                    {t('admin.approve')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="surface-card stack">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('admin.creativeStudio')}</p>
            <h3>{t('admin.requestsWaiting')}</h3>
          </div>
        </div>

        {creativeRequests.length === 0 ? (
          <p className="helper-text">{t('admin.noCreativeRequests')}</p>
        ) : (
          <div className="collection-list">
            {creativeRequests.map((request) => (
              <div key={request.id} className="collection-row collection-row--stacked">
                <div className="collection-row__main">
                  <strong>{request.brand_name || request.advertiser?.company_name || t('admin.creativeRequest')}</strong>
                  <p>{request.status} · {request.placement} · {request.duration}s</p>
                  <p>{request.brief}</p>
                </div>
                <div className="stack stack--tight">
                  <input
                    type="url"
                    value={draftUrls[request.id] || ''}
                    onChange={(event) =>
                      setDraftUrls((previous) => ({ ...previous, [request.id]: event.target.value }))
                    }
                    placeholder="https://draft-url.example.com/mock.png"
                  />
                  <button type="button" className="btn btn--secondary" onClick={() => submitDraft(request.id)}>
                    {t('admin.sendDraft')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="surface-card stack">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('admin.launchQueue')}</p>
            <h3>{t('admin.plansMoving')}</h3>
          </div>
        </div>

        {actionablePlans.length === 0 ? (
          <p className="helper-text">{t('admin.noPlans')}</p>
        ) : (
          <div className="collection-list">
            {actionablePlans.map((plan) => (
              <div key={plan.id} className="collection-row collection-row--stacked">
                <div className="collection-row__main">
                  <strong>{plan.name}</strong>
                  <p>
                    {plan.advertiser?.company_name || t('admin.unknownAdvertiser')} · ${(plan.total_cost_cents / 100).toFixed(2)}
                  </p>
                  {plan.creative_url ? (
                    <div style={{ marginTop: '8px', position: 'relative', display: 'inline-block' }}>
                      {/\.(mp4|webm)$/i.test(plan.creative_url) ? (
                        <video
                          src={plan.creative_url}
                          controls
                          muted
                          style={{ maxWidth: '300px', maxHeight: '200px', borderRadius: '6px', border: '1px solid var(--line)' }}
                        />
                      ) : (
                        <img
                          src={plan.creative_url}
                          alt="Creative"
                          style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '6px', border: '1px solid var(--line)' }}
                        />
                      )}
                      <button
                        type="button"
                        style={{
                          position: 'absolute', top: '4px', right: '4px',
                          background: 'rgba(239,68,68,0.9)', color: '#fff',
                          border: 'none', borderRadius: '4px', padding: '2px 6px',
                          fontSize: '11px', cursor: 'pointer',
                        }}
                        title={t('common.delete')}
                        onClick={async () => {
                          if (!confirm(t('admin.confirmDeleteMedia'))) return;
                          const path = plan.creative_url.replace(/.*\/api\/ads\/media\//, '');
                          try {
                            await api.adminDelete(`/ads/admin/media/${path}`, adminSecret);
                            await loadData();
                          } catch (err) {
                            setError(err.message);
                          }
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : null}
                  {plan.creative_brief ? (
                    <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--muted)' }}>
                      <strong>{t('create.creativeBrief')}:</strong> {plan.creative_brief.slice(0, 150)}{plan.creative_brief.length > 150 ? '...' : ''}
                    </p>
                  ) : null}
                </div>
                <div className="button-row" style={{ flexWrap: 'wrap', gap: '6px' }}>
                  <span className={`status-chip status-chip--${plan.status}`}>{plan.status}</span>

                  {/* No creative yet — generate */}
                  {plan.status === 'pending_creative' && !plan.creative_url ? (
                    <button
                      type="button"
                      className="btn btn--secondary"
                      disabled={generating[plan.id]}
                      onClick={() => generateCreative(plan.id)}
                    >
                      {generating[plan.id] ? t('admin.generating') : t('admin.generateCreative')}
                    </button>
                  ) : null}

                  {/* Creative generated, admin reviews before sending to advertiser */}
                  {plan.status === 'pending_creative' && plan.creative_url ? (
                    <>
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={async () => {
                          await api.adminPost(`/ads/admin/plans/${plan.id}/approve-creative`, adminSecret, {});
                          await loadData();
                        }}
                      >
                        {t('admin.sendToAdvertiser')}
                      </button>
                      <button
                        type="button"
                        className="btn btn--secondary"
                        disabled={generating[plan.id]}
                        onClick={() => generateCreative(plan.id)}
                      >
                        {generating[plan.id] ? t('admin.generating') : t('admin.regenerate')}
                      </button>
                      <button
                        type="button"
                        className="btn btn--danger"
                        onClick={() => setShowReject((prev) => ({ ...prev, [plan.id]: !prev[plan.id] }))}
                      >
                        {t('admin.reject')}
                      </button>
                    </>
                  ) : null}

                  {/* Reject form — edit brief and clear creative */}
                  {showReject[plan.id] ? (
                    <div className="stack stack--tight" style={{ width: '100%', marginTop: '6px' }}>
                      <textarea
                        rows={3}
                        placeholder={t('admin.revisedBriefPlaceholder')}
                        value={rejectBrief[plan.id] || ''}
                        onChange={(e) => setRejectBrief((prev) => ({ ...prev, [plan.id]: e.target.value }))}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--text)' }}
                      />
                      <button
                        type="button"
                        className="btn btn--danger"
                        onClick={async () => {
                          await api.adminPost(`/ads/admin/plans/${plan.id}/reject-creative`, adminSecret, {
                            revised_brief: rejectBrief[plan.id] || undefined,
                          });
                          setShowReject((prev) => ({ ...prev, [plan.id]: false }));
                          setRejectBrief((prev) => ({ ...prev, [plan.id]: '' }));
                          await loadData();
                        }}
                      >
                        {t('admin.rejectAndClear')}
                      </button>
                    </div>
                  ) : null}

                  {/* Admin approves launch (after advertiser approved) */}
                  {plan.status === 'pending_approval' ? (
                    <button type="button" className="btn btn--primary" onClick={() => approvePlan(plan.id)}>
                      {t('admin.approveLaunch')}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminDashboard;
