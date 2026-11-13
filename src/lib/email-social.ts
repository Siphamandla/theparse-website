import { linkedinUrl } from "@/data/site";

/**
 * Social links for every outgoing email.
 *
 * The LinkedIn icon is drawn in HTML (a blue "in" tile), not an image, so it still
 * shows when the email app blocks images and needs nothing hosted. Inline styles
 * and a layout table only, because that's what email apps (Gmail, Outlook) support.
 */
export function socialLinksHtml(align: "left" | "center" = "left") {
  const url = linkedinUrl.replace(/"/g, "&quot;");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"${align === "center" ? ' align="center"' : ""} style="margin:${align === "center" ? "0 auto" : "0"};border-collapse:collapse">
  <tr>
    <td style="padding:0 8px 0 0;vertical-align:middle">
      <a href="${url}" target="_blank" rel="noopener noreferrer" title="theParse on LinkedIn" style="display:inline-block;width:24px;height:24px;line-height:24px;border-radius:5px;background:#0A66C2;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;text-align:center;text-decoration:none">in</a>
    </td>
    <td style="vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-size:13px">
      <a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#0A66C2;font-weight:bold;text-decoration:none">Follow theParse on LinkedIn</a>
    </td>
  </tr>
</table>`;
}

/** The same links for plain-text emails. */
export const socialLinksText = () => `Follow theParse on LinkedIn: ${linkedinUrl}`;

/** Appends the social links to a plain-text email body. */
export const withSocialText = (text: string) => `${text.trimEnd()}\n\n--\n${socialLinksText()}`;
