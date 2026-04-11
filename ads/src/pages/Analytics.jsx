import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@services/api';

const PERIODS = [
  { value: '7d', labelKey: 'analytics.last7' },
  { value: '14d', labelKey: 'analytics.last14' },
  { value: '30d', labelKey: 'analytics.last30' },
];

export default function Analytics() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('7d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, [period]);

  async function loadData() {
    setLoading(true);
    try {
      const result = await api.get(`/ads/analytics/overview?period=${period}`);
      setData(result);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://api.philosify.org'}/api/ads/analytics/export?period=${period}&format=csv`,
        { credentials: 'include' }
      );
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `philosify-ads-${period}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  }

  const overview = data?.overview || {};
  const daily = data?.daily || [];
  const orders = data?.orders || [];

  // Find max values for chart scaling
  const maxImpressions = Math.max(1, ...daily.map((d) => d.impressions));

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>{t('analytics.title')}</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div className="period-selector">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                className={`btn btn-sm ${period === p.value ? 'btn-primary' : ''}`}
                onClick={() => setPeriod(p.value)}
              >
                {t(p.labelKey)}
              </button>
            ))}
          </div>
          <button className="btn btn-sm" onClick={handleExport} disabled={exporting}>
            {exporting ? t('analytics.exporting') : t('analytics.exportCsv')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">{t('analytics.impressions')}</div>
              <div className="stat-value">{overview.total_impressions?.toLocaleString() || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">{t('analytics.clicks')}</div>
              <div className="stat-value">{overview.total_clicks?.toLocaleString() || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">{t('analytics.ctr')}</div>
              <div className="stat-value">{overview.ctr || 0}%</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">{t('analytics.spent')}</div>
              <div className="stat-value">${((overview.total_spent_cents || 0) / 100).toFixed(2)}</div>
            </div>
          </div>

          {/* Daily Chart (CSS bar chart) */}
          {daily.length > 0 && (
            <div className="section" style={{ marginTop: '2rem' }}>
              <h2>{t('analytics.dailyImpressions')}</h2>
              <div className="chart-container">
                {daily.map((day) => (
                  <div key={day.date} className="chart-bar-wrapper">
                    <div
                      className="chart-bar"
                      style={{ height: `${(day.impressions / maxImpressions) * 100}%` }}
                      title={`${day.date}: ${day.impressions} impressions, ${day.clicks} clicks`}
                    />
                    <div className="chart-label">
                      {day.date.slice(5)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per-Order Breakdown */}
          {orders.length > 0 && (
            <div className="section" style={{ marginTop: '2rem' }}>
              <h2>{t('analytics.campaignPerformance')}</h2>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('campaigns.campaign')}</th>
                      <th>{t('analytics.placement')}</th>
                      <th>{t('common.status')}</th>
                      <th>{t('analytics.impressions')}</th>
                      <th>{t('analytics.deliveryPct')}</th>
                      <th>{t('analytics.clicks')}</th>
                      <th>{t('analytics.ctr')}</th>
                      <th>{t('analytics.spent')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td><strong>{order.name}</strong></td>
                        <td>{order.placement}</td>
                        <td>
                          <span className={`badge badge-${order.status === 'active' ? 'success' : order.status === 'completed' ? 'info' : 'warning'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>{order.impressions_delivered?.toLocaleString()}</td>
                        <td>
                          <div className="progress-bar-wrapper">
                            <div className="progress-bar" style={{ width: `${order.delivery_pct}%` }} />
                            <span className="progress-label">{order.delivery_pct}%</span>
                          </div>
                        </td>
                        <td>{order.clicks}</td>
                        <td>{order.ctr}%</td>
                        <td>${(order.spent_cents / 100).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {orders.length === 0 && daily.every((d) => d.impressions === 0) && (
            <div className="empty-state" style={{ marginTop: '2rem' }}>
              <p>{t('analytics.noActivity')}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
