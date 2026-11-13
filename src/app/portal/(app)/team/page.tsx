import type { Metadata } from "next";
import { redirect } from "next/navigation";
import TeamInviteForm from "@/components/portal/TeamInviteForm";
import TeamTable from "@/components/portal/TeamTable";
import { MAX_TEAM_SIZE } from "@/lib/portal/config";
import { seatsUsed } from "@/lib/portal/invites";
import { canManageTeam, requireMember } from "@/lib/portal/session";
import { changeRole, inviteColleague, removeMember, resendColleagueInvite, revokeColleagueInvite } from "./actions";

export const metadata: Metadata = { title: "Team" };
export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const { org, membership } = await requireMember();
  if (!canManageTeam(membership.role)) redirect("/portal");
  const used = await seatsUsed(org._id);

  return (
    <>
      <div className="pt-head">
        <div>
          <h1 className="pt-h1">Team</h1>
          <p className="pt-sub">
            People at {org.name} who can open this portal. {used} of {MAX_TEAM_SIZE} places used.
          </p>
        </div>
      </div>

      <section className="pt-card" id="invite">
        <h2 className="pt-h2">Invite someone</h2>
        {used >= MAX_TEAM_SIZE ? (
          <p className="pt-muted">Your team is full. Remove someone or revoke a pending invite to add another person.</p>
        ) : (
          <TeamInviteForm action={inviteColleague} />
        )}
        <p className="pt-muted" style={{ fontSize: 13 }}>
          <b>Member</b>: views projects and documents and logs requests. <b>Admin</b>: can also manage the team.
        </p>
      </section>

      <TeamTable
        orgId={org._id}
        selfMembershipId={membership._id}
        actions={{ changeRole, remove: removeMember, resend: resendColleagueInvite, revoke: revokeColleagueInvite }}
      />
      <p className="pt-muted" style={{ fontSize: 13 }}>theParse is notified whenever someone is added.</p>
    </>
  );
}
