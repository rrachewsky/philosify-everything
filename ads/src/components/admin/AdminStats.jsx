import { useTranslation } from 'react-i18next';

export default function AdminStats({ overview }) {
  const { t } = useTranslation();

  return (
    <section className="stats-grid stats-grid--prominent">
      <article className="stat-card stat-card--primary">
        <div className="stat-card__icon">⏳</div>
        <div>
          <span className="stat-card__label">{t('admin.pendingAdvertisers')}</span>
          <strong className="stat-card__value">{overview?.pendingAdvertisers || 0}</strong>
        </div>
      </article>
      <article className="stat-card">
        <div className="stat-card__icon">🎨</div>
        <div>
          <span className="stat-card__label">{t('admin.creativeInProgress')}</span>
          <strong className="stat-card__value">{overview?.creativeInProgress || 0}</strong>
        </div>
      </article>
      <article className="stat-card">
        <div className="stat-card__icon">👤</div>
        <div>
          <span className="stat-card__label">{t('admin.awaitingClient')}</span>
          <strong className="stat-card__value">{overview?.awaitingClientApproval || 0}</strong>
        </div>
      </article>
      <article className="stat-card">
        <div className="stat-card__icon">✅</div>
        <div>
          <span className="stat-card__label">{t('admin.awaitingAdmin')}</span>
          <strong className="stat-card__value">{overview?.awaitingAdminApproval || 0}</strong>
        </div>
      </article>
    </section>
  );
}
