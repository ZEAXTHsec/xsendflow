'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, Sparkles, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import Logo from '@/components/ui/Logo';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback?next=/studio`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Google authentication failed');
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password || 'XSendFlow2026!SecurePass',
          options: {
            emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback?next=/studio`,
          },
        });
        if (error) throw error;
        setSuccessMsg('Check your inbox! We sent you an activation link to complete signup.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password || 'XSendFlow2026!SecurePass',
        });
        if (error) throw error;
        router.push('/studio');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden font-sans">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/15 to-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 right-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="max-w-6xl mx-auto w-full px-6 py-6 flex items-center justify-between z-10">
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <Logo size="lg" theme="dark" />
        </Link>
        <Link
          href="/"
          className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          ← Back to Overview
        </Link>
      </header>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto px-6 py-10 z-10">
        <div className="bg-[#0b101d]/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl shadow-black/60 relative">
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multi-Tenant Vault • Zero-Leak RLS</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {isSignUp ? 'Create your Studio Account' : 'Welcome back to XSendFlow'}
            </h1>
            <p className="text-xs text-slate-400">
              {isSignUp
                ? 'Launch high-deliverability cold email campaigns with AI Spintax'
                : 'Sign in to access your campaigns, warmups, and inboxes'}
            </p>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1-Click Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 shadow-md active:scale-95 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Or with Email</span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="alex@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[#070a13] border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Password</label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#070a13] border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : isSignUp ? 'Create Free Account' : 'Sign In to Studio'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Toggle between Sign In & Sign Up */}
          <div className="text-center mt-6 pt-6 border-t border-slate-800/60 text-xs text-slate-400">
            {isSignUp ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setErrorMsg(''); }}
                  className="text-cyan-400 font-bold hover:underline"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setErrorMsg(''); }}
                  className="text-cyan-400 font-bold hover:underline"
                >
                  Sign Up Free
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Security Badges */}
      <footer className="max-w-6xl mx-auto w-full px-6 py-6 text-center text-xs text-slate-500 z-10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> AES-256 Encrypted</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> PostgreSQL RLS Isolation</span>
        </div>
        <p>© 2026 XSendFlow Inc. All rights reserved.</p>
      </footer>
    </main>
  );
}
