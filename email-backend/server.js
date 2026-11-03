const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Resend } = require('resend');

const app = express();
app.use(cors());
app.use(express.json()); // Essential for parsing JSON bodies and incoming webhooks

const resend = new Resend(process.env.RESEND_API_KEY);
const PORT = process.env.PORT || 5000;

// 1. ROUTE: Send email to a client
app.post('/api/send-email', async (req, res) => {
  const { to, subject, htmlContent } = req.body;

  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Use your verified domain in production (e.g., mail@yourdomain.com)
      to: [to],
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      return res.status(400).json({ success: false, error });
    }

    return res.status(200).json({ success: true, data });

  } catch (err) {

    return res.status(500).json({ success: false, error: err.message });
  }
});

// 2. ROUTE: Receive inbound emails via Resend Webhook
app.post('/api/webhook/inbound', async (req, res) => {
  const event = req.body;

  // Check if the event type is an incoming email
  if (event.type === 'email.received') {
    const emailData = event.data;

    console.log('--- New Email Received ---');
    console.log(`From: ${emailData.from}`);
    console.log(`To: ${emailData.to}`);
    console.log(`Subject: ${emailData.subject}`);
    console.log(`Email ID: ${emailData.email_id}`);

    // TODO: Save this email data to your database (MongoDB, PostgreSQL, etc.)
  }

  // Always respond quickly with a 200 OK to acknowledge receipt to Resend
  return res.status(200).json({ received: true });
  
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});