"use client";

import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { fileUrl, previewType } from "@/lib/portal/preview";
import { acceptContract } from "./actions";
import SignedUpload from "./SignedUpload";

function AcceptButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="pt-btn sm" disabled={pending}>
      {pending ? "Accepting…" : "Accept contract"}
    </button>
  );
}

/** "Review & accept": shows the contract, then records a click-to-accept with the typed name. */
export default function AcceptContract(props: { contractId: string; title: string; note?: string; fileKey: string; fileName: string; defaultName: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(acceptContract, null);
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
        Review &amp; accept
      </button>

      <dialog ref={dialog} className="pt-preview pt-accept" aria-label={`Accept ${props.title}`} onClose={() => setOpen(false)}>
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
              <form action={action} className="pt-form">
                <input type="hidden" name="contractId" value={props.contractId} />
                {props.note ? <p className="pt-quote" style={{ fontSize: 13 }}>{props.note}</p> : null}
                <label className="pt-check">
                  <input type="checkbox" name="agree" required />
                  <span>
                    I have read this contract and agree to its terms on behalf of my company.
                    <small>Accepting here is a legally binding electronic signature.</small>
                  </span>
                </label>
                <div>
                  <label className="pt-label" htmlFor={`acc-${props.contractId}`}>Type your full name</label>
                  <input className="pt-input" id={`acc-${props.contractId}`} name="typedName" required minLength={3} maxLength={120} autoComplete="name" defaultValue={props.defaultName} />
                  <span className="pt-hint">We record your name, the date and time, and your connection details with your acceptance.</span>
                </div>
                {state && !state.ok ? <div className="pt-alert error" role="alert">{state.message}</div> : null}
                <AcceptButton />
                <div className="pt-accept-alt">
                  <b>Prefer to sign on paper?</b>
                  <ol>
                    <li>
                      <a className="pt-link" href={fileUrl(props.fileKey)}>Download the contract</a>
                    </li>
                    <li>Print, sign and scan it (or sign the PDF)</li>
                    <li>Upload the signed copy:</li>
                  </ol>
                  <SignedUpload contractId={props.contractId} title={props.title} />
                </div>
              </form>
            )}
          </aside>
        </div>
      </dialog>
    </>
  );
}
