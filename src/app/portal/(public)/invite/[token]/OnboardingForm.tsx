"use client";

import { useRef, useState } from "react";
import { useFormState } from "react-dom";
import FormMessage from "@/components/portal/FormMessage";
import SubmitButton from "@/components/portal/SubmitButton";
import { ALLOWED_ATTACHMENT_TYPES, MAX_ATTACHMENT_BYTES } from "@/lib/portal/config";
import { formatBytes } from "@/lib/portal/format";
import { submitOnboarding } from "../actions";

type Upload = { id: string; name: string; size: number; type: string; key?: string; status: "uploading" | "done" | "error"; error?: string };
type Member = { id: string; email: string; name: string; role: "member" | "admin" };

const uid = () => Math.random().toString(36).slice(2);
const ACCEPT = Object.keys(ALLOWED_ATTACHMENT_TYPES).join(",");

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export default function OnboardingForm(props: {
  token: string;
  email: string;
  inviterName: string;
  expires: string;
  prefill: { name: string; company: string; regNumber: string; services: string[] };
  services: { value: string; label: string }[];
  uploadsEnabled: boolean;
  maxFiles: number;
  maxTeam: number;
}) {
  const [state, action] = useFormState(submitOnboarding, null);
  const [files, setFiles] = useState<Upload[]>([]);
  const [team, setTeam] = useState<Member[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const uploading = files.some((f) => f.status === "uploading");
  const update = (id: string, patch: Partial<Upload>) => setFiles((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  async function upload(file: File) {
    const id = uid();
    const base: Upload = { id, name: file.name, size: file.size, type: file.type, status: "uploading" };
    if (!ALLOWED_ATTACHMENT_TYPES[file.type]) {
      setFiles((fs) => [...fs, { ...base, status: "error", error: "Unsupported file type" }]);
      return;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setFiles((fs) => [...fs, { ...base, status: "error", error: "Larger than 10 MB" }]);
      return;
    }
    setFiles((fs) => [...fs, base]);
    try {
      const res = await fetch("/api/portal/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: props.token, name: file.name, type: file.type, size: file.size }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      const put = await fetch(data.url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!put.ok) throw new Error("Upload failed");
      update(id, { status: "done", key: data.key });
    } catch (err) {
      update(id, { status: "error", error: err instanceof Error ? err.message : "Upload failed" });
    }
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const room = props.maxFiles - files.filter((f) => f.status !== "error").length;
    Array.from(list).slice(0, Math.max(0, room)).forEach(upload);
  }

  const doneFiles = files.filter((f) => f.status === "done").map((f) => ({ key: f.key, name: f.name }));
  const teamPayload = team.filter((m) => m.email.trim()).map(({ email, name, role }) => ({ email, name, role }));

  return (
    <>
      <div className="pt-narrow" style={{ paddingBottom: 0 }}>
        <div className="pt-between">
          <span />
          <span className="pt-pill warn">Link expires {props.expires}</span>
        </div>
      </div>
      <form action={action} className="pt-narrow pt-form" style={{ gap: 24 }}>
        <input type="hidden" name="token" value={props.token} />
        <input type="hidden" name="attachments" value={JSON.stringify(doneFiles)} />
        <input type="hidden" name="team" value={JSON.stringify(teamPayload)} />

        <div>
          <div className="pt-eyebrow">Welcome to theParse</div>
          <h1 className="pt-h1" style={{ fontSize: "clamp(28px,4vw,34px)", margin: "8px 0" }}>Complete your details</h1>
          <p className="pt-sub" style={{ fontSize: 16 }}>
            {props.inviterName} invited you to the theParse client portal. Tell us a bit about you and what you need. When you&apos;re done, you&apos;ll go straight into your portal.
          </p>
        </div>

        <section className="pt-card">
          <h2 className="pt-section-title"><span className="pt-step">1</span>Your details</h2>
          <div className="pt-fields">
            <div>
              <label className="pt-label" htmlFor="name">Full name *</label>
              <input className="pt-input" id="name" name="name" defaultValue={props.prefill.name} autoComplete="name" required maxLength={120} />
            </div>
            <div>
              <label className="pt-label" htmlFor="email">Email</label>
              <input className="pt-input" id="email" value={props.email} readOnly />
              <span className="pt-hint">Tied to your invite and can&apos;t be changed.</span>
            </div>
            <div>
              <label className="pt-label" htmlFor="company">Company *</label>
              <input className="pt-input" id="company" name="company" defaultValue={props.prefill.company} autoComplete="organization" required maxLength={160} />
            </div>
            <div>
              <label className="pt-label" htmlFor="regNumber">Business registration number <i>(optional)</i></label>
              <input
                className="pt-input"
                id="regNumber"
                name="regNumber"
                defaultValue={props.prefill.regNumber}
                placeholder="e.g. 2019/123456/07"
                maxLength={40}
                pattern="[A-Za-z0-9][A-Za-z0-9 /.\-]{1,39}"
                title="Letters, numbers, spaces, / . or -"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="pt-label" htmlFor="phone">Phone <i>(optional)</i></label>
              <input className="pt-input" id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+27 …" maxLength={40} />
            </div>
          </div>
        </section>

        <section className="pt-card">
          <fieldset style={{ border: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            <legend className="pt-section-title" style={{ marginBottom: 6 }}><span className="pt-step">2</span>Services you need *</legend>
            {props.prefill.services.length ? <p className="pt-muted" style={{ fontSize: 14 }}>We&apos;ve ticked what we discussed. Change anything you like.</p> : null}
            <div className="pt-svcs">
              {props.services.map((s) => (
                <label key={s.value} className="pt-svc">
                  <input type="checkbox" name="services" value={s.value} defaultChecked={props.prefill.services.includes(s.value)} />
                  {s.label}
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="pt-card">
          <h2 className="pt-section-title"><span className="pt-step">3</span>Tell us about your project</h2>
          <div>
            <label className="pt-label" htmlFor="message">Message *</label>
            <textarea className="pt-input" id="message" name="message" rows={6} required maxLength={5000} placeholder="What are you trying to achieve, and by when?" />
          </div>

          <div>
            <span className="pt-label">Attachments <i>(optional · up to {props.maxFiles} files, 10 MB each)</i></span>
            {props.uploadsEnabled ? (
              <div
                className={`pt-drop ${dragOver ? "over" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  addFiles(e.dataTransfer.files);
                }}
              >
                <span>
                  Drag files here or{" "}
                  <button type="button" className="pt-textbtn" onClick={() => fileInput.current?.click()}>browse</button>
                </span>
                <span className="pt-muted" style={{ fontSize: 12 }}>PDF, Word, Excel, PowerPoint, PNG or JPG</span>
                <input
                  ref={fileInput}
                  type="file"
                  multiple
                  accept={ACCEPT}
                  className="pt-sr"
                  tabIndex={-1}
                  aria-label="Choose files"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>
            ) : (
              <div className="pt-empty">File uploads aren&apos;t switched on yet. You can email documents to your theParse contact instead.</div>
            )}
            {files.length ? (
              <div className="pt-list" style={{ gap: 8, marginTop: 12 }}>
                {files.map((f) => (
                  <div key={f.id} className="pt-file">
                    <span className="pt-ext">{ALLOWED_ATTACHMENT_TYPES[f.type] ?? "FILE"}</span>
                    <span className="pt-file-name">{f.name}</span>
                    <span className="pt-muted" style={{ fontSize: 12 }} role="status">
                      {f.status === "uploading" ? "Uploading…" : f.status === "error" ? <span style={{ color: "var(--pt-bad)" }}>{f.error}</span> : formatBytes(f.size)}
                    </span>
                    <button type="button" className="pt-icon-btn" aria-label={`Remove ${f.name}`} onClick={() => setFiles((fs) => fs.filter((x) => x.id !== f.id))}>
                      <CloseIcon />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="pt-card">
          <div>
            <h2 className="pt-section-title"><span className="pt-step">4</span>Team access <span className="pt-muted" style={{ fontSize: 13, fontWeight: 500 }}>(optional)</span></h2>
            <p className="pt-muted" style={{ fontSize: 14, marginTop: 8 }}>
              Add colleagues who should see your projects and documents. Each person gets their own invite link. You can add more later.
            </p>
          </div>
          <div className="pt-file" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600 }}>You <span className="pt-muted" style={{ fontWeight: 400 }}>({props.email})</span></span>
            <span className="pt-pill acc">Owner</span>
          </div>
          {team.map((m, i) => (
            <div key={m.id} className="pt-team-row">
              <input
                className="pt-input grow2"
                type="email"
                aria-label={`Colleague ${i + 1} email`}
                placeholder="colleague@company.com"
                value={m.email}
                onChange={(e) => setTeam((t) => t.map((x) => (x.id === m.id ? { ...x, email: e.target.value } : x)))}
              />
              <input
                className="pt-input grow1"
                aria-label={`Colleague ${i + 1} name`}
                placeholder="Name (optional)"
                value={m.name}
                onChange={(e) => setTeam((t) => t.map((x) => (x.id === m.id ? { ...x, name: e.target.value } : x)))}
              />
              <select
                className="pt-input role"
                aria-label={`Colleague ${i + 1} role`}
                value={m.role}
                onChange={(e) => setTeam((t) => t.map((x) => (x.id === m.id ? { ...x, role: e.target.value as Member["role"] } : x)))}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button type="button" className="pt-icon-btn" style={{ width: 46, height: 46 }} aria-label={`Remove colleague ${i + 1}`} onClick={() => setTeam((t) => t.filter((x) => x.id !== m.id))}>
                <CloseIcon />
              </button>
            </div>
          ))}
          <div className="pt-between">
            <button
              type="button"
              className="pt-ghost"
              disabled={team.length >= props.maxTeam}
              onClick={() => setTeam((t) => [...t, { id: uid(), email: "", name: "", role: "member" }])}
            >
              + Add person
            </button>
            <span className="pt-muted" style={{ fontSize: 12 }}>
              <b>Member</b>: view and log requests · <b>Admin</b>: also manages the team
            </span>
          </div>
        </section>

        <label className="pt-check">
          <input type="checkbox" name="consent" required />
          <span>
            I agree to the <a className="pt-link" href="/policies/terms-of-service" target="_blank">Terms of Service</a> and consent to theParse
            processing this information as described in the <a className="pt-link" href="/policies/privacy-policy" target="_blank">Privacy Policy</a> (POPIA).
          </span>
        </label>

        <FormMessage state={state} />

        <div className="pt-row">
          <SubmitButton pendingLabel="Setting up your portal…" disabled={uploading} style={{ minHeight: 52, fontSize: 16 }}>
            Complete setup →
          </SubmitButton>
          <span className="pt-muted" style={{ fontSize: 13 }}>
            {uploading ? "Waiting for uploads to finish…" : "You'll be signed in automatically."}
          </span>
        </div>
      </form>
    </>
  );
}
