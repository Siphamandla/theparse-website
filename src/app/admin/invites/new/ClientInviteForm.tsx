"use client";

import { useRef } from "react";
import { useFormState } from "react-dom";
import FormMessage from "@/components/portal/FormMessage";
import SubmitButton from "@/components/portal/SubmitButton";
import type { ActionResult } from "@/lib/portal/action-result";
import { sendClientInvite } from "../../actions";

export default function ClientInviteForm(props: {
  services: { value: string; label: string }[];
  dayOptions: readonly number[];
  defaultDays: number;
  prefill?: { leadId: string; email: string; name: string; services: string[] };
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, action] = useFormState(async (prev: ActionResult, fd: FormData) => {
    const res = await sendClientInvite(prev, fd);
    if (res?.ok) ref.current?.reset();
    return res;
  }, null);
  const p = props.prefill;

  return (
    <form ref={ref} action={action} className="pt-card pt-form">
      {p ? <input type="hidden" name="leadId" value={p.leadId} /> : null}
      <div className="pt-fields">
        <div>
          <label className="pt-label" htmlFor="em">Client email *</label>
          <input className="pt-input" id="em" name="email" type="email" required defaultValue={p?.email} />
        </div>
        <div>
          <label className="pt-label" htmlFor="nm">Contact name</label>
          <input className="pt-input" id="nm" name="name" defaultValue={p?.name} />
        </div>
      </div>
      <div className="pt-fields">
        <div>
          <label className="pt-label" htmlFor="co">Company</label>
          <input className="pt-input" id="co" name="company" maxLength={160} />
        </div>
        <div>
          <label className="pt-label" htmlFor="rg">Business registration number</label>
          <input
            className="pt-input"
            id="rg"
            name="regNumber"
            placeholder="e.g. 2019/123456/07"
            maxLength={40}
            pattern="[A-Za-z0-9][A-Za-z0-9 /.\-]{1,39}"
            title="Letters, numbers, spaces, / . or -"
            autoComplete="off"
          />
        </div>
      </div>
      <fieldset style={{ border: 0 }}>
        <legend className="pt-label">Services already discussed <i>(pre-ticked for the client)</i></legend>
        <div className="pt-chips">
          {props.services.map((s) => (
            <label key={s.value} className="pt-chip">
              <input type="checkbox" name="services" value={s.value} defaultChecked={p?.services.includes(s.value)} />
              {s.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="pt-fields">
        <div>
          <label className="pt-label" htmlFor="ex">Link expires after</label>
          <select className="pt-input" id="ex" name="days" defaultValue={String(props.defaultDays)}>
            {props.dayOptions.map((d) => <option key={d} value={d}>{d} days</option>)}
          </select>
        </div>
        <div>
          <label className="pt-label" htmlFor="ty">Invite type</label>
          <select className="pt-input" id="ty" name="kind" defaultValue="new">
            <option value="new">New client (needs review)</option>
            <option value="existing">Existing client (active straight away)</option>
          </select>
        </div>
      </div>
      <div>
        <label className="pt-label" htmlFor="nt">Personal note <i>(shown in the email)</i></label>
        <textarea className="pt-input" id="nt" name="note" rows={3} maxLength={1000} />
      </div>
      <FormMessage state={state} />
      <div className="pt-row">
        <SubmitButton pendingLabel="Sending…">Send invite</SubmitButton>
      </div>
    </form>
  );
}
