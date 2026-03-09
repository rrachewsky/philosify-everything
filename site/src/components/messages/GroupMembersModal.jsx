// GroupMembersModal - View/manage members of a group DM conversation
// Admin: can add members, remove members, rename group
// Any member: can view member list
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmModal } from '../common/ConfirmModal.jsx';
import { config } from '../../config';

export function GroupMembersModal({
  conversation,
  currentUserId,
  onClose,
  onAddMembers,
  onRemoveMember,
  onRename,
}) {
  const { t } = useTranslation();
  const [editingName, setEditingName] = useState(false);
  const [groupName, setGroupName] = useState(conversation?.name || '');
  const [removeTarget, setRemoveTarget] = useState(null); // { id, displayName }
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState(false);

  const members = useMemo(() => conversation?.members || [], [conversation?.members]);
  const myRole = members.find((m) => m.id === currentUserId)?.role;
  const isAdmin = myRole === 'admin';

  // Save group name
  const handleSaveName = useCallback(async () => {
    if (!groupName.trim()) return;
    setRenaming(true);
    try {
      await onRename(groupName.trim());
      setEditingName(false);
    } catch {
      // Error handled in hook
    } finally {
      setRenaming(false);
    }
  }, [groupName, onRename]);

  // Fetch all people once when "Add Members" is opened
  const [allPeople, setAllPeople] = useState([]);
  const [loadingPeople, setLoadingPeople] = useState(false);

  useEffect(() => {
    if (!showAddMember) return;
    let cancelled = false;
    setLoadingPeople(true);
    (async () => {
      try {
        const res = await fetch(`${config.apiUrl}/api/people`, { credentials: 'include' });
        if (res.ok && !cancelled) {
          const data = await res.json();
          const all = [...(data.inCollectives || []), ...(data.allMembers || [])];
          // Filter out existing members
          const memberIds = new Set(members.map((m) => m.id));
          setAllPeople(all.filter((p) => !memberIds.has(p.id)));
        }
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setLoadingPeople(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showAddMember, members]);

  // Client-side search filter
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  const searchResults =
    searchQuery.length >= 2
      ? allPeople.filter((p) =>
          (p.displayName || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
      : allPeople;

  // Add a user to the group
  const handleAddUser = useCallback(
    async (userId) => {
      setAdding(true);
      try {
        await onAddMembers([userId]);
        // Remove from available people list
        setAllPeople((prev) => prev.filter((u) => u.id !== userId));
      } catch {
        // Error handled in hook
      } finally {
        setAdding(false);
      }
    },
    [onAddMembers]
  );

  // Confirm member removal
  const confirmRemove = useCallback(async () => {
    if (removeTarget) {
      await onRemoveMember(removeTarget.id);
    }
    setRemoveTarget(null);
  }, [removeTarget, onRemoveMember]);

  return (
    <div className="group-members-overlay" onClick={onClose}>
      <div className="group-members-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="group-members-modal__header">
          <span className="group-members-modal__title">{t('community.dm.members')}</span>
          <button className="group-members-modal__close" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Group name */}
        <div className="group-members-modal__name-section">
          {editingName ? (
            <div className="group-members-modal__name-edit">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value.slice(0, 50))}
                placeholder={t('community.dm.groupNamePlaceholder')}
                maxLength={50}
                autoFocus
              />
              <button onClick={handleSaveName} disabled={renaming || !groupName.trim()}>
                {renaming ? '...' : t('community.dm.save')}
              </button>
              <button onClick={() => setEditingName(false)}>{t('community.dm.cancel')}</button>
            </div>
          ) : (
            <div className="group-members-modal__name-display">
              <span>{conversation?.name || t('community.dm.noGroupName')}</span>
              {isAdmin && (
                <button
                  className="group-members-modal__edit-btn"
                  onClick={() => setEditingName(true)}
                >
                  {t('community.dm.rename')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Member list */}
        <div className="group-members-modal__list">
          {members.map((member) => (
            <div key={member.id} className="group-members-modal__member">
              <div className="group-members-modal__member-avatar">
                {(member.displayName || '?')[0].toUpperCase()}
              </div>
              <div className="group-members-modal__member-info">
                <span className="group-members-modal__member-name">
                  {member.displayName}
                  {member.id === currentUserId && ` (${t('community.dm.you')})`}
                </span>
                <span className="group-members-modal__member-role">
                  {member.role === 'admin' ? t('community.dm.admin') : t('community.dm.member')}
                </span>
              </div>
              {isAdmin && member.id !== currentUserId && member.role !== 'admin' && (
                <button
                  className="group-members-modal__remove-btn"
                  onClick={() =>
                    setRemoveTarget({ id: member.id, displayName: member.displayName })
                  }
                >
                  {t('community.dm.remove')}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add member section (admin only) */}
        {isAdmin && (
          <div className="group-members-modal__add-section">
            {showAddMember ? (
              <>
                <input
                  type="text"
                  className="group-members-modal__search"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={t('community.dm.searchUsers')}
                  autoFocus
                />
                {loadingPeople && (
                  <div className="group-members-modal__searching">
                    {t('community.dm.searching')}
                  </div>
                )}
                {searchResults.map((user) => (
                  <div key={user.id} className="group-members-modal__search-result">
                    <div className="group-members-modal__member-avatar">
                      {(user.displayName || user.email || '?')[0].toUpperCase()}
                    </div>
                    <span className="group-members-modal__member-name">
                      {user.displayName || user.email}
                    </span>
                    <button
                      className="group-members-modal__add-btn"
                      onClick={() => handleAddUser(user.id)}
                      disabled={adding}
                    >
                      {adding ? '...' : t('community.dm.add')}
                    </button>
                  </div>
                ))}
                <button
                  className="group-members-modal__cancel-search"
                  onClick={() => {
                    setShowAddMember(false);
                    setSearchQuery('');
                  }}
                >
                  {t('community.dm.cancel')}
                </button>
              </>
            ) : (
              <button
                className="group-members-modal__add-member-btn"
                onClick={() => setShowAddMember(true)}
              >
                + {t('community.dm.addMembers')}
              </button>
            )}
          </div>
        )}

        {/* Remove member confirmation */}
        <ConfirmModal
          isOpen={!!removeTarget}
          onClose={() => setRemoveTarget(null)}
          onConfirm={confirmRemove}
          title={t('community.dm.removeMemberTitle')}
          message={t('community.dm.removeMemberConfirm', {
            name: removeTarget?.displayName || '',
          })}
          confirmText={t('community.dm.remove')}
          cancelText={t('community.dm.cancel')}
          confirmVariant="danger"
        />
      </div>
    </div>
  );
}

export default GroupMembersModal;
