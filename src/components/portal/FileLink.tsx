"use client";

import { useRef, useState } from "react";
import { fileUrl, PREVIEW_TYPES, previewType } from "@/lib/portal/preview";

type Props = {
  fileKey: string;
  name: string;
  type?: string;
  className?: string;
  title?: string;
  children: React.ReactNode;
};

/**
 * Preview state for one file: `show()` opens the dialog, `dialog` must be rendered once.
 * `kind` is null for types the browser can't display (those just download).
 */
function useFilePreview(fileKey: string, name: string, type?: string) {
  const kind = previewType(type, name);
  const ref = useRef<HTMLDialogElement>(null);
  // `open` only controls whether the preview content is mounted; the <dialog> itself
  // is opened/closed imperatively from the click, never from an effect.
  const [open, setOpen] = useState(false);

  const show = () => {
    setOpen(true);
    ref.current?.showModal();
    document.body.style.overflow = "hidden";
  };
  const hide = () => ref.current?.close();

  const dialog = kind ? (
    <dialog
      ref={ref}
      className="pt-preview"
      aria-label={`Preview of ${name}`}
      onClose={() => {
        document.body.style.overflow = "";
        setOpen(false);
      }}
      onClick={(e) => {
        if (e.target === ref.current) hide(); // backdrop click
      }}
    >
      <div className="pt-preview-bar">
        <b title={name}>{name}</b>
        <div className="pt-preview-act">
          <a className="pt-dt-btn quiet-neutral" href={fileUrl(fileKey, true)} target="_blank" rel="noopener noreferrer">Open in new tab</a>
          <a className="pt-dt-btn" href={fileUrl(fileKey)}>Download</a>
          <button type="button" className="pt-preview-x" aria-label="Close preview" onClick={hide}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      {open ? <PreviewBody fileKey={fileKey} name={name} kind={PREVIEW_TYPES[kind]} /> : null}
    </dialog>
  ) : null;

  /** Click handler for a link to the file: previews on a plain click, leaves modified clicks alone. */
  const onLinkClick = (e: React.MouseEvent) => {
    if (!kind || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    show();
  };

  return { kind, show, dialog, onLinkClick, href: fileUrl(fileKey, Boolean(kind)) };
}

/**
 * A link that opens a stored file. PDFs and images open in a preview window inside the
 * site; other types (Word, Excel…) download, because browsers can't display them.
 */
export default function FileLink({ fileKey, name, type, className, title, children }: Props) {
  const p = useFilePreview(fileKey, name, type);
  return (
    <>
      <a className={className} href={p.href} onClick={p.onLinkClick} title={title ?? `${p.kind ? "Preview" : "Download"} ${name}`}>
        {children}
      </a>
      {p.dialog}
    </>
  );
}

const ext = (name: string) => (name.split(".").pop() ?? "").slice(0, 4).toUpperCase() || "FILE";

/** Mounted only while the dialog is open, so nothing loads until someone asks for a preview. */
function PreviewBody({ fileKey, name, kind }: { fileKey: string; name: string; kind: "pdf" | "image" }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const src = fileUrl(fileKey, true);

  return (
    <div className="pt-preview-body">
      {!loaded && !failed ? <div className="pt-preview-msg">Loading preview…</div> : null}
      {failed ? (
        <div className="pt-preview-msg">
          This file couldn&apos;t be previewed. <a className="pt-link" href={fileUrl(fileKey)}>Download it instead</a>.
        </div>
      ) : kind === "pdf" ? (
        <iframe src={src} title={name} onLoad={() => setLoaded(true)} style={{ opacity: loaded ? 1 : 0 }} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL, not optimisable
        <img src={src} alt={name} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} style={{ opacity: loaded ? 1 : 0 }} />
      )}
    </div>
  );
}

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
  </svg>
);

/** A file as a `.pt-dt-table` row: badge + name + size, the given cells, then Preview / Download. */
export function FileTableRow({
  fileKey,
  name,
  type,
  size,
  cells,
}: {
  fileKey: string;
  name: string;
  type?: string;
  size: string;
  cells: { label: string; value: React.ReactNode; muted?: boolean }[];
}) {
  const p = useFilePreview(fileKey, name, type);
  return (
    <tr>
      <td>
        <div className="pt-dt-who">
          <span className="pt-ext" aria-hidden="true">{ext(name)}</span>
          <div>
            <a className="pt-filerow-name" href={p.href} onClick={p.onLinkClick} title={`${p.kind ? "Preview" : "Download"} ${name}`}>
              {name}
            </a>
            <span>{size}</span>
          </div>
        </div>
        {p.dialog}
      </td>
      {cells.map((c) => (
        <td key={c.label} data-label={c.label} className={c.muted ? "pt-dt-muted" : undefined}>{c.value}</td>
      ))}
      <td>
        <div className="pt-dt-act">
          {p.kind ? (
            <button type="button" className="pt-dt-btn" onClick={p.show} aria-label={`Preview ${name}`}>
              Preview
            </button>
          ) : null}
          <a className="pt-dt-icon" href={fileUrl(fileKey)} aria-label={`Download ${name}`} title="Download">
            <DownloadIcon />
          </a>
        </div>
      </td>
    </tr>
  );
}
