import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@services/api';

const PLACEMENTS = [
  { value: 'mixed', labelKey: 'create.placementMixed' },
  { value: 'sidebar', labelKey: 'create.placementSidebar' },
  { value: 'constellation', labelKey: 'create.placementConstellation' },
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
  { value: 'mixed', labelKey: 'create.durationBestFit' },
  { value: 5, label: '5s' },
  { value: 10, label: '10s' },
  { value: 15, label: '15s' },
  { value: 20, label: '20s' },
];

function CreateCampaign() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    goal: 'balanced',
    budget: 250,
    placement_preference: 'mixed',
    duration_preference: 'mixed',
    target_url: '',
    creative_type: 'self',
    media_format: 'image',
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
  const [showAdvancedTargeting, setShowAdvancedTargeting] = useState(false);

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
      setError(err.message || t('create.couldNotGenerate'));
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
      setError(t('create.briefRequired'));
      return;
    }

    setSubmitting(true);

    try {
      let creativeUrl = null;
      if (form.creative_type === 'self') {
        if (!creativeFile) {
          throw new Error(t('create.uploadRequired'));
        }

        const upload = await api.uploadFile('/ads/creatives/upload', creativeFile);
        creativeUrl = upload.url;
      }

      const created = await api.post('/ads/planner/create', {
        plan,
        name: form.name,
        target_url: form.target_url,
        creative_type: form.creative_type,
        media_format: form.media_format,
        creative_url: creativeUrl,
        creative_brief: form.creative_type === 'philosify' ? form.creative_brief : undefined,
      });

      navigate(`/app/campaigns/${created.plan.id}`);
    } catch (err) {
      setError(err.message || t('create.couldNotCreateCampaign'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="section-heading">
        <div>
          <p className="eyebrow">{t('create.title')}</p>
          <h2>{t('create.title')}</h2>
          <p className="lead">
            {t('create.policyNotice')} <Link to="/policy">{t('create.policyLink')}</Link>. {t('create.policyResponsibility')}
          </p>
        </div>
        <Link to="/app/campaigns" className="btn btn--ghost">
          {t('common.back')}
        </Link>
      </section>

      {error ? <div className="alert alert--error">{error}</div> : null}

      {/* Step Progress */}
      <div className="wizard-steps">
        <button
          type="button"
          className={`wizard-step ${currentStep >= 1 ? 'wizard-step--active' : ''} ${currentStep > 1 ? 'wizard-step--complete' : ''}`}
          onClick={() => setCurrentStep(1)}
        >
          <span className="wizard-step__number">1</span>
          <span className="wizard-step__label">{t('create.step1')}</span>
        </button>
        <button
          type="button"
          className={`wizard-step ${currentStep >= 2 ? 'wizard-step--active' : ''} ${currentStep > 2 ? 'wizard-step--complete' : ''}`}
          onClick={() => currentStep > 1 && setCurrentStep(2)}
          disabled={currentStep < 2}
        >
          <span className="wizard-step__number">2</span>
          <span className="wizard-step__label">{t('create.step2')}</span>
        </button>
        <button
          type="button"
          className={`wizard-step ${currentStep >= 3 ? 'wizard-step--active' : ''} ${currentStep > 3 ? 'wizard-step--complete' : ''}`}
          onClick={() => currentStep > 2 && setCurrentStep(3)}
          disabled={currentStep < 3}
        >
          <span className="wizard-step__number">3</span>
          <span className="wizard-step__label">{t('create.step3')}</span>
        </button>
      </div>

      <form className="editorial-grid editorial-grid--compose" onSubmit={handleSubmit}>
        {currentStep === 1 && (
        <section className="surface-card stack">
          <div className="field">
            <label htmlFor="campaign-name">{t('create.campaignName')}</label>
            <input
              id="campaign-name"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder={t('create.campaignNamePlaceholder')}
              required
            />
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="goal">{t('create.goal')}</label>
              <select id="goal" value={form.goal} onChange={(event) => updateField('goal', event.target.value)}>
                <option value="balanced">{t('create.goalBalanced')}</option>
                <option value="reach">{t('create.goalReach')}</option>
                <option value="engagement">{t('create.goalEngagement')}</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="budget">{t('create.budget')}</label>
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
              <label htmlFor="placement">{t('create.placementPref')}</label>
              <select
                id="placement"
                value={form.placement_preference}
                onChange={(event) => updateField('placement_preference', event.target.value)}
              >
                {PLACEMENTS.map((placement) => (
                  <option key={placement.value} value={placement.value}>
                    {t(placement.labelKey)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="duration">{t('create.durationPref')}</label>
              <select
                id="duration"
                value={form.duration_preference}
                onChange={(event) => updateField('duration_preference', event.target.value)}
              >
                {DURATIONS.map((duration) => (
                  <option key={duration.value} value={duration.value}>
                    {duration.labelKey ? t(duration.labelKey) : duration.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="wizard-nav">
            <button type="button" className="btn btn--primary" onClick={() => setCurrentStep(2)}>
              {t('common.next')}
            </button>
          </div>
        </section>
        )}

        {currentStep === 2 && (
        <section className="surface-card stack">
          {/* Audience Targeting */}
          <div className="targeting-section">
            <h3>{t('create.targeting')}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              {t('create.targetingOptional')}
            </p>

            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setShowAdvancedTargeting(!showAdvancedTargeting)}
            >
              {showAdvancedTargeting ? t('create.hideAdvanced') : t('create.showAdvanced')}
            </button>

            {showAdvancedTargeting && Object.entries(TARGETING_OPTIONS).map(([category, options]) => (
              <div key={category} className="targeting-group">
                <label>{t(`create.targetingCategories.${category}`)}</label>
                <div className="chip-group">
                  {options.slice(0, 8).map((option) => (
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
            <label htmlFor="target-url">{t('create.destinationUrl')}</label>
            <input
              id="target-url"
              type="url"
              value={form.target_url}
              onChange={(event) => updateField('target_url', event.target.value)}
              placeholder={t('create.destinationPlaceholder')}
              required
            />
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="start-date">{t('create.startDate')}</label>
              <input
                id="start-date"
                type="date"
                value={form.start_date}
                onChange={(event) => updateField('start_date', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="end-date">{t('create.endDate')}</label>
              <input
                id="end-date"
                type="date"
                value={form.end_date}
                onChange={(event) => updateField('end_date', event.target.value)}
              />
            </div>
          </div>

          <div className="wizard-nav">
            <button type="button" className="btn btn--ghost" onClick={() => setCurrentStep(1)}>
              {t('common.back')}
            </button>
            <button type="button" className="btn btn--primary" onClick={() => setCurrentStep(3)}>
              {t('common.next')}
            </button>
          </div>
        </section>
        )}

        {currentStep === 3 && (
        <section className="surface-card stack">
          <div className="field">
            <label>{t('create.mediaFormat')}</label>
            <div className="choice-row">
              <button
                type="button"
                className={`choice-pill ${form.media_format === 'image' ? 'choice-pill--active' : ''}`}
                onClick={() => updateField('media_format', 'image')}
              >
                {t('create.image')}
              </button>
              <button
                type="button"
                className={`choice-pill ${form.media_format === 'video' ? 'choice-pill--active' : ''}`}
                onClick={() => updateField('media_format', 'video')}
              >
                {t('create.video')}
              </button>
            </div>
          </div>

          <div className="field">
            <label>{t('create.creativeMode')}</label>
            <div className="choice-row">
              <button
                type="button"
                className={`choice-pill ${form.creative_type === 'self' ? 'choice-pill--active' : ''}`}
                onClick={() => updateField('creative_type', 'self')}
              >
                {t('create.uploadOwn')}
              </button>
              <button
                type="button"
                className={`choice-pill ${form.creative_type === 'philosify' ? 'choice-pill--active' : ''}`}
                onClick={() => updateField('creative_type', 'philosify')}
              >
                {t('create.philosifyCreates')}
              </button>
            </div>
          </div>

          {form.creative_type === 'self' ? (
            <div className="field">
              <label htmlFor="creative-upload">{t('create.uploadFile')}</label>
              <input
                id="creative-upload"
                type="file"
                accept={form.media_format === 'video'
                  ? 'video/mp4,video/webm'
                  : 'image/png,image/jpeg,image/jpg,image/gif,image/webp'}
                onChange={(event) => setCreativeFile(event.target.files?.[0] || null)}
              />
              <p className="helper-text">
                {form.media_format === 'video'
                  ? t('create.videoNote')
                  : t('create.staticImageNote')}
              </p>
            </div>
          ) : (
            <div className="field">
              <label htmlFor="creative-brief">{t('create.creativeBrief')}</label>
              <textarea
                id="creative-brief"
                rows="6"
                value={form.creative_brief}
                onChange={(event) => updateField('creative_brief', event.target.value)}
                placeholder={t('create.creativeBriefPlaceholder')}
              />
            </div>
          )}

          <div className="wizard-nav">
            <button type="button" className="btn btn--ghost" onClick={() => setCurrentStep(2)}>
              {t('common.back')}
            </button>
          </div>
        </section>
        )}

        <aside className="surface-card stack">
          <div>
            <p className="eyebrow">{t('create.planSummary')}</p>
            <h3>{t('create.planSummary')}</h3>
          </div>

          <button type="button" className="btn btn--secondary" onClick={generatePlan} disabled={loadingPlan}>
            {loadingPlan ? t('create.generatingPlan') : t('create.generatePlan')}
          </button>

          {summary ? (
            <>
              <div className="stat-panel stat-panel--inline">
                <span className="stat-panel__label">{t('create.impressions')}</span>
                <strong className="stat-panel__value">{summary.totalImpressions.toLocaleString()}</strong>
              </div>
              <div className="stat-panel stat-panel--inline">
                <span className="stat-panel__label">{t('create.estimatedClicks')}</span>
                <strong className="stat-panel__value">{summary.estimatedClicks.toLocaleString()}</strong>
              </div>
              <div className="stat-panel stat-panel--inline">
                <span className="stat-panel__label">{t('create.totalCost')}</span>
                <strong className="stat-panel__value">${(summary.totalCostCents / 100).toFixed(2)}</strong>
              </div>

              <div className="timeline-panel">
                <h4>{t('create.suggestedMix')}</h4>
                <ul className="bullet-list">
                  {(summary.placements || []).map((placement) => (
                    <li key={`${placement.placement}-${placement.duration}`}>
                      {placement.placement} · {placement.duration}s · {placement.impressions.toLocaleString()} {t('common.impressions')}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="helper-text">
              {t('create.generateNote')}
            </p>
          )}

          <button type="submit" className="btn btn--primary btn--large" disabled={submitting || loadingPlan}>
            {submitting ? t('create.creating') : t('create.createCampaign')}
          </button>
        </aside>
      </form>
    </div>
  );
}

export default CreateCampaign;
