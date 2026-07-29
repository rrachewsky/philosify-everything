// Modal - v2 transaction modal (modals mockup: mwrap/mhead/mbody/cfoot).
// Modals are for transactions only (Design Law §4 navigation law).
import { useEffect } from 'react';

export function ModalV2({ open = true, title, onClose, footer, overlay = true, children }) {
  useEffect(() => {
    if (!open || !onClose) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const box = (
    <div className="mwrap" role="dialog" aria-modal="true" aria-label={title}>
      <div className="mhead">
        <h2>{title}</h2>
        {onClose && (
          <button className="x" onClick={onClose} aria-label="Close">
            ✕
          </button>
        )}
      </div>
      <div className="mbody">{children}</div>
      {footer && <div className="cfoot">{footer}</div>}
    </div>
  );

  if (!overlay) return box;
  return (
    <div
      className="moverlay"
      onClick={(e) => e.target === e.currentTarget && onClose && onClose()}
    >
      {box}
    </div>
  );
}
