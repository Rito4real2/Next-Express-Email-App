'use client';
import React from 'react';
import Link from 'next/link';


const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white flex flex-col justify-between">
      {/* Header / Navbar */}
      <header className="max-w-6xl mx-auto w-full px-6 py-6 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 font-bold text-lg">
            ✉️
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
            MailPortal
          </span>
        </div>
        <nav className="flex items-center gap-4">
          <Link
            href="/inbox"
            className="text-sm font-medium text-cyan-300 hover:text-white transition"
          >
            View Inbox
          </Link>
          <Link
            href="/coinbase"
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-cyan-500/25 transition transform hover:-translate-y-0.5"
          >
            Launch App
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-16 text-center flex-grow flex flex-col justify-center items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-6 tracking-wide uppercase">
          🚀 Next.js & Express Full-Stack Powered
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
          Welcome to the <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Client Email Portal
          </span>
        </h1>
        
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mb-10 leading-relaxed">
          A seamless communication platform built with Next.js and Express. Dispatch professional transactional templates and manage incoming client replies effortlessly in real time.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center mb-16">
          <Link
            href="/coinbase"
            className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl shadow-xl shadow-cyan-500/30 transition transform hover:-translate-y-0.5 text-center"
          >
            Send Coinbase Emails →
          </Link>
          <Link
            href="/inbox"
            className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-white font-semibold px-8 py-3.5 rounded-xl border border-white/10 backdrop-blur-md transition text-center"
          >
            Open Live Inbox
          </Link>
        </div>

        {/* Features Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm hover:border-cyan-500/40 transition">
            <div className="text-2xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold mb-2 text-cyan-200">Coinbase Dispatch</h3>
            <p className="text-sm text-slate-400">
              Send customized, styled transactional emails directly to clients through secure backend routing.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm hover:border-indigo-500/40 transition">
            <div className="text-2xl mb-3">📥</div>
            <h3 className="text-lg font-semibold mb-2 text-indigo-200">Live Client Inbox</h3>
            <p className="text-sm text-slate-400">
              Capture incoming webhooks via Resend and persist client messages securely in MongoDB.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm hover:border-purple-500/40 transition">
            <div className="text-2xl mb-3">↩️</div>
            <h3 className="text-lg font-semibold mb-2 text-purple-200">Instant Thread Replies</h3>
            <p className="text-sm text-slate-400">
              Reply back to client inquiries seamlessly right from your customized dashboard.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} MailPortal. Built with Next.js, Express, and Resend.</p>
      </footer>
    </div>
  );
};

export default LandingPage;