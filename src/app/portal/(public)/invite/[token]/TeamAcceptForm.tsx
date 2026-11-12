"use client";

import { useFormState } from "react-dom";
import FormMessage from "@/components/portal/FormMessage";
import SubmitButton from "@/components/portal/SubmitButton";
import { initials } from "@/lib/portal/format";
import { acceptTeamInvite } from "../actions";

export default function TeamAcceptForm(props: {
  token: string;
  email: string;
  name: string;
  orgName: string;
  inviterName: string;
  role: string;
  expires: string;
}) {
  const [state, action] = useFormState(acceptTeamInvite, null);
  return (
    <form action={action} className="pt-card pt-form">
      <div className="pt-row" style={{ flexWrap: "nowrap" }}>
        <span className="pt-mark lg">{initials(props.orgName)}</span>
        <div>
          <h1 className="pt-h1" style={{ fontSize: 22 }}>Join {props.orgName}</h1>
          <p className="pt-muted" style={{ fontSize: 14 }}>
            {props.inviterName} added you as {props.role === "admin" ? "an" : "a"} <b>{props.role === "admin" ? "Admin" : "Member"}</b>
          </p>
        </div>
      </div>
      <FormMessage state={state} />
      <input type="hidden" name="token" value={props.token} />
      <div>
        <label className="pt-label" htmlFor="name">Your name *</label>
        <input className="pt-input" id="name" name="name" defaultValue={props.name} autoComplete="name" required />
      </div>
      <div>
        <label className="pt-label" htmlFor="email">Email</label>
        <input className="pt-input" id="email" value={props.email} readOnly />
      </div>
      <label className="pt-check">
        <input type="checkbox" name="consent" required />
        <span>
          I agree to the <a className="pt-link" href="/policies/terms-of-service" target="_blank">Terms</a> and{" "}
          <a className="pt-link" href="/policies/privacy-policy" target="_blank">Privacy Policy</a>.
        </span>
      </label>
      <SubmitButton pendingLabel="Setting up…">Accept and open portal</SubmitButton>
      <p className="pt-muted" style={{ fontSize: 12, textAlign: "center" }}>Link expires {props.expires}</p>
    </form>
  );
}
