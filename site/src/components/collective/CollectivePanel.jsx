// CollectivePanel - Main container for The Collective tab
// Switches between list and detail views (no create/join - auto-created)
import { useState } from 'react';
import { CollectiveList } from './CollectiveList.jsx';
import { CollectiveDetail } from './CollectiveDetail.jsx';

export function CollectivePanel({ onStartDM }) {
  const [view, setView] = useState('list'); // 'list' | 'detail'
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelectGroup = (groupId) => {
    setSelectedGroupId(groupId);
    setView('detail');
  };

  const handleBack = () => {
    setSelectedGroupId(null);
    setView('list');
    // Refresh list in case membership changed
    setRefreshKey((k) => k + 1);
  };

  if (view === 'detail' && selectedGroupId) {
    return <CollectiveDetail groupId={selectedGroupId} onBack={handleBack} onStartDM={onStartDM} />;
  }

  return <CollectiveList key={refreshKey} onSelect={handleSelectGroup} />;
}

export default CollectivePanel;
