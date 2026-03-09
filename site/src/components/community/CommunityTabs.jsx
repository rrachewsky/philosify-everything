// CommunityTabs - Tab navigation for the 6 community spaces (2 rows)
import { useTranslation } from 'react-i18next';

const ROW_1 = ['people', 'messages', 'collective'];
const ROW_2 = ['agora', 'debates', 'underground'];

export function CommunityTabs({ activeTab, onTabChange, isSpaceLocked, dmUnreadCount = 0 }) {
  const { t } = useTranslation();

  const renderTab = (tab) => {
    const locked = isSpaceLocked(tab);
    const isActive = activeTab === tab;
    const showBadge = tab === 'messages' && dmUnreadCount > 0 && !isActive;
    const label = t(`community.tabs.${tab}`);

    return (
      <button
        key={tab}
        className={[
          'community-tab',
          isActive && 'community-tab--active',
          locked && 'community-tab--locked',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => onTabChange(tab)}
        title={label}
      >
        {label}
        {locked && <span className="community-tab__lock">&#128274;</span>}
        {showBadge && (
          <span className="community-tab__badge">{dmUnreadCount > 99 ? '99+' : dmUnreadCount}</span>
        )}
      </button>
    );
  };

  return (
    <div className="community-tabs">
      <div className="community-tabs__row">{ROW_1.map(renderTab)}</div>
      <div className="community-tabs__row">{ROW_2.map(renderTab)}</div>
    </div>
  );
}

export default CommunityTabs;
