"use client";

import { useFormState, useFormStatus } from "react-dom";
import FormMessage from "@/components/portal/FormMessage";
import { PROJECT_STATUSES, projectStatusLabel } from "@/lib/portal/format";
import { createProject, updateProject } from "../../../actions";

type Defaults = { name: string; description?: string; status: string; startDate?: string; dueDate?: string };

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="pt-btn sm" disabled={pending}>
      {pending ? "Saving…" : label}
    </button>
  );
}

/** Creates a project (pass `orgId`) or edits one (pass `projectId` and `defaults`). */
export default function ProjectForm({ orgId, projectId, defaults }: { orgId?: string; projectId?: string; defaults?: Defaults }) {
  const editing = Boolean(projectId);
  const [state, action] = useFormState(editing ? updateProject : createProject, null);
  const idp = editing ? `pj-${projectId}` : "pj-new";

  return (
    <form action={action} className="pt-form">
      {editing ? <input type="hidden" name="id" value={projectId} /> : <input type="hidden" name="orgId" value={orgId} />}
      <div className="pt-fields">
        <div>
          <label className="pt-label" htmlFor={`${idp}-name`}>Project name *</label>
          <input className="pt-input" id={`${idp}-name`} name="name" required maxLength={160} defaultValue={defaults?.name} placeholder="e.g. Fleet tracking dashboard" />
        </div>
        <div>
          <label className="pt-label" htmlFor={`${idp}-status`}>Status</label>
          <select className="pt-input" id={`${idp}-status`} name="status" defaultValue={defaults?.status ?? "planning"}>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>{projectStatusLabel[s]}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="pt-fields">
        <div>
          <label className="pt-label" htmlFor={`${idp}-start`}>Start date <i>(optional)</i></label>
          <input className="pt-input" id={`${idp}-start`} name="startDate" type="date" defaultValue={defaults?.startDate} />
        </div>
        <div>
          <label className="pt-label" htmlFor={`${idp}-due`}>Due date <i>(optional)</i></label>
          <input className="pt-input" id={`${idp}-due`} name="dueDate" type="date" defaultValue={defaults?.dueDate} />
        </div>
      </div>
      <div>
        <label className="pt-label" htmlFor={`${idp}-desc`}>Description <i>(optional, the client sees this)</i></label>
        <textarea className="pt-input" id={`${idp}-desc`} name="description" maxLength={4000} rows={4} defaultValue={defaults?.description} placeholder="What we're building and what's in scope" />
      </div>
      {editing ? null : (
        <label className="pt-check">
          <input type="checkbox" name="notify" value="1" defaultChecked />
          <span>
            Email the client&apos;s team
            <small>Everyone with portal access gets a link to the project.</small>
          </span>
        </label>
      )}
      <FormMessage state={state} />
      <div>
        <Submit label={editing ? "Save changes" : "Create project"} />
      </div>
    </form>
  );
}
