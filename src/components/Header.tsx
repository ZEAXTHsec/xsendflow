'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Settings } from 'lucide-react';
import ProfileSettingsModal from './settings/ProfileSettingsModal';

export default function Header() {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const navLinks = [
    { href: '/features', label: 'Features' },
    { href: '/how-it-works', label: 'How it works' },
    { href: '/studio', label: 'AI Studio', isNew: true },
    { href: '/pricing', label: 'Pricing' },
    { href: '/changelog', label: 'Updates' },
    { href: '/faq', label: 'FAQ' },
    { href: '/coffee', label: '☕' },
  ];

  return (
    <>
      <nav className="glass-nav sticky top-0 z-50 w-full transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 flex items-center justify-center font-black text-white text-sm shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              X
            </div>
            <span className="font-extrabold text-base text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
              XSendFlow
            </span>
          </Link>

          {/* Center Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.isNew && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200">
                      AI
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Action Button & Settings */}
          <div className="flex items-center gap-2">
            <button
              data-testid="header-settings-btn"
              onClick={() => setSettingsOpen(true)}
              className="text-xs font-bold px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 flex items-center gap-1.5 transition-all active:scale-95"
              title="SMTP Accounts, API Keys & Settings"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Settings &amp; Senders</span>
            </button>

            <Link
              href="/studio"
              className="text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5 active:scale-95 glow-tag"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-200" />
              <span>Studio</span>
            </Link>
          </div>
        </div>
      </nav>

      <ProfileSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
