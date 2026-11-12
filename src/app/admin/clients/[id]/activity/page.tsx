import type { Metadata } from "next";
import { collections } from "@/lib/portal/db";
import { formatDateTime } from "@/lib/portal/format";
import { getClient } from "../data";

export const metadata: Metadata = { title: "Client activity" };

export default async function ClientActivity({ params }: { params: { id: string } }) {
  const org = await getClient(params.id);
  const activity = await (await collections()).audit.find({ orgId: org._id }).sort({ at: -1 }).limit(100).toArray();
  return (
    <section className="pt-card">
      <h2 className="pt-h2">Activity</h2>
      {activity.length === 0 ? <span className="pt-muted">Nothing yet.</span> : null}
      <div className="pt-list">
        {activity.map((a) => (
          <div key={a._id!.toString()} className="pt-item" style={{ fontSize: 13, alignItems: "flex-start" }}>
            <div className="pt-item-main">
              <b style={{ fontWeight: 600 }}>{a.actor.name}</b> · {a.action.replace(/[._]/g, " ")}
              {a.detail ? <small>{a.detail}</small> : null}
            </div>
            <span className="pt-muted" style={{ whiteSpace: "nowrap" }}>{formatDateTime(a.at)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
