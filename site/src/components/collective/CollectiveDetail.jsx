// CollectiveDetail - Feed view for a collective (artist fan club)
// Shows artist info, member count, and analysis feed with discussions
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { collectiveService } from '../../services/api/collective.js';
import { CollectiveFeed } from './CollectiveFeed.jsx';
import { AnalysisDiscussion } from './AnalysisDiscussion.jsx';
import { ConfirmModal } from '../common/ConfirmModal.jsx';

export function CollectiveDetail({ groupId, onBack, onStartDM }) {
  const { t } = useTranslation();
  const [group, setGroup] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Load collective detail
  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await collectiveService.getCollectiveDetail(groupId);
      setGroup(data.group);
      setAnalyses(data.analyses || []);
      setIsMember(data.isMember);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  // Join collective
  const handleJoin = async () => {
    setJoining(true);
    setError(null);
    try {
      await collectiveService.joinCollective(groupId);
      setIsMember(true);
      // Reload to get updated member count
      loadDetail();
    } catch (err) {
      if (err.message.includes('Already a member')) {
        setIsMember(true);
      } else {
        setError(err.message);
      }
    } finally {
      setJoining(false);
    }
  };

  // Leave collective
  const handleLeave = async () => {
    setShowLeaveConfirm(false);
    setLeaving(true);
    setError(null);
    try {
      await collectiveService.leaveCollective(groupId);
      onBack();
    } catch (err) {
      setError(err.message);
    } finally {
      setLeaving(false);
    }
  };

  // View analysis discussion
  const handleSelectAnalysis = (analysisId) => {
    if (!isMember) {
      setError(t('community.collective.joinPrompt'));
      return;
    }
    setSelectedAnalysisId(analysisId);
  };

  // Back from discussion to feed
  const handleBackFromDiscussion = () => {
    setSelectedAnalysisId(null);
    // Reload to get updated comment counts
    loadDetail();
  };

  // If viewing a discussion, show that instead
  if (selectedAnalysisId) {
    return (
      <AnalysisDiscussion
        collectiveAnalysisId={selectedAnalysisId}
        onBack={handleBackFromDiscussion}
        onUserClick={onStartDM}
      />
    );
  }

  if (loading && !group) {
    return (
      <div className="collective-detail">
        <div className="collective-detail__loading">{t('community.collective.loadingDetail')}</div>
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="collective-detail">
        <div className="collective-detail__header">
          <button className="collective-detail__back" onClick={onBack}>
            &larr; {t('community.collective.back')}
          </button>
        </div>
        <div className="collective-detail__error">{error}</div>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="collective-detail collective-detail--feed">
      {/* Header */}
      <div className="collective-detail__header">
        <button className="collective-detail__back" onClick={onBack}>
          &larr;
        </button>
        <div className="collective-detail__header-info">
          {group.artist_image_url && (
            <img
              src={group.artist_image_url}
              alt={group.artist_name}
              className="collective-detail__artist-img"
            />
          )}
          <div className="collective-detail__header-text">
            <span className="collective-detail__title">{group.artist_name}</span>
            <span className="collective-detail__stats">
              {group.member_count}{' '}
              {group.member_count === 1
                ? t('community.collective.member')
                : t('community.collective.members')}{' '}
              &bull; {group.analysis_count}{' '}
              {group.analysis_count === 1
                ? t('community.collective.analysis')
                : t('community.collective.analyses')}
            </span>
          </div>
        </div>
        {isMember ? (
          <button
            className="collective-detail__leave-btn"
            onClick={() => setShowLeaveConfirm(true)}
            disabled={leaving}
          >
            {leaving ? '...' : t('community.collective.leave')}
          </button>
        ) : (
          <button className="collective-detail__join-btn" onClick={handleJoin} disabled={joining}>
            {joining ? '...' : t('community.collective.join')}
          </button>
        )}
      </div>

      {/* Error toast */}
      {error && <div className="collective-detail__error-toast">{error}</div>}

      {/* Join prompt for non-members */}
      {!isMember && (
        <div className="collective-detail__join-prompt">{t('community.collective.joinPrompt')}</div>
      )}

      {/* Analysis feed */}
      <CollectiveFeed
        groupId={groupId}
        analyses={analyses}
        onSelectAnalysis={handleSelectAnalysis}
      />

      {/* Leave confirmation modal */}
      <ConfirmModal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={handleLeave}
        title={t('community.collective.leaveTitle')}
        message={t('community.collective.leaveConfirm', { name: group?.artist_name || '' })}
        confirmText={t('community.collective.leave')}
        cancelText={t('community.dm.cancel')}
        confirmVariant="danger"
      />
    </div>
  );
}

export default CollectiveDetail;
