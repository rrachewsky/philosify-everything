import { useTranslation } from 'react-i18next';

export default function PendingAdvertisers({ advertisers, onApprove, onReject }) {
  const { t } = useTranslation();

  return (
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
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => onReject(advertiser.id)}
                >
                  {t('admin.reject')}
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => onApprove(advertiser.id)}
                >
                  {t('admin.approve')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
