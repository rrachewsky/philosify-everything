// ============================================================
// useQuiz - Simple open/close state for Quiz sidebar
// ============================================================

import { useState, useCallback } from 'react';

export function useQuiz() {
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

export default useQuiz;
