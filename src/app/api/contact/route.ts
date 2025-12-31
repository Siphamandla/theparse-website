import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb'; // Import the MongoDB client promise
import sendEmail from "@/lib/sendgrid"; // Ensure named export is correct

export async function POST(request: Request) {
  try {
    console.log('📧 [Contact API] Received contact form submission');
    
    const body = await request.json();
    const { email, name, message, products } = body;
    
    console.log('📧 [Contact API] Form data:', { name, email, bodyKeys: Object.keys(body) });

    const client = await clientPromise;  // Await the MongoDB client connection
    const db = client.db('theParse');
    const collection = db.collection('contacts-us');

    // Check if an email already exists in the database
    const existingUser = await collection.findOne({ email });

    if (existingUser) {
      // Return an error response if the email is already in use
      console.log('📧 [Contact API] Email already exists in database:', email);
      return NextResponse.json({ message: 'Email already exists' }, { status: 400 });
    }

    // Insert form data into MongoDB if no duplicate email is found
    console.log('📧 [Contact API] Inserting contact into MongoDB...');
    const result = await collection.insertOne(body);
    console.log('📧 [Contact API] MongoDB insert successful, ID:', result.insertedId);

    // Send email to company admin with all form details
    console.log('📧 [Contact API] Preparing to send email to company admin...');
    
    const adminEmail = process.env.THEPARSE_CONTACTUS_BCC || process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      throw new Error('No admin email configured');
    }
    
    console.log('📧 [Contact API] Email config:', {
      to: adminEmail,
      fromUser: { name, email },
      productsSelected: products,
    });
    
    const emailResponse = await sendEmail({
      to: adminEmail,
      cc: "",
      bcc: "",
      subject: `New Contact Form Submission from ${name}`,
      plainTextContent: generatePlainTextEmail({ name, email, message, products }),
      htmlContent: generateHtmlEmail({ name, email, message, products }),
    });
    
    console.log('📧 [Contact API] Email send response:', emailResponse);
    
    if (!emailResponse.success) {
      console.error('❌ [Contact API] Admin email failed:', emailResponse.message);
      // Don't throw - continue to send user confirmation even if admin email fails
    }

    // Send confirmation email to user
    console.log('📧 [Contact API] Preparing to send confirmation email to user...');
    
    const userConfirmationResponse = await sendEmail({
      to: email,
      cc: "",
      bcc: "",
      subject: 'We Received Your Inquiry - TheParse',
      plainTextContent: generateUserConfirmationEmail({ name, submissionId: result.insertedId.toString() }),
      htmlContent: generateUserConfirmationHtmlEmail({ name, submissionId: result.insertedId.toString() }),
    });
    
    console.log('📧 [Contact API] User confirmation email response:', userConfirmationResponse);
    
    if (!userConfirmationResponse.success) {
      console.error('❌ [Contact API] User confirmation email failed:', userConfirmationResponse.message);
    }

    // Return a success response
    console.log('📧 [Contact API] Form submission completed successfully');
    return NextResponse.json({ message: 'Form submitted successfully', result });
  } catch (error) {
    console.error('❌ [Contact API] Error submitting form:', error);
    if (error instanceof Error) {
      console.error('❌ [Contact API] Error message:', error.message);
      console.error('❌ [Contact API] Error stack:', error.stack);
    }
    return NextResponse.json({ message: 'Error submitting form', error }, { status: 500 });
  }
}

// Helper function to generate plain text email
function generatePlainTextEmail({ name, email, message, products }: any): string {
  const productsList = Array.isArray(products) && products.length > 0
    ? products.map((p: any) => `- ${p.label}`).join('\n')
    : 'No services selected';

  return `
New Contact Form Submission

Name: ${name}
Email: ${email}
Message: ${message}

Services Interested In:
${productsList}

---
This is an automated email from your contact form.
  `.trim();
}

// Helper function to generate HTML email
function generateHtmlEmail({ name, email, message, products }: any): string {
  const productsList = Array.isArray(products) && products.length > 0
    ? products.map((p: any) => `<li>${p.label}</li>`).join('')
    : '<li>No services selected</li>';

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; }
      .header { background-color: #007bff; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
      .content { background-color: white; padding: 20px; border-radius: 0 0 8px 8px; }
      .field { margin: 15px 0; }
      .label { font-weight: bold; color: #007bff; }
      .value { margin-left: 10px; color: #555; }
      ul { margin: 10px 0; padding-left: 20px; }
      li { margin: 5px 0; }
      .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2>New Contact Form Submission</h2>
      </div>
      <div class="content">
        <div class="field">
          <span class="label">Name:</span>
          <span class="value">${name}</span>
        </div>
        <div class="field">
          <span class="label">Email:</span>
          <span class="value"><a href="mailto:${email}">${email}</a></span>
        </div>
        <div class="field">
          <span class="label">Message:</span>
          <div class="value" style="margin-top: 10px; padding: 10px; background-color: #f0f0f0; border-left: 3px solid #007bff;">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>
        <div class="field">
          <span class="label">Services Interested In:</span>
          <ul>
            ${productsList}
          </ul>
        </div>
        <div class="footer">
          <p>This is an automated email from your contact form.</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `.trim();
}

// Helper function to generate user confirmation plain text email
function generateUserConfirmationEmail({ name, submissionId }: any): string {
  return `
Hello ${name},

Thank you for reaching out to TheParse! We've received your inquiry and our team will review it shortly.

Your Submission ID: ${submissionId}

We appreciate your interest and will get back to you as soon as possible with more information about how we can help with your project.

If you have any questions in the meantime, feel free to reply to this email.

Best regards,
The TheParse Team
  `.trim();
}

// Helper function to generate user confirmation HTML email
function generateUserConfirmationHtmlEmail({ name, submissionId }: any): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; }
      .header { background-color: #007bff; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
      .content { background-color: white; padding: 20px; border-radius: 0 0 8px 8px; }
      .message { font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 20px; }
      .submission-id { background-color: #f0f0f0; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; border-radius: 4px; }
      .submission-id-label { font-weight: bold; color: #007bff; display: block; margin-bottom: 5px; }
      .submission-id-value { font-family: monospace; font-size: 14px; color: #333; }
      .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2>Thank You for Your Inquiry!</h2>
      </div>
      <div class="content">
        <p class="message">Hello ${name},</p>
        
        <p class="message">
          Thank you for reaching out to <strong>TheParse</strong>! We've received your inquiry and our team will review it shortly.
        </p>

        <div class="submission-id">
          <span class="submission-id-label">Your Submission ID:</span>
          <span class="submission-id-value">${submissionId}</span>
        </div>

        <p class="message">
          We appreciate your interest and will get back to you as soon as possible with more information about how we can help with your project.
        </p>

        <p class="message">
          If you have any questions in the meantime, feel free to reply to this email.
        </p>

        <div class="footer">
          <p>Best regards,</p>
          <p><strong>The TheParse Team</strong></p>
          <p style="margin-top: 10px; color: #999;">This is an automated confirmation email. Please do not reply directly to this address.</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `.trim();
}