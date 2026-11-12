import type { Metadata } from "next";
import { collections } from "@/lib/portal/db";
import { formatDateTime } from "@/lib/portal/format";
import { getClient } from "../data";
import NoteForm from "./NoteForm";

export const metadata: Metadata = { title: "Client notes" };

export default async function ClientNotes({ params }: { params: { id: string } }) {
  const org = await getClient(params.id);
  const notes = await (await collections()).notes.find({ orgId: org._id }).sort({ createdAt: -1 }).limit(100).toArray();
  return (
    <section className="pt-card">
      <div>
        <h2 className="pt-h2">Internal notes</h2>
        <p className="pt-muted" style={{ fontSize: 13, marginTop: 4 }}>Only theParse staff can see these.</p>
      </div>
      <NoteForm orgId={org._id.toString()} />
      {notes.length === 0 ? <div className="pt-empty">No notes yet.</div> : null}
      {notes.map((n) => (
        <div key={n._id.toString()} className="pt-quote">
          <div className="pt-muted" style={{ fontSize: 12, marginBottom: 4 }}>{n.author.name} · {formatDateTime(n.createdAt)}</div>
          {n.text}
        </div>
      ))}
    </section>
  );
}
