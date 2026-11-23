'use client';
import Icon, { type IconName } from './Icon';
import { nativeSelectionHaptic } from '../lib/native';

export type TabKey = 'home' | 'focus' | 'rewards';

const TABS: { key: TabKey; label: string; icon: IconName }[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'focus', label: 'Focus', icon: 'focus' },
  { key: 'rewards', label: 'Rewards', icon: 'gift' },
];

const TabBar = ({
  active,
  onChange,
  disabled = false,
  badges = {},
}: {
  active: TabKey;
  onChange: (key: TabKey) => void;
  disabled?: boolean;
  badges?: Partial<Record<TabKey, boolean>>; // "something to claim" dots
}) => (
  <nav
    aria-label="Primary"
    className="guide-tabbar flex shrink-0 justify-center border-t border-slate-200/70 bg-white/90 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur-sm"
  >
    {/* Phones get the full-width bar; on tablets the same three targets stay
        grouped in the middle instead of drifting to opposite corners. */}
    <div className="flex w-full max-w-md items-center justify-around px-2">
      {TABS.map(t => {
        const isActive = active === t.key;
        const badge = badges[t.key] === true;
        return (
          <button
            key={t.key}
            onClick={() => {
              if (!disabled && active !== t.key) nativeSelectionHaptic();
              onChange(t.key);
            }}
            disabled={disabled}
            aria-current={isActive ? 'page' : undefined}
            aria-label={badge ? `${t.label} — reward ready to claim` : undefined}
            className={`flex min-h-11 flex-1 flex-col items-center gap-1 rounded-xl py-1.5 transition-[color,transform] active:scale-[0.97] ${
              isActive ? 'text-brand-600' : 'text-slate-400'
            } ${disabled ? 'opacity-50' : ''}`}
          >
            <span
              className={`relative flex h-8 w-12 items-center justify-center rounded-full transition-colors ${
                isActive ? 'bg-brand-50 ring-1 ring-brand-100' : ''
              }`}
            >
              {badge && (
                <span
                  aria-hidden
                  className="absolute right-2 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500"
                />
              )}
              <Icon
                name={t.icon}
                size={21}
                // Navigation is chrome, not an object: it takes the active
                // brand hue rather than the glyph's own identity colour.
                tone={isActive ? 'brand' : 'inherit'}
                className={isActive ? 'scale-110 transition-transform' : 'transition-transform'}
              />
            </span>
            <span className="text-[11px] font-semibold tracking-tight">
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  </nav>
);

export default TabBar;
