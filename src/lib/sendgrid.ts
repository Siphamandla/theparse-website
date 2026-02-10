import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const getFromAddress = () => {
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!fromEmail) {
    console.error("❌ [Resend] RESEND_FROM_EMAIL environment variable not set");
    throw new Error("Resend from email must be set as env var RESEND_FROM_EMAIL");
  }

  const fromName = process.env.RESEND_FROM_NAME;
  return fromName ? `${fromName} <${fromEmail}>` : fromEmail;
};

// Function to send email using Resend
async function sendEmail({
  to,
  cc = "",
  bcc = "",
  subject,
  plainTextContent,
  htmlContent,
  dynamicTemplateData,
  templateId,
  replyTo,
}: {
  to: string;
  cc?: string | string[];
  bcc?: string | string[];
  subject?: string;
  plainTextContent?: string;
  htmlContent?: string;
  dynamicTemplateData?: Record<string, unknown>;
  templateId?: string;
  replyTo?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("❌ [Resend] RESEND_API_KEY environment variable not set");
      throw new Error("Resend API key must be set as env var RESEND_API_KEY");
    }

    const from = getFromAddress();
    const hasContent = Boolean(subject && (plainTextContent || htmlContent));
    const fallbackSubject = "theParse Notification";
    const fallbackText = dynamicTemplateData
      ? `Hello,\n\nThis email uses dynamic template data:\n${JSON.stringify(dynamicTemplateData, null, 2)}`
      : "Hello,\n\nThis is a notification from theParse.";
    const fallbackHtml = dynamicTemplateData
      ? `<p>Hello,</p><p>This email uses dynamic template data:</p><pre>${JSON.stringify(dynamicTemplateData, null, 2)}</pre>`
      : "<p>Hello,</p><p>This is a notification from theParse.</p>";

    if (!hasContent && !(templateId && dynamicTemplateData)) {
      throw new Error("Either subject with content or template data must be provided");
    }

    await resend.emails.send({
      from,
      to,
      cc: cc || undefined,
      bcc: bcc || undefined,
      replyTo: replyTo || process.env.RESEND_FROM_EMAIL,
      subject: hasContent ? subject : fallbackSubject,
      text: hasContent ? plainTextContent : fallbackText,
      html: hasContent ? htmlContent : fallbackHtml,
    });

    return { success: true, message: "Email Sent" };
  } catch (error: unknown) {
    console.error("❌ [Email] Error sending email");
    if (error instanceof Error) {
      console.error("❌ [Email]", error.message);
    }
    const message =
      error instanceof Error ? error.message : "Unknown error sending email";
    return { success: false, message };
  }
}

export default sendEmail;