import sendgrid from "@sendgrid/mail";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY!); // Ensure API key is set, using TypeScript's non-null assertion

// Function to send email using SendGrid
async function sendEmail({
  to,
  cc = "",
  bcc = "",
  subject,
  plainTextContent,
  htmlContent,
  dynamicTemplateData,
  templateId,
}: {
  to: string;
  cc?: string | string[];
  bcc?: string | string[];
  subject?: string;
  plainTextContent?: string;
  htmlContent?: string;
  dynamicTemplateData?: any;
  templateId?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    // Ensure the Admin Email is set in environment variables
    if (!process.env.ADMIN_EMAIL) {
      console.error('❌ [SendGrid] ADMIN_EMAIL environment variable not set');
      throw new Error("Admin Email must be set as env var ADMIN_EMAIL");
    }

    let emailPayload: any = {
      from: process.env.ADMIN_EMAIL,
      replyTo: process.env.ADMIN_EMAIL,
      to,
      cc: cc ? cc : undefined,
      bcc: bcc ? bcc : undefined,
    };

    // Use template-based email if templateId is provided
    if (templateId && dynamicTemplateData) {
      emailPayload = {
        ...emailPayload,
        templateId,
        personalizations: [
          {
            to,
            cc: cc ? cc : undefined,
            bcc: bcc ? bcc : undefined,
            dynamicTemplateData: {
              ...dynamicTemplateData,
            },
          },
        ],
      };
    } else if (subject && (plainTextContent || htmlContent)) {
      // Use direct email content
      emailPayload = {
        from: process.env.ADMIN_EMAIL,
        replyTo: process.env.ADMIN_EMAIL,
        to: to,
        subject,
        text: plainTextContent,
        html: htmlContent,
      };
      // Only add cc/bcc if they have values
      if (cc && cc !== "") emailPayload.cc = cc;
      if (bcc && bcc !== "") emailPayload.bcc = bcc;
    } else {
      throw new Error('Either templateId with dynamicTemplateData or subject with content must be provided');
    }

    // Send the email using SendGrid
    const response = await sendgrid.send(emailPayload);
    
    console.log('✅ [Email] Sent successfully');

    return { success: true, message: "Email Sent" };
  } catch (error: any) {
    console.error("❌ [Email] Error sending email");
    if (error.response) {
      console.error("❌ [Email] Status:", error.response.statusCode);
    } else if (error instanceof Error) {
      console.error("❌ [Email]", error.message);
    }
    return { success: false, message: error.message || 'Unknown error sending email' };
  }
}

export default sendEmail;