'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';

interface SendEmailRequest {
  to: string;
  subject: string;
  htmlContent: string;
}

interface SendEmailResponse {
  success: boolean;
}

export default function Home() {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const handleSend = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('Sending...');

    try {
      const receiverEmail = process.env.NEXT_PUBLIC_RECEIVER_EMAIL || 'support@inbound.astrofinex.online';
      const backendUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${backendUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject,
          htmlContent: `
          <div style="background-color: #f4f6f8; padding: 30px 15px; font-family: Arial, sans-serif; color: #333333;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <tr>
                <td style="padding: 30px; line-height: 1.6;">
                  <!-- Main Message Content -->
                  <div style="font-size: 15px; color: #2d3748; margin-bottom: 25px;">
                    <p style="margin: 0 0 15px 0;">${message}</p>
                  </div>
                  
                  <!-- Divider Line -->
                  <hr style="border: none; border-top: 1px solid #edf2f7; margin: 20px 0;" />

                  <!-- Footer / Notice Section -->
                  <div style="font-size: 13px; color: #718096; line-height: 1.5;">
                    <p style="margin: 0;">Notice: Do not reply to this email. Send us a reply at ${receiverEmail}, We will get back to you as soon as possible.</p>
                  </div>
                </td>
              </tr>
            </table>
          </div>
          `,
        } satisfies SendEmailRequest),
      });

      const data: SendEmailResponse = await res.json();
      if (data.success) {
        setStatus('Email sent successfully!');
        setTo('');
        setSubject('');
        setMessage('');
      } else {
        setStatus('Failed to send email.');
      }
    } catch (err: unknown) {
      console.error(err);
      setStatus('An error occurred.');
    }
  };

  return (
    <main className="max-w-lg mx-auto p-8">
      <div className="flex justify-between items-center mb-6 gap-3">
        <h1 className="text-2xl font-bold pr-2.5">Client Email Portal</h1>
        <Link
          href="/inbox"
          className="bg-gray-100 hover:bg-gray-200 border px-3 py-1.5 rounded text-sm font-medium transition"
        >
          View Inbox →
        </Link>
      </div>

      <form onSubmit={handleSend} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Client Email</label>
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            className="w-full border p-2 rounded h-32"
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Send Email
        </button>
      </form>
      {status && <p className="mt-4 text-sm font-semibold">{status}</p>}
    </main>
  );
}