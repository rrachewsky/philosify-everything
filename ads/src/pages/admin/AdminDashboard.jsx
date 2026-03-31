import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdmin } from '@contexts/AdminContext';
import { api } from '@services/api';

function AdminDashboard() {
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
      setError(err.message || 'Could not load the admin dashboard.');
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

  if (loading) {
    return (
      <div className="status-shell">
        <div className="spinner" />
        <p>Loading the control room...</p>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="hero-strip">
        <div>
          <p className="eyebrow">Admin control room</p>
          <h2>Follow the full atelier pipeline</h2>
          <p className="lead">
            Review new advertisers, ship creative drafts, and release approved campaigns into the
            live environment.
          </p>
        </div>
      </section>

      {error ? <div className="alert alert--error">{error}</div> : null}

      <section className="stats-grid">
        <article className="stat-panel">
          <span className="stat-panel__label">Pending advertisers</span>
          <strong className="stat-panel__value">{overview?.pendingAdvertisers || 0}</strong>
        </article>
        <article className="stat-panel">
          <span className="stat-panel__label">Creative in progress</span>
          <strong className="stat-panel__value">{overview?.creativeInProgress || 0}</strong>
        </article>
        <article className="stat-panel">
          <span className="stat-panel__label">Awaiting client approval</span>
          <strong className="stat-panel__value">{overview?.awaitingClientApproval || 0}</strong>
        </article>
        <article className="stat-panel">
          <span className="stat-panel__label">Awaiting admin approval</span>
          <strong className="stat-panel__value">{overview?.awaitingAdminApproval || 0}</strong>
        </article>
      </section>

      <section className="surface-card stack">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Advertiser applications</p>
            <h3>Pending approval</h3>
          </div>
        </div>

        {advertisers.length === 0 ? (
          <p className="helper-text">No advertiser approvals are waiting.</p>
        ) : (
          <div className="collection-list">
            {advertisers.map((advertiser) => (
              <div key={advertiser.id} className="collection-row collection-row--stacked">
                <div className="collection-row__main">
                  <strong>{advertiser.company_name}</strong>
                  <p>{advertiser.email} · score {advertiser.vetting_score ?? 'n/a'}</p>
                </div>
                <div className="button-row">
                  <button type="button" className="btn btn--secondary" onClick={() => approveAdvertiser(advertiser.id, false)}>
                    Reject
                  </button>
                  <button type="button" className="btn btn--primary" onClick={() => approveAdvertiser(advertiser.id, true)}>
                    Approve
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
            <p className="eyebrow">Creative studio</p>
            <h3>Requests waiting for a draft</h3>
          </div>
        </div>

        {creativeRequests.length === 0 ? (
          <p className="helper-text">No creative requests are active.</p>
        ) : (
          <div className="collection-list">
            {creativeRequests.map((request) => (
              <div key={request.id} className="collection-row collection-row--stacked">
                <div className="collection-row__main">
                  <strong>{request.brand_name || request.advertiser?.company_name || 'Creative request'}</strong>
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
                    Send draft to advertiser
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
            <p className="eyebrow">Launch queue</p>
            <h3>Plans moving toward release</h3>
          </div>
        </div>

        {actionablePlans.length === 0 ? (
          <p className="helper-text">No plans are currently in the launch queue.</p>
        ) : (
          <div className="collection-list">
            {actionablePlans.map((plan) => (
              <div key={plan.id} className="collection-row collection-row--stacked">
                <div className="collection-row__main">
                  <strong>{plan.name}</strong>
                  <p>
                    {plan.advertiser?.company_name || 'Unknown advertiser'} · ${(plan.total_cost_cents / 100).toFixed(2)}
                  </p>
                </div>
                <div className="button-row">
                  <span className={`status-chip status-chip--${plan.status}`}>{plan.status}</span>
                  {plan.status === 'pending_approval' ? (
                    <button type="button" className="btn btn--primary" onClick={() => approvePlan(plan.id)}>
                      Approve launch
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
