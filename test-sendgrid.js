/**
 * Quick test script to verify Resend connection
 * Run with: node test-sendgrid.js
 */

/* eslint-disable @typescript-eslint/no-require-imports */

require('dotenv').config({ path: '.env.local' });

const { Resend } = require('resend');

console.log('🔍 Testing Resend Configuration...\n');

// Check environment variables
console.log('1️⃣  Checking environment variables:');
console.log('   RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing');
console.log('   RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || '❌ Missing');
console.log('   RESEND_FROM_NAME:', process.env.RESEND_FROM_NAME || '❌ Missing');
console.log('   ADMIN_EMAIL:', process.env.ADMIN_EMAIL || '❌ Missing');

if (!process.env.RESEND_API_KEY) {
  console.error('\n❌ RESEND_API_KEY is not set. Cannot proceed.');
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || 'no-reply@theparse.co.za';
const fromName = process.env.RESEND_FROM_NAME || 'theParse Team';
const from = `${fromName} <${fromEmail}>`;

// Test email configuration
const msg = {
  to: process.env.ADMIN_EMAIL || 'admin@theparse.co.za',
  from,
  subject: '🧪 Resend Test Email',
  text: 'This is a test email from the Contact Form verification script.',
  html: '<strong>This is a test email from the Contact Form verification script.</strong>',
};

console.log('\n2️⃣  Attempting to send test email:');
console.log('   From:', msg.from);
console.log('   To:', msg.to);
console.log('   Subject:', msg.subject);

resend.emails
  .send({
    from: msg.from,
    to: msg.to,
    subject: msg.subject,
    text: msg.text,
    html: msg.html,
  })
  .then((response) => {
    console.log('\n✅ Test email sent successfully!');
    console.log('   Message ID:', response?.id || 'N/A');
    console.log('\n✅ Resend is working correctly. Check your email for the test message.');
  })
  .catch((error) => {
    console.error('\n❌ Failed to send test email:');
    console.error('   Error:', error?.message || error);
    process.exit(1);
  });
