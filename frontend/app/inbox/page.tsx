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

  // State to track which email is currently being replied to (stores the email _id)
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState<string>('');
  const [sendingStatus, setSendingStatus] = useState<string>('');

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
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6 gap-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            ← Back to Compose
          </Link>
          <h1 className="text-2xl font-bold">Client Inbox</h1>
        </div>
        <button
          onClick={fetchEmails}
          className="bg-gray-100 border px-3 py-1 rounded text-sm hover:bg-gray-200"
        >
          Refresh Inbox
        </button>
      </div>

      {loading ? (
        <p>Loading emails...</p>
      ) : emails.length === 0 ? (
        <p className="text-gray-500">No incoming emails found.</p>
      ) : (
        <div className="space-y-4">
          {emails.map((email) => (
            <div key={email._id} className="border rounded-lg p-4 shadow-sm bg-white">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>From: <strong>{email.from}</strong></span>
                <span>{new Date(email.receivedAt).toLocaleString()}</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                {email.subject || '(No Subject)'}
              </h2>
              <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border mb-3">
                {email.text || email.html ? (
                  <p className="whitespace-pre-wrap">{email.text || 'HTML content received'}</p>
                ) : (
                  <p className="italic text-gray-400">Empty message body</p>
                )}
              </div>

              {/* Reply Button & Inline Form */}
              {replyingToId !== email._id ? (
                <button
                  onClick={() => {
                    setReplyingToId(email._id);
                    setSendingStatus('');
                  }}
                  className="text-sm text-blue-600 font-medium hover:underline"
                >
                  Reply to Client ↩
                </button>
              ) : (
                <form
                  onSubmit={(e) => handleSendReply(e, email.from, email.subject)}
                  className="mt-3 border-t pt-3 space-y-3 bg-gray-50 p-3 rounded"
                >
                  <p className="text-xs text-gray-500">Replying to: <strong>{email.from}</strong></p>
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply here..."
                    required
                    className="w-full border p-2 rounded text-sm h-24 bg-white"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700"
                    >
                      Send Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyingToId(null)}
                      className="text-sm text-gray-600 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                  {sendingStatus && <p className="text-xs font-semibold text-gray-700">{sendingStatus}</p>}
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}