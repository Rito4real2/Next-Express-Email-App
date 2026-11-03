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
      from: 'support@astrofinex.online', // Use verified custom domain in production
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

// ROUTE: Inbound Webhook (Saves to MongoDB)
app.post('/api/webhook/inbound', async (req, res) => {
  const event = req.body;

  if (event.type === 'email.received') {
    const emailData = event.data;

    try {
      // Save incoming email to MongoDB database
      const newEmail = new Email({
        emailId: emailData.email_id,
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text || '',
        html: emailData.html || '',
      });

      await newEmail.save();

      console.log(`Saved email ${emailData.email_id} to MongoDB.`);
    } catch (dbErr) {
      console.error('Error saving email to database:', dbErr.message);
    }
  }

  // Acknowledge receipt to Resend immediately
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