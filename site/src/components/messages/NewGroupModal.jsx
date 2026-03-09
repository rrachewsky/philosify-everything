// NewGroupModal - Create a new group DM conversation
// Select members from the people list, optionally name the group
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { config } from '../../config';

export function NewGroupModal({ onClose, onCreate }) {
  const { t } = useTranslation();
  const [groupName, setGroupName] = useState('');
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState('');

  // Fetch people list
  useEffect(() => {
    async function fetchPeople() {
      try {
        const res = await fetch(`${config.apiUrl}/api/people`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          // Combine both sections
          const all = [...(data.inCollectives || []), ...(data.allMembers || [])];
          setPeople(all);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchPeople();
  }, []);

  const toggleMember = useCallback((userId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  const handleCreate = useCallback(async () => {
    if (selectedIds.size < 1) return;
    setCreating(true);
    try {
      await onCreate([...selectedIds], groupName.trim() || null);
    } finally {
      setCreating(false);
    }
  }, [selectedIds, groupName, onCreate]);

  // Filter people by name
  const filteredPeople = filter
    ? people.filter((p) => (p.displayName || '').toLowerCase().includes(filter.toLowerCase()))
    : people;

  return (
    <div className="group-members-overlay" onClick={onClose}>
      <div className="group-members-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="group-members-modal__header">
          <span className="group-members-modal__title">{t('community.dm.newGroup')}</span>
          <button className="group-members-modal__close" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Group name input */}
        <div className="group-members-modal__name-section">
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value.slice(0, 50))}
            placeholder={t('community.dm.groupNamePlaceholder')}
            maxLength={50}
            className="group-members-modal__search"
          />
        </div>

        {/* Selected count */}
        {selectedIds.size > 0 && (
          <div className="group-members-modal__selected-count">
            {t('community.dm.selectedCount', { count: selectedIds.size })}
          </div>
        )}

        {/* Filter input */}
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={t('community.dm.searchUsers')}
          className="group-members-modal__search"
        />

        {/* People list */}
        <div className="group-members-modal__list">
          {loading && (
            <div className="group-members-modal__searching">
              {t('community.dm.loadingConversations')}
            </div>
          )}

          {!loading && filteredPeople.length === 0 && (
            <div className="group-members-modal__searching">{t('community.dm.noResults')}</div>
          )}

          {filteredPeople.map((person) => (
            <div
              key={person.id}
              className={`group-members-modal__member group-members-modal__member--selectable ${
                selectedIds.has(person.id) ? 'group-members-modal__member--selected' : ''
              }`}
              onClick={() => toggleMember(person.id)}
            >
              <div className="group-members-modal__member-avatar">
                {(person.displayName || '?')[0].toUpperCase()}
              </div>
              <span className="group-members-modal__member-name">{person.displayName}</span>
              <span className="group-members-modal__checkbox">
                {selectedIds.has(person.id) ? '\u2713' : ''}
              </span>
            </div>
          ))}
        </div>

        {/* Create button */}
        <div className="group-members-modal__footer">
          <button
            className="group-members-modal__create-btn"
            onClick={handleCreate}
            disabled={selectedIds.size < 1 || creating}
          >
            {creating ? '...' : t('community.dm.createGroup')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewGroupModal;
