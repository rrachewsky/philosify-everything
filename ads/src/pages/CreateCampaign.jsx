import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@services/api';

const PLACEMENTS = [
  { value: 'mixed', label: 'Balanced mix' },
  { value: 'sidebar', label: 'Sidebar interstitial' },
  { value: 'constellation', label: 'Constellation panel' },
];

const TARGETING_OPTIONS = {
  genres: ['Rock', 'Pop', 'Hip-Hop', 'Classical', 'Jazz', 'Electronic', 'R&B', 'Country', 'Latin', 'Metal', 'Folk', 'Blues', 'Indie', 'Punk', 'Reggae', 'Soul'],
  philosophies: ['Objectivism', 'Stoicism', 'Existentialism', 'Nihilism', 'Marxism', 'Utilitarianism', 'Virtue Ethics', 'Pragmatism', 'Rationalism', 'Empiricism'],
  languages: ['English', 'Portuguese', 'Spanish', 'French', 'German', 'Italian', 'Russian', 'Japanese', 'Korean', 'Chinese', 'Arabic', 'Hindi', 'Hebrew', 'Dutch', 'Polish', 'Turkish', 'Hungarian', 'Persian'],
  engagement: ['Casual', 'Regular', 'Power User'],
  countries: ['US', 'BR', 'GB', 'CA', 'DE', 'FR', 'AU', 'ES', 'IT', 'NL', 'JP', 'KR', 'IN', 'MX', 'AR', 'IL', 'PT', 'PL', 'TR', 'RU'],
  content: ['Music Analysis', 'Book Analysis', 'Cinema Analysis', 'Colloquium', 'News', 'Quiz'],
};

const DURATIONS = [
  { value: 'mixed', label: 'Best fit' },
  { value: 5, label: '5 seconds' },
  { value: 10, label: '10 seconds' },
  { value: 15, label: '15 seconds' },
  { value: 20, label: '20 seconds' },
];

