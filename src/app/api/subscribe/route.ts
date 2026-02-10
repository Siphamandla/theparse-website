import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb'; // MongoDB connection
import sendEmail from "@/lib/sendgrid"; // Email sending functionality

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body; // Extract email from the request body

    const client = await clientPromise;  // Await MongoDB client connection
    const db = client.db('theParse');
    const collection = db.collection('subscribers');

    // Check if an email already exists in the database
    const existingUser = await collection.findOne({ email });

    if (existingUser) {
      // Return an error response if the email is already in use
      return NextResponse.json({ message: 'Email already exists' }, { status: 400 });
    }

    // Insert form data into MongoDB if no duplicate email is found
    const result = await collection.insertOne(body);

    // Send confirmation email after adding the subscriber
    await sendEmail({
      to: email,
      cc: "",
      bcc: process.env.THEPARSE_CONTACTUS_BCC || "", // Ensure BCC is available if required
      subject: "Welcome to theParse",
      plainTextContent: `Thanks for subscribing to theParse updates. We'll keep you posted on new insights, products, and events.`,
      htmlContent: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; }
      .header { background-color: #007bff; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
      .content { background-color: white; padding: 20px; border-radius: 0 0 8px 8px; }
      .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2>Welcome to theParse</h2>
      </div>
      <div class="content">
        <p>Thanks for subscribing to theparse updates. We'll keep you posted on new insights, products, and events.</p>
        <p>If you didn't request this, you can ignore this email.</p>
        <div class="footer">
          <p>Best regards,</p>
          <p><strong>The theParse Team</strong></p>
        </div>
      </div>
    </div>
  </body>
</html>
      `.trim(),
    });

    // Return a success response
    return NextResponse.json({ message: 'Details submitted successfully', result });
  } catch (error) {
    console.error('Error submitting form:', error);
    return NextResponse.json({ message: 'Error submitting form', error }, { status: 500 });
  }
}