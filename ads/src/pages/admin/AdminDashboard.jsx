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

  const [backfilling, setBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState(null);

  const runBackfill = async () => {
    setBackfilling(true);
    try {
      const result = await api.adminPost('/ads/admin/fix-billing', adminSecret, {});
      setBackfillResult(result);
    } catch (err) {
      setError(err.message || 'Backfill failed');
    } finally {
      setBackfilling(false);
    }
  };

  const [generating, setGenerating] = useState({});
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
      {backfillResult ? <div className="alert alert--success">Billing history synced: {backfillResult.results?.map((r) => `${r.plan}: ${r.status}`).join(', ')}</div> : null}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button
          type="button"
          className="btn btn--secondary"
          disabled={backfilling}
          onClick={runBackfill}
        >
          {backfilling ? 'Fixing...' : 'Fix billing'}
        </button>
      </div>

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
                    <div style={{ marginTop: '8px' }}>
                      <img
                        src={plan.creative_url}
                        alt="Creative"
                        style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '6px', border: '1px solid var(--line)' }}
                      />
                    </div>
                  ) : null}
                  {plan.creative_brief ? (
                    <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--muted)' }}>
                      <strong>{t('create.creativeBrief')}:</strong> {plan.creative_brief.slice(0, 150)}{plan.creative_brief.length > 150 ? '...' : ''}
                    </p>
                  ) : null}
                </div>
                <div className="button-row">
                  <span className={`status-chip status-chip--${plan.status}`}>{plan.status}</span>
                  {plan.status === 'pending_creative' ? (
                    <button
                      type="button"
                      className="btn btn--secondary"
                      disabled={generating[plan.id]}
                      onClick={() => generateCreative(plan.id)}
                    >
                      {generating[plan.id] ? t('admin.generating') : t('admin.generateCreative')}
                    </button>
                  ) : null}
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