function CreateCampaign() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    goal: 'balanced',
    budget: 250,
    placement_preference: 'mixed',
    duration_preference: 'mixed',
    target_url: '',
    creative_type: 'self',
    creative_brief: '',
    start_date: '',
    end_date: '',
    targeting: {
      genres: [],
      philosophies: [],
      languages: [],
      engagement: [],
      countries: [],
      content: [],
    },
  });
  const [creativeFile, setCreativeFile] = useState(null);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const summary = useMemo(() => {
    if (!generatedPlan?.plan) {
      return null;
    }

    return generatedPlan.plan;
  }, [generatedPlan]);

  const updateField = (name, value) => {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const toggleTargeting = (category, value) => {
    setForm((previous) => {
      const current = previous.targeting[category] || [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...previous, targeting: { ...previous.targeting, [category]: next } };
    });
  };

  const generatePlan = async () => {
    setError('');
    setLoadingPlan(true);

    try {
      // Filter out empty targeting arrays
      const targeting = {};
      for (const [key, values] of Object.entries(form.targeting)) {
        if (values.length > 0) targeting[key] = values;
      }

      const data = await api.post('/ads/planner/generate', {
        budget_cents: Math.round(Number(form.budget || 0) * 100),
        goal: form.goal,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        placement_preference: form.placement_preference,
        duration_preference:
          form.duration_preference === 'mixed' ? 'mixed' : Number(form.duration_preference),
        targeting: Object.keys(targeting).length > 0 ? targeting : undefined,
      });
      setGeneratedPlan(data);
      return data.plan;
    } catch (err) {
      setError(err.message || 'Could not generate a plan.');
      return null;
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    let plan = summary;
    if (!plan) {
      plan = await generatePlan();
    }

    if (!plan) {
      return;
    }

    if (form.creative_type === 'philosify' && !form.creative_brief.trim()) {
      setError('Please describe the creative you want Philosify to produce.');
      return;
    }

    setSubmitting(true);

    try {
      let creativeUrl = null;
      if (form.creative_type === 'self') {
        if (!creativeFile) {
          throw new Error('Upload a creative file before creating the campaign.');
        }

        const upload = await api.uploadFile('/ads/creatives/upload', creativeFile);
        creativeUrl = upload.url;
      }

      const created = await api.post('/ads/planner/create', {
        plan,
        name: form.name,
        target_url: form.target_url,
        creative_type: form.creative_type,
        creative_url: creativeUrl,
        creative_brief: form.creative_type === 'philosify' ? form.creative_brief : undefined,
      });

      navigate(`/app/campaigns/${created.plan.id}`);
    } catch (err) {
      setError(err.message || 'Could not create campaign.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="section-heading">
        <div>
          <p className="eyebrow">Campaign composer</p>
          <h2>Create a new campaign</h2>
          <p className="lead">
            All campaigns are subject to the <Link to="/policy">Advertising Policy</Link>. The
            advertiser and any agency remain fully responsible for all ads, claims, assets, and
            destination pages, even when Philosify assists with creative preparation.
          </p>
        </div>
        <Link to="/app/campaigns" className="btn btn--ghost">
          Back to campaigns
        </Link>
      </section>

      {error ? <div className="alert alert--error">{error}</div> : null}

      <form className="editorial-grid editorial-grid--compose" onSubmit={handleSubmit}>
        <section className="surface-card stack">
          <div className="field">
            <label htmlFor="campaign-name">Campaign name</label>
            <input
              id="campaign-name"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="Autumn atelier collection"
              required
            />
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="goal">Goal</label>
              <select id="goal" value={form.goal} onChange={(event) => updateField('goal', event.target.value)}>
                <option value="balanced">Balanced</option>
                <option value="reach">Reach</option>
                <option value="engagement">Engagement</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="budget">Budget in USD</label>
              <input
                id="budget"
                type="number"
                min="50"
                step="10"
                value={form.budget}
                onChange={(event) => updateField('budget', event.target.value)}
                required
              />
            </div>
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="placement">Placement preference</label>
              <select
                id="placement"
                value={form.placement_preference}
                onChange={(event) => updateField('placement_preference', event.target.value)}
              >
                {PLACEMENTS.map((placement) => (
                  <option key={placement.value} value={placement.value}>
                    {placement.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="duration">Duration preference</label>
              <select
                id="duration"
                value={form.duration_preference}
                onChange={(event) => updateField('duration_preference', event.target.value)}
              >
                {DURATIONS.map((duration) => (
                  <option key={duration.value} value={duration.value}>
                    {duration.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Audience Targeting */}
          <div className="targeting-section">
            <h3>Audience Targeting (optional)</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Leave empty to reach all users. Select options to narrow your audience.
            </p>

            {Object.entries(TARGETING_OPTIONS).map(([category, options]) => (
              <div key={category} className="targeting-group">
                <label>{category.charAt(0).toUpperCase() + category.slice(1)}</label>
                <div className="chip-group">
                  {options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`chip ${form.targeting[category]?.includes(option.toLowerCase()) ? 'selected' : ''}`}
                      onClick={() => toggleTargeting(category, option.toLowerCase())}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="field">
            <label htmlFor="target-url">Destination URL</label>
            <input
              id="target-url"
              type="url"
              value={form.target_url}
              onChange={(event) => updateField('target_url', event.target.value)}
              placeholder="https://brand.example.com"
              required
            />
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="start-date">Start date</label>
              <input
                id="start-date"
                type="date"
                value={form.start_date}
                onChange={(event) => updateField('start_date', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="end-date">End date</label>
              <input
                id="end-date"
                type="date"
                value={form.end_date}
                onChange={(event) => updateField('end_date', event.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label>Creative mode</label>
            <div className="choice-row">
              <button
                type="button"
                className={`choice-pill ${form.creative_type === 'self' ? 'choice-pill--active' : ''}`}
                onClick={() => updateField('creative_type', 'self')}
              >
                Upload my own creative
              </button>
              <button
                type="button"
                className={`choice-pill ${form.creative_type === 'philosify' ? 'choice-pill--active' : ''}`}
                onClick={() => updateField('creative_type', 'philosify')}
              >
                Philosify creates the mock
              </button>
            </div>
          </div>

          {form.creative_type === 'self' ? (
            <div className="field">
              <label htmlFor="creative-upload">Creative upload</label>
              <input
                id="creative-upload"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                onChange={(event) => setCreativeFile(event.target.files?.[0] || null)}
              />
              <p className="helper-text">Static image only in v1. Max 2MB.</p>
            </div>
          ) : (
            <div className="field">
              <label htmlFor="creative-brief">Creative brief</label>
              <textarea
                id="creative-brief"
                rows="6"
                value={form.creative_brief}
                onChange={(event) => updateField('creative_brief', event.target.value)}
                placeholder="Describe the style, message, product, and call to action."
              />
            </div>
          )}
        </section>

        <aside className="surface-card stack">
          <div>
            <p className="eyebrow">Plan preview</p>
            <h3>Estimate before creating</h3>
          </div>

          <button type="button" className="btn btn--secondary" onClick={generatePlan} disabled={loadingPlan}>
            {loadingPlan ? 'Generating plan...' : 'Generate plan'}
          </button>

          {summary ? (
            <>
              <div className="stat-panel stat-panel--inline">
                <span className="stat-panel__label">Estimated impressions</span>
                <strong className="stat-panel__value">{summary.totalImpressions.toLocaleString()}</strong>
              </div>
              <div className="stat-panel stat-panel--inline">
                <span className="stat-panel__label">Estimated clicks</span>
                <strong className="stat-panel__value">{summary.estimatedClicks.toLocaleString()}</strong>
              </div>
              <div className="stat-panel stat-panel--inline">
                <span className="stat-panel__label">Estimated total</span>
                <strong className="stat-panel__value">${(summary.totalCostCents / 100).toFixed(2)}</strong>
              </div>

              <div className="timeline-panel">
                <h4>Suggested placement mix</h4>
                <ul className="bullet-list">
                  {(summary.placements || []).map((placement) => (
                    <li key={`${placement.placement}-${placement.duration}`}>
                      {placement.placement} · {placement.duration}s · {placement.impressions.toLocaleString()} impressions
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="helper-text">
              Generate a plan to preview placement mix, delivery estimate, and cost before you create
              the campaign.
            </p>
          )}

          <button type="submit" className="btn btn--primary btn--large" disabled={submitting || loadingPlan}>
            {submitting ? 'Creating campaign...' : 'Create campaign'}
          </button>
        </aside>
      </form>
    </div>
  );
}

export default CreateCampaign;
