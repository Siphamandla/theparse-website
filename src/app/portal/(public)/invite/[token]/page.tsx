import type { Metadata } from "next";
import { serviceOptions } from "@/data/site";
import { MAX_ATTACHMENTS, MAX_TEAM_SIZE } from "@/lib/portal/config";
import { collections } from "@/lib/portal/db";
import { formatDate } from "@/lib/portal/format";
import { findInviteByToken } from "@/lib/portal/invites";
import { storageConfigured } from "@/lib/portal/storage";
import OnboardingForm from "./OnboardingForm";
import RequestLinkForm from "./RequestLinkForm";
import TeamAcceptForm from "./TeamAcceptForm";

export const metadata: Metadata = { title: "Your invite", referrer: "no-referrer" };
export const dynamic = "force-dynamic";

function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  return `${user.slice(0, 2)}•••@${domain}`;
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-center">
      <div className="pt-card" style={{ alignItems: "center", textAlign: "center" }}>
        <div className="pt-icon-tile" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
        </div>
        <h1 className="pt-h1">{title}</h1>
        {children}
      </div>
    </div>
  );
}

export default async function InvitePage({ params }: { params: { token: string } }) {
  const found = await findInviteByToken(params.token);

  if (!found) {
    return (
      <Notice title="This link isn't valid">
        <p className="pt-muted">Check that you copied the whole link from your email, or contact <a className="pt-link" href="mailto:info@theparse.co.za">info@theparse.co.za</a>.</p>
      </Notice>
    );
  }

  const { invite, status } = found;

  if (status === "accepted") {
    return (
      <Notice title="This invite was already used">
        <p className="pt-muted">Your account is set up. Sign in with a link sent to your email.</p>
        <a className="pt-btn" href="/portal/signin">Sign in</a>
      </Notice>
    );
  }
  if (status === "revoked") {
    return (
      <Notice title="This invite is no longer active">
        <p className="pt-muted">It may have been replaced by a newer invite. Check your inbox, or contact <a className="pt-link" href="mailto:info@theparse.co.za">info@theparse.co.za</a>.</p>
      </Notice>
    );
  }
  if (status === "expired" || status === "rerequested") {
    return (
      <Notice title="This invite link has expired">
        <p className="pt-muted">
          For your security, invite links work once and only for a limited time. Ask for a new one and we&apos;ll email it to <b>{maskEmail(invite.email)}</b>.
        </p>
        <RequestLinkForm token={params.token} alreadyRequested={status === "rerequested"} />
        <p className="pt-muted" style={{ fontSize: 13 }}>
          Already set up? <a className="pt-link" href="/portal/signin">Sign in</a>
        </p>
      </Notice>
    );
  }

  if (invite.type === "team") {
    const c = await collections();
    const org = invite.orgId ? await c.orgs.findOne({ _id: invite.orgId }) : null;
    if (!org || org.status === "archived") {
      return (
        <Notice title="This invite is no longer active">
          <p className="pt-muted">Contact <a className="pt-link" href="mailto:info@theparse.co.za">info@theparse.co.za</a> for help.</p>
        </Notice>
      );
    }
    return (
      <div className="pt-center">
        <TeamAcceptForm
          token={params.token}
          email={invite.email}
          name={invite.name ?? ""}
          orgName={org.name}
          inviterName={invite.invitedBy.name}
          role={invite.role ?? "member"}
          expires={formatDate(invite.expiresAt)}
        />
      </div>
    );
  }

  return (
    <OnboardingForm
      token={params.token}
      email={invite.email}
      inviterName={invite.invitedBy.name}
      expires={formatDate(invite.expiresAt)}
      prefill={{
        name: invite.prefill?.name ?? "",
        company: invite.prefill?.company ?? "",
        regNumber: invite.prefill?.regNumber ?? "",
        services: invite.prefill?.services ?? [],
      }}
      services={serviceOptions.map((s) => ({ value: s.value, label: s.label }))}
      uploadsEnabled={storageConfigured()}
      maxFiles={MAX_ATTACHMENTS}
      maxTeam={MAX_TEAM_SIZE - 1}
    />
  );
}
