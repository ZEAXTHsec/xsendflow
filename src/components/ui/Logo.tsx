import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

export function LogoIcon({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14'
  };

  return (
    <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#0c1024] via-[#161b38] to-[#1e1435] border border-indigo-500/30 shadow-lg shadow-indigo-500/20 overflow-hidden shrink-0 ${sizeMap[size]} ${className}`}>
      {/* Glow background accent */}
      <div className="absolute -top-1 -right-1 w-6 h-6 bg-cyan-400/20 rounded-full blur-xs pointer-events-none" />
      <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-indigo-500/20 rounded-full blur-xs pointer-events-none" />

      {/* Futuristic X-Send Vector */}
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[70%] h-[70%] drop-shadow-[0_2px_8px_rgba(99,102,241,0.5)]"
      >
        <defs>
          <linearGradient id="xsend-grad-1" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366f1" />
            <stop offset="0.5" stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="xsend-grad-2" x1="28" y1="4" x2="4" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38bdf8" />
            <stop offset="0.5" stopColor="#6366f1" />
            <stop offset="1" stopColor="#a855f7" />
          </linearGradient>
        </defs>

        {/* Dynamic X Left-to-Right diagonal */}
        <path
          d="M7 6L25 26"
          stroke="url(#xsend-grad-1)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Dynamic X Right-to-Left diagonal fusing into a send arrowhead */}
        <path
          d="M25 6L7 26"
          stroke="url(#xsend-grad-2)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Supersonic Arrowhead vector at top right */}
        <path
          d="M17 6H25V14"
          stroke="#38bdf8"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pulse center core dot */}
        <circle cx="16" cy="16" r="2.2" fill="#38bdf8" className="animate-pulse" />
      </svg>
    </div>
  );
}

export default function Logo({ size = 'md', showText = true, theme = 'auto', className = '' }: LogoProps) {
  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <LogoIcon size={size} />
      {showText && (
        <span className={`font-black tracking-tight leading-none ${textSizes[size]}`}>
          <span className={theme === 'dark' ? 'text-white' : 'text-slate-950'}>
            XSend
          </span>
          <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
            Flow
          </span>
        </span>
      )}
    </div>
  );
}
