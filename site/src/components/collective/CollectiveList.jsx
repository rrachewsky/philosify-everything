// CollectiveList - Browse and My Collectives with tabs
// Collectives are auto-created when songs are analyzed (no manual creation)
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { collectiveService } from '../../services/api/collective.js';
import { useAuth } from '../../hooks/useAuth.js';

export function CollectiveList({ onSelect }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tab, setTab] = useState('my'); // 'my' | 'browse'
  const [myGroups, setMyGroups] = useState([]);
  const [browseGroups, setBrowseGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load my collectives
  const loadMyGroups = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { groups } = await collectiveService.getMyCollectives();
      setMyGroups(groups || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load browse collectives
  const loadBrowseGroups = useCallback(async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const { groups } = await collectiveService.browseCollectives(query);
      setBrowseGroups(groups || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (user) {
      loadMyGroups();
      loadBrowseGroups();
    }
  }, [user, loadMyGroups, loadBrowseGroups]);

  // Search handler with debounce
  useEffect(() => {
    if (tab !== 'browse') return;
    const timer = setTimeout(() => {
      loadBrowseGroups(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, tab, loadBrowseGroups]);

  const groups = tab === 'my' ? myGroups : browseGroups;

  return (
    <div className="collective-list">
      {/* Info banner */}
      <div className="collective-info-banner">{t('community.collective.infoBanner')}</div>

      {/* Tabs */}
      <div className="collective-tabs">
        <button
          className={`collective-tab ${tab === 'my' ? 'collective-tab--active' : ''}`}
          onClick={() => setTab('my')}
        >
          {t('community.collective.myCollectives')}
        </button>
        <button
          className={`collective-tab ${tab === 'browse' ? 'collective-tab--active' : ''}`}
          onClick={() => setTab('browse')}
        >
          {t('community.collective.browse')}
        </button>
      </div>

      {/* Search (browse tab only) */}
      {tab === 'browse' && (
        <div className="collective-search">
          <input
            type="text"
            placeholder={t('community.collective.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* Error */}
      {error && <div className="collective-error">{error}</div>}

      {/* Groups list */}
      <div className="collective-groups">
        {loading ? (
          <div className="collective-empty">{t('community.collective.loadingList')}</div>
        ) : groups.length === 0 ? (
          <div className="collective-empty">
            {tab === 'my'
              ? t('community.collective.noMyCollectives')
              : searchQuery
                ? t('community.collective.noSearchResults')
                : t('community.collective.noCollectives')}
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.id} className="collective-item" onClick={() => onSelect(g.id)}>
              <div className="collective-item__row">
                {g.artist_image_url && (
                  <img
                    src={g.artist_image_url}
                    alt={g.artist_name}
                    className="collective-item__img"
                  />
                )}
                <div className="collective-item__info">
                  <div className="collective-item__name">{g.artist_name}</div>
                  <div className="collective-item__meta">
                    {g.member_count}{' '}
                    {g.member_count === 1
                      ? t('community.collective.member')
                      : t('community.collective.members')}{' '}
                    &bull; {g.analysis_count || 0}{' '}
                    {g.analysis_count === 1
                      ? t('community.collective.analysis')
                      : t('community.collective.analyses')}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CollectiveList;
