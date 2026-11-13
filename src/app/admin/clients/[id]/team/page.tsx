import type { Metadata } from "next";
import TeamInviteForm from "@/components/portal/TeamInviteForm";
import TeamTable from "@/components/portal/TeamTable";
import { resendInviteAction, revokeInviteAction, staffChangeRole, staffInviteMember, staffRemoveMember } from "../../../actions";
import { getClient } from "../data";

export const metadata: Metadata = { title: "Client team" };

export default async function ClientTeam({ params }: { params: { id: string } }) {
  const org = await getClient(params.id);
  return (
    <>
      <section className="pt-card">
        <h2 className="pt-h2">Add someone to {org.name}</h2>
        <TeamInviteForm action={staffInviteMember} orgId={org._id.toString()} />
      </section>
      <TeamTable
        orgId={org._id}
        actions={{ changeRole: staffChangeRole, remove: staffRemoveMember, resend: resendInviteAction, revoke: revokeInviteAction }}
      />
    </>
  );
}
