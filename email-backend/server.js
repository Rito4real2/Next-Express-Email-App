const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
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

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
  attachments: [{
    filename: String,
    url: String,       // Cloudinary secure URL
    publicId: String,  // Cloudinary public ID for deletion/management
    contentType: String,
  }],
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

// ROUTE: Inbound Webhook (Fetches full body, uploads attachments to Cloudinary, & saves to MongoDB)
app.post('/api/webhook/inbound', async (req, res) => {
  const event = req.body;

  if (event.type === 'email.received') {
    const emailData = event.data;
    const emailId = emailData.email_id;

    try {
      // 1. Fetch the full email content (text, html, attachments metadata) from Resend
      const { data: fullEmail, error } = await resend.emails.receiving.get(emailId);

      if (error) {
        console.error('Failed to fetch full email content from Resend:', error);
        if (!res.headersSent) {
          return res.status(400).json({ success: false, error });
        }
        return;
      }

      // 2. Process and upload any attachments to Cloudinary
      const uploadedAttachments = [];
      const rawAttachments = fullEmail.attachments || [];

      for (const att of rawAttachments) {
        try {
          // Fetch binary buffer for each attachment from Resend
          const { data: attData, error: attError } = await resend.emails.receiving.attachments.get({
            id: att.id,
            emailId: emailId,
          });

          if (attError || !attData) {
            console.error(`Failed to fetch attachment ${att.filename}:`, attError);
            continue;
          }

          // Convert attachment content to a base64 Data URI for Cloudinary upload
          const fileBuffer = Buffer.from(attData.content, 'base64');
          const fileUri = `data:${att.content_type || 'application/octet-stream'};base64,${fileBuffer.toString('base64')}`;

          // Upload to Cloudinary
          const uploadResult = await cloudinary.uploader.upload(fileUri, {
            folder: 'email_attachments',
            resource_type: 'auto', // Automatically detects images, PDFs, raw files
            public_id: `${emailId}_${att.filename.replace(/\.[^/.]+$/, "")}`, // Clean public ID
          });

          uploadedAttachments.push({
            filename: att.filename,
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            contentType: att.content_type || 'application/octet-stream',
          });

          console.log(`Uploaded attachment ${att.filename} to Cloudinary successfully.`);
        } catch (uploadErr) {
          console.error(`Error uploading attachment ${att.filename} to Cloudinary:`, uploadErr.message);
        }
      }

      // 3. Save the complete email details and attachments to MongoDB
      const newEmail = new Email({
        emailId: emailId,
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        text: fullEmail.text || '',  
        html: fullEmail.html || '',  
        attachments: uploadedAttachments,
      });

      await newEmail.save();
      console.log(`Successfully fetched and saved email ${emailId} with ${uploadedAttachments.size || uploadedAttachments.length} attachments to MongoDB.`);

      // 4. Automatically send an notification email back to admin
      const adminEmail = process.env.ADMIN_EMAIL || 'ritolaikpo@gmail.com';
      const { error: sendError } = await resend.emails.send({
        from: 'info@supportcoinbasehelp.online',
        to: adminEmail,
        subject: `Re: ${emailData.subject || 'You received a message in your inbox'}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <p>You just received a message from ${emailData.from} with ${uploadedAttachments.length} attachment(s). You can view and reply from your inbox.</p>
            <p style="color: #718096; font-size: 12px; margin-top: 20px;">— Client Support Team</p>
          </div>
        `,
      });

      if (sendError) {
        console.error('Failed to send notification email:', sendError);
      }

    } catch (dbErr) {
      console.error('Error processing inbound webhook:', dbErr.message);
    }
  }

  // Always respond with a 200 OK immediately to acknowledge receipt
  if (!res.headersSent) {
    return res.status(200).json({ received: true });
  }
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

// ROUTE: Delete an Email by ID
app.delete('/api/emails/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedEmail = await Email.findByIdAndDelete(id);

    if (!deletedEmail) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    console.log(`Successfully deleted email ${id} from MongoDB.`);
    return res.status(200).json({ success: true, message: 'Email deleted successfully' });
  } catch (err) {
    console.error('Error deleting email:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});