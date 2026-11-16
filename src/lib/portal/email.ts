import "server-only";
import { socialLinksHtml, uniqueFooterMarker, withSocialText } from "@/lib/email-social";
import sendRawEmail from "@/lib/sendgrid";
import { notifyEmail, siteUrl } from "./config";
import { formatDate, formatDateTime } from "./format";

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
        ${uniqueFooterMarker()}
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
  // Naming the company keeps invites to different companies out of one Gmail thread.
  const subject = opts.company ? `${opts.company}: you're invited to the theParse client portal` : "You're invited to the theParse client portal";
  return sendEmail({ to: opts.to, subject, htmlContent: html, plainTextContent: text });
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

/** The sign-in email: a one-time code to type in, and the same sign-in as a link. */
export async function sendSignInEmail(to: string, url: string, code: string, codeMinutes: number) {
  const spaced = `${code.slice(0, 3)} ${code.slice(3)}`;
  const html = layout(
    "Sign in to the theParse portal",
    [
      p("Enter this code on the sign-in page:"),
      `<div style="margin:0 0 20px;padding:18px;border-radius:12px;background:#F7F8FC;border:1px solid #E3E8EF;text-align:center;font-family:'Courier New',Courier,monospace;font-size:32px;font-weight:bold;letter-spacing:8px;color:#121723">${esc(spaced)}</div>`,
      small(`The code expires in ${codeMinutes} minutes.`),
      p("Or sign in with one click:"),
      button(url, "Sign in"),
      small("The code and the link work once. Using either one cancels the other. The link expires in 24 hours. If you didn't ask to sign in, ignore this email. Never share this code with anyone."),
    ].join(""),
  );
  const res = await sendEmail({
    to,
    // The code in the subject means it can be read from the inbox notification.
    subject: `${code} is your theParse sign-in code`,
    htmlContent: html,
    plainTextContent: `Your theParse sign-in code: ${code}\n\nIt expires in ${codeMinutes} minutes.\n\nOr sign in with this link: ${url}\n\nThe code and the link work once. Never share this code with anyone.`,
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
export async function sendContractEmail(opts: { to: string[]; orgName: string; projectName?: string; title: string; note?: string; url: string }) {
  if (!opts.to.length) return;
  const html = layout(
    "A contract is ready for you",
    [
      p(`theParse has shared <b>${esc(opts.title)}</b>${opts.projectName ? ` for the <b>${esc(opts.projectName)}</b> project` : ""} with ${esc(opts.orgName)} on the client portal.`),
      opts.note ? quote("Note", opts.note) : "",
      p("To sign it, open it on the Contracts page, attach your signed copy, confirm you agree and type your full name."),
      button(opts.url, "Review and sign"),
    ].join(""),
  );
  const text = `theParse has shared "${opts.title}" with ${opts.orgName}.\n\n${opts.note ? `${opts.note}\n\n` : ""}Review and sign: ${opts.url}`;
  // One email per person, so recipients don't see each other's addresses.
  await Promise.all(opts.to.map((to) => sendEmail({ to, subject: `Contract to sign: ${opts.title}`, htmlContent: html, plainTextContent: text })));
}

/**
 * Confirms a signed contract to the client: the person who signed, plus their company's owners
 * and admins. Lists what was recorded, so they have a record of signing in their inbox.
 */
export async function sendContractSignedEmail(opts: {
  to: string[];
  orgName: string;
  title: string;
  projectName?: string;
  typedName: string;
  signedAt: Date;
  signedCopyName: string;
  url: string;
}) {
  if (!opts.to.length) return { sent: 0, failed: 0 };
  const when = formatDateTime(opts.signedAt);
  const html = layout(
    "Contract signed",
    [
      p(`<b>${esc(opts.title)}</b>${opts.projectName ? ` for the <b>${esc(opts.projectName)}</b> project` : ""} has been signed for ${esc(opts.orgName)}. Thank you.`),
      quote(
        "What we recorded",
        [`Signed by: ${opts.typedName}`, `Date and time: ${when}`, `Signed copy: ${opts.signedCopyName}`].join("\n"),
      ),
      p("You can open the contract and your signed copy at any time in the client portal. theParse will be in touch about next steps and invoicing."),
      button(opts.url, "View contract"),
      small("Didn't sign this? Reply to this email or contact info@theparse.co.za straight away."),
    ].join(""),
  );
  const text = `"${opts.title}"${opts.projectName ? ` (${opts.projectName})` : ""} has been signed for ${opts.orgName}.\n\nSigned by: ${opts.typedName}\nDate and time: ${when}\nSigned copy: ${opts.signedCopyName}\n\nView it: ${opts.url}\n\nDidn't sign this? Contact info@theparse.co.za straight away.`;
  // One email per person, so recipients don't see each other's addresses.
  const results = await Promise.all(
    opts.to.map((to) => sendEmail({ to, subject: `Signed: ${opts.title}`, htmlContent: html, plainTextContent: text })),
  );
  const sent = results.filter((r) => r.success).length;
  return { sent, failed: results.length - sent };
}

/** Tells a client's people that theParse has set up a project for them. */
export async function sendProjectEmail(opts: { to: string[]; orgName: string; name: string; description?: string; url: string }) {
  if (!opts.to.length) return { sent: 0, failed: 0 };
  const html = layout(
    "Your project is live",
    [
      p(`theParse has set up <b>${esc(opts.name)}</b> for ${esc(opts.orgName)} on the client portal.`),
      opts.description ? quote("About this project", opts.description) : "",
      p("You can follow its status and find its documents on the Projects page."),
      button(opts.url, "View project"),
    ].join(""),
  );
  const text = `theParse has set up "${opts.name}" for ${opts.orgName}.\n\n${opts.description ? `${opts.description}\n\n` : ""}View it: ${opts.url}`;
  const results = await Promise.all(
    opts.to.map((to) => sendEmail({ to, subject: `New project: ${opts.name}`, htmlContent: html, plainTextContent: text })),
  );
  const sent = results.filter((r) => r.success).length;
  return { sent, failed: results.length - sent };
}

/** Tells a client's owners/admins about a new invoice. */
export async function sendInvoiceEmail(opts: {
  to: string[];
  orgName: string;
  projectName?: string;
  /** The signed contract the invoice is billed under; its terms govern payment. */
  contractTitle: string;
  contractSignedAt?: Date;
  number: string;
  amount: string;
  dueAt: Date;
  url: string;
}) {
  const signed = opts.contractSignedAt ? `, signed on ${formatDate(opts.contractSignedAt)}` : "";
  if (!opts.to.length) return;
  const html = layout(
    `Invoice ${opts.number}`,
    [
      p(`theParse has issued invoice <b>${esc(opts.number)}</b> to ${esc(opts.orgName)}${opts.projectName ? ` for the <b>${esc(opts.projectName)}</b> project` : ""}: <b>${esc(opts.amount)}</b>, due on <b>${esc(formatDate(opts.dueAt))}</b>.`),
      p(`This invoice is payable as agreed in the terms of the contract <b>${esc(opts.contractTitle)}</b>${esc(signed)}.`),
      button(opts.url, "View invoice"),
    ].join(""),
  );
  const text = `Invoice ${opts.number}${opts.projectName ? ` (${opts.projectName})` : ""} for ${opts.amount}, due ${formatDate(opts.dueAt)}.\n\nThis invoice is payable as agreed in the terms of the contract "${opts.contractTitle}"${signed}.\n\nView: ${opts.url}`;
  // One email per person, so recipients don't see each other's addresses.
  await Promise.all(opts.to.map((to) => sendEmail({ to, subject: `Invoice ${opts.number} from theParse`, htmlContent: html, plainTextContent: text })));
}
