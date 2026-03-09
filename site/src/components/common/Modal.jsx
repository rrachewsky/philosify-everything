// Modal - Reusable modal component matching original Philosify design

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  maxWidth = '420px',
  className = '',
}) {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`auth-overlay ${isOpen ? 'active' : ''}`}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className={`auth-modal ${className}`}
        style={{ maxWidth }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        <button className="close-modal" onClick={onClose} aria-label="Close">
          &times;
        </button>

        {title && <h2 id="modal-title">{title}</h2>}
        {subtitle && <p>{subtitle}</p>}

        {children}
      </div>
    </div>
  );
}

export default Modal;
