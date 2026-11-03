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
      const backendUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${backendUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject,
          htmlContent: `<p>${message}</p>`,
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Client Email Portal</h1>
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