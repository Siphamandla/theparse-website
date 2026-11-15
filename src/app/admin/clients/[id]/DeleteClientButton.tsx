"use client";

import { useId, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import FormMessage from "@/components/portal/FormMessage";
import { deleteOrg } from "../../actions";

function ConfirmButton({ ready }: { ready: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="pt-btn sm danger" disabled={!ready || pending}>
      {pending ? "Deleting…" : "Delete permanently"}
    </button>
  );
}

/**
 * "Delete client" with a confirmation dialog. The delete button only unlocks once the
 * admin has typed the company name exactly (the server checks it again).
 */
export default function DeleteClientButton({ orgId, orgName, summary }: { orgId: string; orgName: string; summary: string[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [typed, setTyped] = useState("");
  const [state, action] = useFormState(deleteOrg, null);
  const titleId = useId();
  const inputId = useId();
  const ready = typed.trim() === orgName.trim();

  return (
    <>
      <button type="button" className="pt-ghost danger" onClick={() => dialog.current?.showModal()}>
        Delete
      </button>
      <dialog
        ref={dialog}
        className="pt-modal sm"
        aria-labelledby={titleId}
        onClose={() => setTyped("")}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
      >
        <div className="pt-preview-bar">
          <b id={titleId}>Delete {orgName}?</b>
          <button type="button" className="pt-preview-x" aria-label="Close" onClick={() => dialog.current?.close()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <form action={action} className="pt-modal-body">
          <input type="hidden" name="id" value={orgId} />
          <div className="pt-alert error">This permanently deletes the client and can&apos;t be undone.</div>
          {summary.length ? (
            <div>
              <div className="pt-k" style={{ marginBottom: 8 }}>What will be deleted</div>
              <ul className="pt-delete-list">
                {summary.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
          ) : null}
          <p className="pt-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
            People who only belong to this client lose their portal account. To keep their records, use <b>Archive</b> instead.
          </p>
          <div>
            <label className="pt-label" htmlFor={inputId}>
              Type <b className="pt-delete-name">{orgName}</b> to confirm
            </label>
            <input
              id={inputId}
              className="pt-input"
              name="confirmName"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </div>
          <FormMessage state={state} />
          <div className="pt-row" style={{ justifyContent: "flex-end" }}>
            <button type="button" className="pt-ghost" onClick={() => dialog.current?.close()}>Cancel</button>
            <ConfirmButton ready={ready} />
          </div>
        </form>
      </dialog>
    </>
  );
}
