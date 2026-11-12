/** Client portal limits and settings, in one place. */

export const DB_NAME = "theParse";

/** Default lifetime of an invite link. Admins can pick another per invite. */
export const INVITE_DAYS_DEFAULT = 7;
export const INVITE_DAY_OPTIONS = [3, 7, 14] as const;

/** People per client organisation, including the owner and pending invites. */
export const MAX_TEAM_SIZE = 10;

/** Onboarding attachments. */
export const MAX_ATTACHMENTS = 5;
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
/** Client documents uploaded by theParse staff. */
export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.ms-powerpoint": "PPT",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
  "image/png": "PNG",
  "image/jpeg": "JPG",
};

/** Session length for portal users (also used when onboarding signs someone in). */
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/** A client can ask for a fresh invite link at most once per this many minutes. */
export const REREQUEST_COOLDOWN_MINUTES = 60;

/** Public base URL used in emails, e.g. https://theparse.co.za */
export function siteUrl() {
  return (process.env.AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

/** theParse staff emails (comma separated) that get admin access. */
export function adminEmails(): string[] {
  return (process.env.PORTAL_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Where staff notifications go: PORTAL_NOTIFY_EMAIL, else ADMIN_EMAIL. */
export function notifyEmail(): string | undefined {
  return process.env.PORTAL_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || undefined;
}
