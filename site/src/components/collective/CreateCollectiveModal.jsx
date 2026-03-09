// CreateCollectiveModal - Form to create a new collective (costs 1 credit)
// Rendered inline in the sidebar (no Modal wrapper)
import { useState } from 'react';
import { collectiveService } from '../../services/api/collective.js';

export function CreateCollectiveModal({ onClose, onCreated }) {
  const [artistName, setArtistName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!artistName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { group } = await collectiveService.createCollective(
        artistName.trim(),
        description.trim() || undefined
      );
      onCreated(group?.id);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="collective-create">
      <div className="collective-create__header">
        <button className="collective-create__back" onClick={onClose}>
          &larr; Back
        </button>
        <span className="collective-create__title">New Collective</span>
      </div>

      <form onSubmit={handleSubmit} className="collective-form">
        <div className="collective-form__cost">
          Creates a fan group for an artist. Costs 1 credit.
        </div>

        <label className="collective-form__label">Artist Name *</label>
        <input
          type="text"
          className="collective-form__input"
          value={artistName}
          onChange={(e) => setArtistName(e.target.value.slice(0, 100))}
          placeholder="e.g. Coldplay, Radiohead, Pink Floyd"
          maxLength={100}
          disabled={loading}
          autoFocus
        />

        <label className="collective-form__label">Description (optional)</label>
        <textarea
          className="collective-form__textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 500))}
          placeholder="What's this collective about?"
          maxLength={500}
          rows={3}
          disabled={loading}
        />
        <div className="collective-form__charcount">{description.length}/500</div>

        {error && <div className="collective-form__error">{error}</div>}

        <button
          type="submit"
          className="collective-form__submit"
          disabled={loading || !artistName.trim()}
        >
          {loading ? 'CREATING...' : 'CREATE COLLECTIVE (1 CREDIT)'}
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

export default CreateCollectiveModal;
