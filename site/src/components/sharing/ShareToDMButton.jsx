// ShareToDMButton - Share analysis as a rich card via DM
// Opens a people picker modal, creates conversation, and sends analysis_share message
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth.js';
import { ShareAnalysisToDMModal } from '../messages/ShareAnalysisToDMModal.jsx';
import { Toast } from '../common';

export function ShareToDMButton({
  analysisId,
  songName,
  artist,
  philosophicalNote,
  classification,
}) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  if (!isAuthenticated) return null;

  const analysisData = {
    analysisId,
    songName,
    artist,
    philosophicalNote: philosophicalNote || null,
    classification: classification || null,
  };

  const handleSuccess = (recipientName) => {
    setToast({
      type: 'success',
      message: t('community.dm.analysisShared', { name: recipientName }),
    });
  };

  return (
    <>
      <button
        className="share-dm-button"
        onClick={() => setShowModal(true)}
        disabled={!analysisId}
        title={t('community.dm.shareViaDM')}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>{t('community.dm.shareViaDM')}</span>
      </button>

      {showModal && (
        <ShareAnalysisToDMModal
          analysisData={analysisData}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </>
  );
}

export default ShareToDMButton;
