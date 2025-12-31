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
    console.log('📧 [SendGrid] Starting email send process...');
    
    // Ensure the Admin Email is set in environment variables
    if (!process.env.ADMIN_EMAIL) {
      console.error('❌ [SendGrid] ADMIN_EMAIL environment variable not set');
      throw new Error("Admin Email must be set as env var ADMIN_EMAIL");
    }
    
    console.log('📧 [SendGrid] Admin email configured:', process.env.ADMIN_EMAIL);
    console.log('📧 [SendGrid] API Key set:', !!process.env.SENDGRID_API_KEY);
    console.log('📧 [SendGrid] Using template:', templateId ? 'Yes' : 'No');
    console.log('📧 [SendGrid] Subject:', subject || 'N/A');

    let emailPayload: any = {
      from: process.env.ADMIN_EMAIL,
      replyTo: process.env.ADMIN_EMAIL,
      to,
      cc: cc ? cc : undefined,
      bcc: bcc ? bcc : undefined,
    };

    // Use template-based email if templateId is provided
    if (templateId && dynamicTemplateData) {
      console.log('📧 [SendGrid] Sending template-based email');
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
      console.log('📧 [SendGrid] Sending direct content email');
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
    
    // Build log object with only defined values
    const logPayload: any = {
      from: emailPayload.from,
      to: emailPayload.to,
    };
    if (emailPayload.cc) logPayload.cc = emailPayload.cc;
    if (emailPayload.bcc) logPayload.bcc = emailPayload.bcc;
    if (emailPayload.subject) logPayload.subject = emailPayload.subject;
    if (emailPayload.templateId) logPayload.templateId = emailPayload.templateId;
    if (emailPayload.html) logPayload.hasHtml = true;
    if (emailPayload.text) logPayload.hasText = true;
    
    console.log('📧 [SendGrid] Email payload:', logPayload);

    // Send the email using SendGrid
    const response = await sendgrid.send(emailPayload);
    
    console.log('✅ [SendGrid] Email sent successfully');
    console.log('📧 [SendGrid] Response status:', response[0].statusCode);
    console.log('📧 [SendGrid] Message ID:', response[0].headers['x-message-id']);

    return { success: true, message: "Email Sent" };
  } catch (error: any) {
    console.error("❌ [SendGrid] Error sending email:", error);
    if (error.response) {
      console.error("❌ [SendGrid] SendGrid error status:", error.response.statusCode);
      console.error("❌ [SendGrid] SendGrid error body:", JSON.stringify(error.response.body, null, 2));
    }
    if (error instanceof Error) {
      console.error("❌ [SendGrid] Error message:", error.message);
    }
    return { success: false, message: error.message || 'Unknown error sending email' };
  }
}

export default sendEmail;