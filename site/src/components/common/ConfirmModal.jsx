// ConfirmModal - Confirmation dialog matching Philosify modal design
import { Modal } from './Modal.jsx';

const cancelStyle = {
  background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f97316 100%)',
  border: '1px solid transparent',
  color: '#fff',
};

const confirmStyle = {
  background: 'rgba(124, 58, 237, 0.3)',
  border: '1px solid rgba(124, 58, 237, 0.5)',
  color: '#00e0f0',
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  // eslint-disable-next-line no-unused-vars
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
        <button className="form-button flex-1" onClick={onClose} style={cancelStyle}>
          {cancelText}
        </button>
        <button className="form-button flex-1" onClick={handleConfirm} style={confirmStyle}>
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmModal;
