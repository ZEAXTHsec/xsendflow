'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, LogIn, ArrowRight, ShieldCheck, Cloud } from 'lucide-react';
import ProfileSettingsModal from './settings/ProfileSettingsModal';
import UpgradeProModal from './modals/UpgradeProModal';
import { createClient } from '@/lib/supabase/client';
import Logo from './ui/Logo';
import UserProfileMenu from './ui/UserProfileMenu';
import { UserPlan } from '@/lib/planLimits';

export default function Header() {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'billing' | 'senders' | 'api' | 'preferences'>('profile');
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<UserPlan>('free');

  const supabase = createClient();
  const isStudio = pathname?.startsWith('/studio');

  useEffect(() => {
    function checkUser() {
      try {
        const mockUserStr = typeof window !== 'undefined' ? localStorage.getItem('xsendflow_mock_user') : null;
        if (mockUserStr) {
          try {
            const parsed = JSON.parse(mockUserStr);
            setUserEmail(parsed.email || 'founder@xsendflow.com');
            setUserId(parsed.id || 'guest-founder');
            const savedPlan = (localStorage.getItem('xsendflow_user_plan') as UserPlan) || 'free';
            setUserPlan(savedPlan);
            return;
          } catch {}
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user?.email) {
            setUserEmail(session.user.email);
            setUserId(session.user.id);
            const savedPlan = (localStorage.getItem('xsendflow_user_plan') as UserPlan) || 'free';
            setUserPlan(savedPlan);
          } else {
            const localMock = typeof window !== 'undefined' ? localStorage.getItem('xsendflow_mock_user') : null;
            if (!localMock) {
              setUserEmail(null);
              setUserId(null);
            }
          }
        });
      } catch {
        // Fallback
      }
    }
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        setUserId(session.user.id);
      } else {
        const mockUserStr = typeof window !== 'undefined' ? localStorage.getItem('xsendflow_mock_user') : null;
        if (mockUserStr) {
          try {
            const parsed = JSON.parse(mockUserStr);
            setUserEmail(parsed.email || 'founder@xsendflow.com');
            setUserId(parsed.id || 'guest-founder');
            return;
          } catch {}
        }
        setUserEmail(null);
        setUserId(null);
      }
    });

    const handlePlanUpdate = () => {
      if (typeof window !== 'undefined') {
        const savedPlan = (localStorage.getItem('xsendflow_user_plan') as UserPlan) || 'free';
        setUserPlan(savedPlan);
        const mockUserStr = localStorage.getItem('xsendflow_mock_user');
        if (mockUserStr) {
          try {
            const parsed = JSON.parse(mockUserStr);
            setUserEmail(parsed.email);
            setUserId(parsed.id);
          } catch {}
        }
      }
    };
    window.addEventListener('xsendflow_plan_updated', handlePlanUpdate);
    window.addEventListener('xsendflow_user_updated', handlePlanUpdate);
    window.addEventListener('storage', handlePlanUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('xsendflow_plan_updated', handlePlanUpdate);
      window.removeEventListener('xsendflow_user_updated', handlePlanUpdate);
      window.removeEventListener('storage', handlePlanUpdate);
    };
  }, []);

  const navLinks = [
    { href: '/features', label: 'Features' },
    { href: '/how-it-works', label: 'How it works' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/changelog', label: 'Updates' },
    { href: '/faq', label: 'FAQ' },
  ];

  return (
    <>
      <nav className="glass-nav sticky top-0 z-50 w-full transition-all bg-white/90 backdrop-blur-xl border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Left: Brand / Studio Indicator */}
          <div className="flex items-center gap-3">
            <Link href="/" className="group hover:opacity-90 transition-opacity">
              <Logo size="md" />
            </Link>

            {isStudio && (
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 font-mono uppercase tracking-wider">Workspace</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-bold">
                  <Cloud className="w-3 h-3 text-cyan-600" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Cloud-Powered Active
                </span>
              </div>
            )}
          </div>

          {/* Center Nav Links (Hidden in Studio to eliminate workspace clutter) */}
          {!isStudio && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right Action: Smooth User Profile Menu OR Sign In Buttons */}
          <div className="flex items-center gap-2">
            {userEmail ? (
              <div className="flex items-center gap-2">
                {!isStudio && (
                  <Link
                    href="/studio"
                    className="text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5 active:scale-95 glow-tag mr-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                    <span>Launch Studio</span>
                  </Link>
                )}

                {/* Buttery-Smooth Unified User Profile Menu */}
                <UserProfileMenu
                  userEmail={userEmail}
                  userId={userId}
                  userPlan={userPlan}
                  onOpenSettings={(tab) => {
                    setSettingsTab(tab || 'profile');
                    setSettingsOpen(true);
                  }}
                  onOpenUpgrade={() => setIsUpgradeOpen(true)}
                  onExportBackup={() => {
                    const data = {
                      user: { email: userEmail, id: userId, plan: userPlan },
                      exportedAt: new Date().toISOString(),
                      campaigns: JSON.parse(localStorage.getItem('xsendflow_campaigns_v2') || '[]'),
                      senders: JSON.parse(localStorage.getItem('xsendflow_senders') || '[]')
                    };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `xsendflow_workspace_${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs font-bold px-3.5 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5 active:scale-95 glow-tag"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <ProfileSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialTab={settingsTab}
        userEmail={userEmail || undefined}
        userId={userId || undefined}
      />

      <UpgradeProModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        triggerReason="general"
        userEmail={userEmail || undefined}
        userId={userId || undefined}
      />
    </>
  );
}
