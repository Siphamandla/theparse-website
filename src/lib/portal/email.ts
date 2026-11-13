import "server-only";
import { socialLinksHtml, withSocialText } from "@/lib/email-social";
import sendRawEmail from "@/lib/sendgrid";
import { notifyEmail, siteUrl } from "./config";
import { formatDate } from "./format";

/** Escapes text for HTML email bodies. Every user-supplied value goes through this. */
export function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Every portal email goes through here, so the plain-text version always ends with the social links. */
const sendEmail = (opts: Parameters<typeof sendRawEmail>[0]) =>
  sendRawEmail({ ...opts, plainTextContent: withSocialText(opts.plainTextContent ?? "") });

function layout(heading: string, body: string) {
  const base = siteUrl();
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:#F0F2F9;font-family:Arial,Helvetica,sans-serif;color:#121723">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="background:#fff;border:1px solid #E3E8EF;border-radius:16px;overflow:hidden">
      <div style="padding:22px 32px;border-bottom:1px solid #E3E8EF">
        <img src="${base}/images/logo/logo-2.png" alt="theParse" width="160" height="50" style="display:block;height:50px;width:auto">
      </div>
      <div style="padding:32px">
        <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3">${esc(heading)}</h1>
        ${body}
      </div>
      <div style="padding:18px 32px;border-top:1px solid #E3E8EF;font-size:12px;color:#5b6475">
        <div style="margin:0 0 12px">${socialLinksHtml()}</div>
        theParse · South Africa · <a href="${base}/policies/privacy-policy" style="color:#c2410c">Privacy policy</a>
      </div>
    </div>
  </div>
</body></html>`;
}

const p = (html: string) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3b4352">${html}</p>`;
const small = (html: string) => `<p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#5b6475">${html}</p>`;
const button = (url: string, label: string) =>
  `<p style="margin:8px 0 24px"><a href="${esc(url)}" style="display:inline-block;padding:14px 26px;border-radius:999px;background:#ff5d22;color:#121723;font-weight:bold;font-size:15px;text-decoration:none">${esc(label)}</a></p>`;
const quote = (label: string, text: string) =>
  `<div style="margin:0 0 20px;padding:16px 18px;border-radius:12px;background:#F7F8FC;border:1px solid #E3E8EF;font-size:14px;line-height:1.6;color:#3b4352"><div style="font-size:12px;font-weight:bold;letter-spacing:.06em;text-transform:uppercase;color:#5b6475;margin-bottom:4px">${esc(label)}</div>${esc(text).replace(/\n/g, "<br>")}</div>`;

/** A person's name for email copy, or null when all we have is an email address (never show those). */
const displayName = (n: string | undefined) => (n && !n.includes("@") ? n.trim() : null);

/** Heading for the personal note in client invites. */
const NOTE_HEADING = "A note from our CEO";

export async function sendClientInviteEmail(opts: {
  to: string;
  name?: string;
  company?: string;
  inviterName: string;
  note?: string;
  url: string;
  expiresAt: Date;
}) {
  // layout() escapes the heading, so the raw name goes in here.
  const hello = opts.name ? `Hi ${opts.name}, welcome to theParse` : "Welcome to theParse";
  const who = opts.company ? `<b>${esc(opts.company)}</b>` : "you";
  const inviter = displayName(opts.inviterName);
  const intro = inviter ? `${inviter} from theParse has invited` : "theParse has invited";
  const html = layout(
    hello,
    [
      p(`${esc(intro)} ${who} to our client portal. That's where you'll follow your projects, share documents and log requests with our team.`),
      opts.note ? quote(NOTE_HEADING, opts.note) : "",
      button(opts.url, "Complete your details"),
      small(`This link works once and expires on <b>${esc(formatDate(opts.expiresAt))}</b>. You can attach documents and add colleagues who should have access.`),
      small(`Didn't expect this? You can ignore this email.`),
    ].join(""),
  );
  const text = `${intro} you to the theParse client portal.\n\n${opts.note ? `${NOTE_HEADING}:\n${opts.note}\n\n` : ""}Complete your details: ${opts.url}\n\nThis link works once and expires on ${formatDate(opts.expiresAt)}.`;
  return sendEmail({ to: opts.to, subject: "You're invited to the theParse client portal", htmlContent: html, plainTextContent: text });
}

export async function sendTeamInviteEmail(opts: {
  to: string;
  name?: string;
  orgName: string;
  inviterName: string;
  role: string;
  url: string;
  expiresAt: Date;
}) {
  const inviter = displayName(opts.inviterName) ?? "A colleague";
  const html = layout(
    `Join ${opts.orgName} on theParse`,
    [
      p(`${opts.name ? `Hi ${esc(opts.name)}, ` : ""}${esc(inviter)} added you to <b>${esc(opts.orgName)}</b> on the theParse client portal as ${opts.role === "admin" ? "an <b>Admin</b>" : "a <b>Member</b>"}.`),
      button(opts.url, "Accept invite"),
      small(`This link works once and expires on <b>${esc(formatDate(opts.expiresAt))}</b>.`),
    ].join(""),
  );
  const text = `${inviter} added you to ${opts.orgName} on the theParse client portal.\n\nAccept: ${opts.url}\n\nExpires ${formatDate(opts.expiresAt)}.`;
  return sendEmail({ to: opts.to, subject: `Join ${opts.orgName} on the theParse client portal`, htmlContent: html, plainTextContent: text });
}

export async function sendSignInEmail(to: string, url: string) {
  const html = layout(
    "Sign in to the theParse portal",
    [button(url, "Sign in"), small("This link works once and expires in 24 hours. If you didn't ask to sign in, ignore this email.")].join(""),
  );
  const res = await sendEmail({
    to,
    subject: "Your theParse portal sign-in link",
    htmlContent: html,
    plainTextContent: `Sign in to the theParse portal: ${url}\n\nThis link expires in 24 hours.`,
  });
  if (!res.success) throw new Error(res.message);
}

export async function sendOnboardingConfirmation(to: string, name: string) {
  const html = layout(
    `Thanks, ${name}. You're all set`,
    [
      p("We've received your details and our team will review them shortly. You can follow progress in your portal at any time."),
      button(`${siteUrl()}/portal`, "Open your portal"),
      small(`To sign in later, go to ${esc(siteUrl())}/portal/signin and we'll email you a link.`),
    ].join(""),
  );
  return sendEmail({
    to,
    subject: "Welcome to the theParse client portal",
    htmlContent: html,
    plainTextContent: `We've received your details. Open your portal: ${siteUrl()}/portal`,
  });
}

/** Internal notification to theParse staff. `lines` are plain text and get escaped. */
export async function notifyStaff(subject: string, lines: string[], link?: { url: string; label: string }) {
  const to = notifyEmail();
  if (!to) {
    console.warn("⚠️ [Portal] No PORTAL_NOTIFY_EMAIL / ADMIN_EMAIL set; staff notification skipped:", subject);
    return;
  }
  const html = layout(subject, lines.map((l) => p(esc(l))).join("") + (link ? button(link.url, link.label) : ""));
  await sendEmail({ to, subject: `[Portal] ${subject}`, htmlContent: html, plainTextContent: [...lines, link?.url ?? ""].join("\n\n") });
}

/** Tells a client's owners/admins that a contract is waiting for their signature. */
export async function sendContractEmail(opts: { to: string[]; orgName: string; title: string; note?: string; url: string }) {
  if (!opts.to.length) return;
  const html = layout(
    "A contract is ready for you",
    [
      p(`theParse has shared <b>${esc(opts.title)}</b> with ${esc(opts.orgName)} on the client portal.`),
      opts.note ? quote("Note", opts.note) : "",
      p("Review it, sign it, and upload the signed copy from the Contracts page."),
      button(opts.url, "Review contract"),
    ].join(""),
  );
  const text = `theParse has shared "${opts.title}" with ${opts.orgName}.\n\n${opts.note ? `${opts.note}\n\n` : ""}Review and sign: ${opts.url}`;
  // One email per person, so recipients don't see each other's addresses.
  await Promise.all(opts.to.map((to) => sendEmail({ to, subject: `Contract to sign: ${opts.title}`, htmlContent: html, plainTextContent: text })));
}

/** Tells a client's owners/admins about a new invoice. */
export async function sendInvoiceEmail(opts: { to: string[]; orgName: string; number: string; amount: string; dueAt: Date; url: string }) {
  if (!opts.to.length) return;
  const html = layout(
    `Invoice ${opts.number}`,
    [
      p(`theParse has issued invoice <b>${esc(opts.number)}</b> to ${esc(opts.orgName)} for <b>${esc(opts.amount)}</b>, due on <b>${esc(formatDate(opts.dueAt))}</b>.`),
      button(opts.url, "View invoice"),
    ].join(""),
  );
  const text = `Invoice ${opts.number} for ${opts.amount}, due ${formatDate(opts.dueAt)}.\n\nView: ${opts.url}`;
  // One email per person, so recipients don't see each other's addresses.
  await Promise.all(opts.to.map((to) => sendEmail({ to, subject: `Invoice ${opts.number} from theParse`, htmlContent: html, plainTextContent: text })));
}
