import type { Metadata } from "next";
import Link from "next/link";
import { serviceOptions } from "@/data/site";
import { INVITE_DAY_OPTIONS, INVITE_DAYS_DEFAULT } from "@/lib/portal/config";
import { collections, toObjectId } from "@/lib/portal/db";
import ClientInviteForm from "./ClientInviteForm";

export const metadata: Metadata = { title: "Invite a client" };

export default async function NewInvitePage({ searchParams }: { searchParams: { lead?: string } }) {
  const leadId = toObjectId(searchParams.lead);
  const lead = leadId ? await (await collections()).leads.findOne({ _id: leadId }) : null;
  const prefill = lead
    ? {
        leadId: lead._id.toString(),
        email: lead.email,
        name: lead.name,
        services: (lead.products ?? []).map((p) => p.value ?? "").filter(Boolean),
      }
    : undefined;

  return (
    <>
      <div className="pt-head">
        <div>
          <div className="pt-eyebrow">Invites</div>
          <h1 className="pt-h1" style={{ marginTop: 6 }}>Invite a client</h1>
          <p className="pt-sub">
            {prefill
              ? `Pre-filled from ${prefill.name || prefill.email}'s enquiry. Check the details, then send.`
              : "They get a single-use link to complete their details. Works for new and existing clients."}
          </p>
        </div>
        <Link className="pt-ghost" href="/admin/invites">View sent invites</Link>
      </div>

      <div className="pt-grid">
        <ClientInviteForm
          key={prefill?.leadId ?? "blank"}
          services={serviceOptions.map((s) => ({ value: s.value, label: s.label }))}
          dayOptions={INVITE_DAY_OPTIONS}
          defaultDays={INVITE_DAYS_DEFAULT}
          prefill={prefill}
        />
        <section className="pt-card">
          <h2 className="pt-h2">How it works</h2>
          <ol className="pt-ol">
            <li>The client gets a single-use link that expires after the period you choose.</li>
            <li>They confirm their details, pick services, and add a message and attachments.</li>
            <li>They can add colleagues, who each get their own invite.</li>
            <li>When they submit, they&apos;re signed straight into the portal and you get an email.</li>
          </ol>
          <div className="pt-quote pt-muted" style={{ fontSize: 13 }}>
            Expired links show a <b>Request a new link</b> button. Those requests appear under{" "}
            <Link className="pt-link" href="/admin/invites?status=rerequested">Re-requested</Link>.
            Sending a new invite to the same address cancels the old link.
          </div>
        </section>
      </div>
    </>
  );
}
