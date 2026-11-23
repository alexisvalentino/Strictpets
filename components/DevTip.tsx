'use client';
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import Icon from './Icon';

const STORAGE_KEY = 'focus-tracker:devtip';
const SHOW_CHANCE = 0.15; // 15% chance per app load
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // dismiss for 1 week
// App Store guidelines expect developer tips to go through In-App Purchase,
// so the external Ko-fi link is never shown in the iOS build.
const TIPS_ALLOWED = Capacitor.getPlatform() !== 'ios';

const DevTip = ({ enabled = true }: { enabled?: boolean }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!TIPS_ALLOWED) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const dismissedAt = raw ? Number(raw) : 0;
      const cooledDown = Date.now() - dismissedAt > COOLDOWN_MS;
      if (cooledDown && Math.random() < SHOW_CHANCE) {
        // slight delay so it doesn't flash on initial paint
        const t = window.setTimeout(() => setVisible(true), 2000);
        return () => window.clearTimeout(t);
      }
    } catch {
      // localStorage unavailable — never show
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch { /* noop */ }
  };

  if (!visible || !enabled) return null;

  return (
    <div className="pointer-events-auto fixed bottom-20 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 animate-slide-up md:left-auto md:right-6 md:translate-x-0">
      <div className="relative flex flex-col items-start gap-2 rounded-2xl border border-sky-200 bg-white px-4 py-3 pr-10 shadow-xl shadow-slate-900/15 ring-1 ring-black/5 sm:flex-row sm:items-center sm:gap-3 sm:pr-4">
        {/* close button */}
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors active:bg-slate-100 active:text-slate-600"
        >
          <Icon name="close" size={14} />
        </button>

        <a
          href="https://ko-fi.com/M6Y5258XR7"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 no-underline sm:flex-1"
        >
          <span className="text-brand-500">
            <Icon name="heart" size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-600">
              Enjoying Focus Tracker?
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              Buy the dev a coffee — it keeps the updates coming
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- external Ko-fi badge, not optimizable */}
          <img
            src="https://storage.ko-fi.com/cdn/kofi3.png?v=6"
            alt="Buy Me a Coffee at ko-fi.com"
            className="hidden h-8 shrink-0 sm:block"
          />
        </a>
      </div>

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translate(-50%, 16px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @media (min-width: 768px) {
          @keyframes slide-up {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        }
      `}</style>
    </div>
  );
};

export default DevTip;
