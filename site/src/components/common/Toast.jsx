// Toast - Notification toast component
import { useEffect } from 'react';

export function Toast({
  message,
  type = 'info',
  isVisible,
  onClose,
  duration = 3000,
  className = '',
}) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const typeStyles = {
    success: {
      backgroundColor: '#4CAF50',
      color: 'white',
    },
    error: {
      backgroundColor: '#dc3545',
      color: 'white',
    },
    warning: {
      backgroundColor: '#ffc107',
      color: '#333',
    },
    info: {
      backgroundColor: '#17a2b8',
      color: 'white',
    },
  };

  const toastStyles = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '16px 24px',
    borderRadius: '4px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    zIndex: 200020,
    minWidth: '250px',
    maxWidth: '500px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    animation: 'slideIn 0.3s ease-out',
    ...typeStyles[type],
  };

  return (
    <>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div
        className={`toast toast-${type} ${className}`}
        style={toastStyles}
        role="alert"
        aria-live="assertive"
      >
        <span>{message}</span>
        <button
          onClick={onClose}
          aria-label="Close notification"
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            fontSize: '20px',
            marginLeft: '16px',
            cursor: 'pointer',
          }}
        >
          ×
        </button>
      </div>
    </>
  );
}

export default Toast;
