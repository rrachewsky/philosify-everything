// JoinCollectiveModal - Enter invite code to join a collective
// Rendered inline in the sidebar (no Modal wrapper)
import { useState } from 'react';
import { collectiveService } from '../../services/api/collective.js';

export function JoinCollectiveModal({ onClose, onJoined }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) return;

    setLoading(true);
    setError(null);

    try {
      const { groupId } = await collectiveService.joinByCode(code);
      onJoined(groupId);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="collective-join">
      <div className="collective-join__header">
        <button className="collective-join__back" onClick={onClose}>
          &larr; Back
        </button>
        <span className="collective-join__title">Join Collective</span>
      </div>

      <form onSubmit={handleSubmit} className="collective-form">
        <div className="collective-form__info">
          Enter the 6-character invite code shared by a collective member.
        </div>

        <input
          type="text"
          className="collective-form__code-input"
          value={code}
          onChange={(e) =>
            setCode(
              e.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
                .slice(0, 6)
            )
          }
          placeholder="ABC123"
          maxLength={6}
          disabled={loading}
          autoFocus
          autoComplete="off"
        />

        {error && <div className="collective-form__error">{error}</div>}

        <button
          type="submit"
          className="collective-form__submit"
          disabled={loading || code.length !== 6}
        >
          {loading ? 'JOINING...' : 'JOIN COLLECTIVE'}
        </button>

        <button
          type="button"
          className="collective-form__cancel"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}

export default JoinCollectiveModal;
