// useToast hook - Toast notification management
import { useState, useCallback } from 'react';

export function useToast() {
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'info',
    duration: 3000,
  });

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    setToast({
      isVisible: true,
      message,
      type,
      duration,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({
      ...prev,
      isVisible: false,
    }));
  }, []);

  const showSuccess = useCallback(
    (message, duration) => {
      showToast(message, 'success', duration);
    },
    [showToast]
  );

  const showError = useCallback(
    (message, duration) => {
      showToast(message, 'error', duration);
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message, duration) => {
      showToast(message, 'warning', duration);
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message, duration) => {
      showToast(message, 'info', duration);
    },
    [showToast]
  );

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}

export default useToast;
