"use client";

import { useRef } from "react";

/**
 * An "Expand" button that opens `children` in a large modal (native <dialog>: focus is
 * trapped, Esc closes, and focus returns to the button). Used for long lists on dashboards.
 */
export default function ExpandDialog({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();

  return (
    <>
      <button
        type="button"
        className="pt-expand-btn"
        aria-haspopup="dialog"
        onClick={() => {
          ref.current?.showModal();
          document.body.style.overflow = "hidden";
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
        </svg>
        Expand
      </button>

      <dialog
        ref={ref}
        className="pt-modal"
        aria-label={title}
        onClose={() => {
          document.body.style.overflow = "";
        }}
        onClick={(e) => {
          if (e.target === ref.current) close(); // backdrop click
        }}
      >
        <div className="pt-modal-head">
          <div>
            <h2 className="pt-h2">{title}</h2>
            {subtitle ? <p className="pt-muted" style={{ fontSize: 13, margin: "2px 0 0" }}>{subtitle}</p> : null}
          </div>
          <button type="button" className="pt-preview-x" aria-label="Close" onClick={close}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="pt-modal-body">{children}</div>
      </dialog>
    </>
  );
}
