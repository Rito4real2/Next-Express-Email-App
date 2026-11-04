'use client';
import { useEffect, useState } from 'react';

// Define TypeScript interface for the email object
interface Email {
  _id: string;
  emailId: string;
  from: string;
  to: string[];
  subject?: string;
  text?: string;
  htmlContent?: string;
  receivedAt: string;
}

export default function InboxPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6 gap-3">
        <h1 className="text-2xl font-bold pr-2.5">Client Inbox</h1>
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
              <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
                {email.text || email.htmlContent ? (
                  <p className="whitespace-pre-wrap">{email.text || 'HTML content received'}</p>
                ) : (
                  <p className="italic text-gray-400">Empty message body</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}