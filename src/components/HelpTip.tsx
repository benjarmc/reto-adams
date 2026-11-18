'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export default function HelpTip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open || !btnRef.current) return;

    const place = () => {
      const r = btnRef.current!.getBoundingClientRect();
      const width = Math.min(280, window.innerWidth - 24);
      let left = r.left + r.width / 2 - width / 2;
      left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
      let top = r.bottom + 8;
      const panelH = panelRef.current?.offsetHeight ?? 160;
      if (top + panelH > window.innerHeight - 12) {
        top = Math.max(12, r.top - panelH - 8);
      }
      setCoords({ top, left });
    };

    place();
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="help-tip-btn"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        ?
      </button>
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={panelRef}
            id={panelId}
            className="help-tip-panel"
            role="dialog"
            aria-label={label}
            style={
              coords
                ? { top: coords.top, left: coords.left, width: Math.min(280, window.innerWidth - 24) }
                : { visibility: 'hidden', top: 0, left: 0 }
            }
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
