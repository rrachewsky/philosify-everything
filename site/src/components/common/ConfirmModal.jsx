// ConfirmModal - Confirmation dialog matching Philosify modal design
// WP6.2: inline gradient styles removed — variants are classes so the
// v2 skin (styles/v2-pages/community-panels.css) can style them with
// tokens (danger = --warn outline, Law-approved functional red).
import { Modal } from './Modal.jsx';

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary', // 'primary' | 'danger'
}) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="400px">
      <p className="text-white-70 mb-6 leading-normal text-sm">{message}</p>

      <div className="flex gap-3 justify-end">
        <button className="form-button form-button--cancel flex-1" onClick={onClose}>
          {cancelText}
        </button>
        <button
          className={`form-button flex-1${confirmVariant === 'danger' ? ' form-button--danger' : ''}`}
          onClick={handleConfirm}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmModal;
