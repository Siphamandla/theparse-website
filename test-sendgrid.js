/**
 * Quick test script to verify SendGrid connection
 * Run with: node test-sendgrid.js
 */

require('dotenv').config({ path: '.env.local' });

const sgMail = require('@sendgrid/mail');

console.log('🔍 Testing SendGrid Configuration...\n');

// Check environment variables
console.log('1️⃣  Checking environment variables:');
console.log('   SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Missing');
console.log('   ADMIN_EMAIL:', process.env.ADMIN_EMAIL || '❌ Missing');

if (!process.env.SENDGRID_API_KEY) {
  console.error('\n❌ SENDGRID_API_KEY is not set. Cannot proceed.');
  process.exit(1);
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Test email configuration
const msg = {
  to: process.env.ADMIN_EMAIL || 'admin@theparse.co.za',
  from: process.env.ADMIN_EMAIL || 'no-reply@theparse.co.za',
  subject: '🧪 SendGrid Test Email',
  text: 'This is a test email from the Contact Form verification script.',
  html: '<strong>This is a test email from the Contact Form verification script.</strong>',
};

console.log('\n2️⃣  Attempting to send test email:');
console.log('   From:', msg.from);
console.log('   To:', msg.to);
console.log('   Subject:', msg.subject);

sgMail
  .send(msg)
  .then((response) => {
    console.log('\n✅ Test email sent successfully!');
    console.log('   Status:', response[0].statusCode);
    console.log('   Message ID:', response[0].headers['x-message-id']);
    console.log('\n✅ SendGrid is working correctly. Check your email for the test message.');
  })
  .catch((error) => {
    console.error('\n❌ Failed to send test email:');
    if (error.response) {
      console.error('   Status:', error.response.statusCode);
      console.error('   Error:', JSON.stringify(error.response.body, null, 2));
    } else {
      console.error('   Error:', error.message);
    }
    process.exit(1);
  });
