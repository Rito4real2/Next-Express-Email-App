'use client';
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';

interface Email {
  _id: string;
  emailId: string;
  from: string;
  to: string[];
  subject?: string;
  text?: string;
  html?: string;
  receivedAt: string;
}

export default function InboxPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState<string>('');
  const [sendingStatus, setSendingStatus] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEmails = async (): Promise<void> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/emails`);
      const data = await res.json();

      if (data.success) {
        setEmails(data.emails);
      }
    } catch (err) {
      console.error('Failed to fetch emails:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleDeleteEmail = async (id: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this email?')) return;

    setDeletingId(id);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/emails/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        setEmails((prevEmails) => prevEmails.filter((email) => email._id !== id));
      } else {
        alert('Failed to delete email.');
      }
    } catch (err) {
      console.error('Error deleting email:', err);
      alert('An error occurred while deleting the email.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSendReply = async (e: FormEvent<HTMLFormElement>, recipientEmail: string, originalSubject?: string) => {
    e.preventDefault();
    setSendingStatus('Sending reply...');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          subject: `Re: ${originalSubject || 'Client Inquiry'}`,
          htmlContent: `<p>${replyMessage}</p>`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSendingStatus('Reply sent successfully!');
        setReplyMessage('');
        setReplyingToId(null);
      } else {
        setSendingStatus('Failed to send reply.');
      }
    } catch (err) {
      console.error(err);
      setSendingStatus('An error occurred while replying.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white flex flex-col justify-between">
      {/* Header */}
      <header className="max-w-4xl mx-auto w-full px-6 py-6 flex justify-between items-center border-b border-white/10">
        <Link href="/" className="text-sm font-medium text-cyan-300 hover:text-white transition">
          ← Back to Home
        </Link>
        <button
          onClick={fetchEmails}
          className="bg-white/10 hover:bg-white/15 text-white text-sm font-semibold px-4 py-2 rounded-xl border border-white/10 transition"
        >
          Refresh Inbox 🔄
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto w-full px-6 py-10 flex-grow">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 to-indigo-300 bg-clip-text text-transparent">
            Client Inbox
          </h1>
          <span className="text-xs px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-semibold">
            {emails.length} Messages
          </span>
        </div>

        {loading ? (
          <p className="text-slate-400 text-center py-12">Loading emails...</p>
        ) : emails.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-slate-400">
            <p className="text-lg mb-2">No incoming emails found.</p>
            <p className="text-sm text-slate-500">Replies sent by clients to your subdomain webhook will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {emails.map((email) => (
              <div key={email._id} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-lg transition hover:border-cyan-500/30">
                <div className="flex flex-col sm:flex-row justify-between text-xs text-slate-400 mb-3 gap-1">
                  <span>From: <strong className="text-white">{email.from}</strong></span>
                  <span>{new Date(email.receivedAt).toLocaleString()}</span>
                </div>
                <h2 className="text-lg font-semibold text-cyan-200 mb-3">
                  {email.subject || '(No Subject)'}
                </h2>
                <div className="text-sm text-slate-300 bg-slate-900/50 p-4 rounded-xl border border-white/5 mb-4">
                  {email.text || email.html ? (
                    <p className="whitespace-pre-wrap">{email.text || 'HTML content received'}</p>
                  ) : (
                    <p className="italic text-slate-500">Empty message body</p>
                  )}
                </div>

                {/* Actions: Reply & Delete */}
                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  {replyingToId !== email._id ? (
                    <button
                      onClick={() => {
                        setReplyingToId(email._id);
                        setSendingStatus('');
                      }}
                      className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition"
                    >
                      Reply to Client ↩
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">Replying to client...</span>
                  )}

                  <button
                    onClick={() => handleDeleteEmail(email._id)}
                    disabled={deletingId === email._id}
                    className="text-sm text-rose-400 hover:text-rose-300 font-medium transition disabled:opacity-50"
                  >
                    {deletingId === email._id ? 'Deleting...' : 'Delete Email 🗑️'}
                  </button>
                </div>

                {/* Inline Reply Form */}
                {replyingToId === email._id && (
                  <form
                    onSubmit={(e) => handleSendReply(e, email.from, email.subject)}
                    className="mt-4 border-t border-white/10 pt-4 space-y-3 bg-slate-900/80 p-4 rounded-xl"
                  >
                    <p className="text-xs text-slate-400">Replying to: <strong className="text-white">{email.from}</strong></p>
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply here..."
                      required
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 h-28 resize-none"
                    />
                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-md transition"
                      >
                        Send Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => setReplyingToId(null)}
                        className="text-sm text-slate-400 hover:text-white transition"
                      >
                        Cancel
                      </button>
                    </div>
                    {sendingStatus && <p className="text-xs font-semibold text-cyan-300">{sendingStatus}</p>}
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        <p>© 2026 MailPortal. Live Client Inbox.</p>
      </footer>
    </div>
  );
}