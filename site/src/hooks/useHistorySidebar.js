// ============================================================
// useHistorySidebar - Simple open/close state for History sidebar
// ============================================================

import { useState, useCallback } from 'react';

export function useHistorySidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    open,
    close,
  };
}

export default useHistorySidebar;
