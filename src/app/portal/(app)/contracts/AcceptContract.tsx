"use client";

import { useRef, useState } from "react";
import type { ActionResult } from "@/lib/portal/action-result";
import { MAX_DOC_BYTES, uploadFile } from "@/components/portal/upload";
import { fileUrl, previewType } from "@/lib/portal/preview";
import { acceptContract } from "./actions";

const SIGNED_ACCEPT = ".pdf,.png,.jpg,.jpeg";
const SIGNED_TYPES = ["application/pdf", "image/png", "image/jpeg"];

/**
 * "Review & sign": shows the contract, then signs it. The client must attach their signed copy,
 * tick the agreement and type their full name; all three are required (and re-checked on the server).
 */
export default function AcceptContract(props: { contractId: string; title: string; note?: string; fileKey: string; fileName: string; defaultName: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ActionResult>(null);
  const [busy, setBusy] = useState<"" | "uploading" | "signing">("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get("signedCopy");
    fd.delete("signedCopy");
    // Check everything before uploading, so a mistake doesn't leave a stray file behind.
    if (!(file instanceof File) || !file.size) return setState({ ok: false, message: "Attach your signed copy of the contract." });
    if (!SIGNED_TYPES.includes(file.type)) return setState({ ok: false, message: "The signed copy must be a PDF, PNG or JPG." });
    if (file.size > MAX_DOC_BYTES) return setState({ ok: false, message: "The signed copy can be up to 25 MB." });
    if (fd.get("agree") !== "on") return setState({ ok: false, message: "Tick the box to confirm you've read and agree to the contract." });
    const typed = String(fd.get("typedName") ?? "").trim();
    if (typed.length < 3 || !/\s/.test(typed)) return setState({ ok: false, message: "Type your full name (first and last name)." });

    setState(null);
    setBusy("uploading");
    const up = await uploadFile(file, { purpose: "signed-contract", contractId: props.contractId });
    if ("error" in up) {
      setBusy("");
      return setState({ ok: false, message: up.error });
    }
    fd.set("key", up.key);
    fd.set("name", file.name);
    setBusy("signing");
    const res = await acceptContract(null, fd);
    setBusy("");
    setState(res);
  }
  const canEmbed = previewType(undefined, props.fileName) === "application/pdf";

  return (
    <>
      <button
        type="button"
        className="pt-paybtn"
        onClick={() => {
          setOpen(true);
          dialog.current?.showModal();
        }}
      >
        Review &amp; sign
      </button>

      <dialog ref={dialog} className="pt-preview pt-accept" aria-label={`Sign ${props.title}`} onClose={() => setOpen(false)}>
        <div className="pt-preview-bar">
          <b title={props.title}>{props.title}</b>
          <div className="pt-preview-act">
            <a className="pt-dt-btn quiet-neutral" href={fileUrl(props.fileKey, canEmbed)} target="_blank" rel="noopener noreferrer">Open in new tab</a>
            <button type="button" className="pt-preview-x" aria-label="Close" onClick={() => dialog.current?.close()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="pt-accept-body">
          <div className="pt-accept-doc">
            {open && canEmbed ? (
              <iframe src={fileUrl(props.fileKey, true)} title={props.title} />
            ) : (
              <div className="pt-preview-msg">
                <span>
                  This file can&apos;t be shown here. <a className="pt-link" href={fileUrl(props.fileKey)}>Download {props.fileName}</a> to read it.
                </span>
              </div>
            )}
          </div>

          <aside className="pt-accept-side">
            {state?.ok ? (
              <div className="pt-alert success" role="status">{state.message}</div>
            ) : (
              <form className="pt-form" onSubmit={onSubmit} noValidate>
                <input type="hidden" name="contractId" value={props.contractId} />
                {props.note ? <p className="pt-quote" style={{ fontSize: 13 }}>{props.note}</p> : null}
                <ol className="pt-sign-steps">
                  <li>
                    <b>Download and sign the contract</b>
                    <span>
                      <a className="pt-link" href={fileUrl(props.fileKey)}>Download {props.fileName}</a>, then sign it: print, sign and scan it, or sign the PDF digitally.
                    </span>
                  </li>
                  <li>
                    <label className="pt-label" htmlFor={`sc-${props.contractId}`}>Attach your signed copy *</label>
                    <input className="pt-input pt-input-file" id={`sc-${props.contractId}`} name="signedCopy" type="file" required accept={SIGNED_ACCEPT} />
                    <span className="pt-hint">PDF, PNG or JPG, up to 25 MB. Include every signed page.</span>
                  </li>
                  <li>
                    <label className="pt-check">
                      <input type="checkbox" name="agree" required />
                      <span>
                        I have read this contract and agree to its terms on behalf of my company.
                        <small>Signing here is a legally binding electronic signature.</small>
                      </span>
                    </label>
                  </li>
                  <li>
                    <label className="pt-label" htmlFor={`acc-${props.contractId}`}>Type your full name *</label>
                    <input className="pt-input" id={`acc-${props.contractId}`} name="typedName" required minLength={3} maxLength={120} autoComplete="name" defaultValue={props.defaultName} />
                    <span className="pt-hint">We record your name, the date and time, and your connection details with your signature.</span>
                  </li>
                </ol>
                {state && !state.ok ? <div className="pt-alert error" role="alert">{state.message}</div> : null}
                <button type="submit" className="pt-btn sm" disabled={Boolean(busy)}>
                  {busy === "uploading" ? "Uploading signed copy…" : busy === "signing" ? "Signing…" : "Sign contract"}
                </button>
              </form>
            )}
          </aside>
        </div>
      </dialog>
    </>
  );
}
