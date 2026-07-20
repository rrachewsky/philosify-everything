// AgoraRulesModal - Behavioral "terms of service" gate for The Agora.
// Presents the Agora Principles and requires an explicit checkbox commitment
// before the user may participate. Acceptance is handled by the parent.
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../common';

export function AgoraRulesModal({ isOpen, onAccept, onClose }) {
  const { t } = useTranslation();
  const [checked, setChecked] = useState(false);

  const principles = [
    {
      title: t('community.agora.rules.p1Title', 'Reason over force'),
      body: t(
        'community.agora.rules.p1',
        'I persuade with arguments and evidence — never with insults, threats, or intimidation.'
      ),
    },
    {
      title: t('community.agora.rules.p2Title', 'Ideas, not people'),
      body: t(
        'community.agora.rules.p2',
        'I challenge claims as hard as I like, and treat the person making them with civility.'
      ),
    },
    {
      title: t('community.agora.rules.p3Title', 'Good faith'),
      body: t(
        'community.agora.rules.p3',
        "I represent others honestly, own my words, and don't troll, spam, or derail."
      ),
    },
    {
      title: t('community.agora.rules.p4Title', 'Respect rights'),
      body: t(
        'community.agora.rules.p4',
        "No harassment, threats, doxxing, or illegal content. Everyone's freedom here depends on it."
      ),
    },
    {
      title: t('community.agora.rules.p5Title', 'Keep it worth entering'),
      body: t(
        'community.agora.rules.p5',
        'I contribute honestly and help keep the Agora a place worth being.'
      ),
    },
  ];

  const handleAccept = () => {
    if (checked) onAccept();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('community.agora.rules.title', 'The Agora Principles')}
      subtitle={t(
        'community.agora.rules.intro',
        "The Agora is a marketplace of ideas. Enter it as a rational adult who values reason and respects every other mind's right to its own judgment."
      )}
      maxWidth="560px"
      className="legal-modal agora-rules-modal"
    >
      <div className="legal-content">
        <p>{t('community.agora.rules.commitLead', 'By entering, I commit to:')}</p>

        <ul className="agora-rules-list">
          {principles.map((p, i) => (
            <li key={i}>
              <strong>{p.title}.</strong> {p.body}
            </li>
          ))}
        </ul>

        <label className="agora-rules-consent">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <span>
            {t(
              'community.agora.rules.consent',
              'I have read the Agora Principles and I commit to upholding them.'
            )}
          </span>
        </label>

        <button
          type="button"
          className="agora-rules-accept-btn"
          onClick={handleAccept}
          disabled={!checked}
        >
          {t('community.agora.rules.accept', 'Enter the Agora')}
        </button>

        <p className="agora-rules-footer">
          {t(
            'community.agora.rules.footer',
            'Breaking these principles may cost you access to the Agora.'
          )}
        </p>
      </div>
    </Modal>
  );
}

export default AgoraRulesModal;
