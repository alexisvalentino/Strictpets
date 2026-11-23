'use client';
import { useState } from 'react';
import Icon from './Icon';
import { STREAK_FREEZE_COST, STREAK_REPAIR_COST } from '../lib/gameState';

// One card answers every question about losing the streak, because the shield
// and the repair are the same decision seen from two sides: pay before a miss,
// or pay after one. They used to be two stacked cards that each offered a
// different price for the same thing and could contradict each other.
//
// Exactly one action is ever offered — the one that is actually available now:
//   repair (amber)  > shield held (sky) > buy a shield (sky) > nothing.
export interface StreakCardProps {
  streak: number; // days currently held (0 when the streak has lapsed)
  shields: number; // 0 or 1 — a shield covers one missed day
  repairableStreak: number; // days recoverable by the paid repair (0 = none)
  coins: number;
  canBuyShield: boolean;
  tone?: 'light' | 'brand' | 'glass';
  onBuyShield: () => void;
  onRepair: () => void;
}

const StreakCard = ({
  streak,
  shields,
  repairableStreak,
  coins,
  canBuyShield,
  tone = 'light',
  onBuyShield,
  onRepair,
}: StreakCardProps) => {
  const hasShield = shields > 0;
  const repairing = repairableStreak > 0;
  const affordable = coins >= STREAK_FREEZE_COST;
  const [expanded, setExpanded] = useState(repairing);
  const detailsOpen = expanded || repairing;
  const status = repairing ? 'Repair available' : hasShield ? 'Shield up' : 'No shield';
  const onBrand = tone === 'brand';
  const onGlass = tone === 'glass';

  return (
      <section className={onBrand ? 'mt-3 w-full border-t border-white/25 pt-2 text-left' : onGlass ? 'mt-3 w-full border-t border-sky-200/80 pt-2 text-left' : 'mt-3 w-full guide-panel rounded-2xl border border-slate-200/70 bg-white p-4 text-left shadow-sm'}>
      <h2>
        <button
          type="button"
          disabled={repairing}
          onClick={() => setExpanded(value => !value)}
          aria-expanded={detailsOpen}
          aria-controls="streak-protection-details"
          className="flex min-h-11 w-full items-center gap-2.5 text-left"
        >
          <Icon name="shield" size={18} className={onBrand ? 'text-white' : 'text-brand-600'} />
          <span className={`min-w-0 flex-1 text-sm font-bold tracking-tight ${onBrand ? 'text-white' : 'text-slate-800'}`}>Streak protection</span>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${repairing ? 'bg-amber-50 text-amber-700' : onBrand ? 'bg-black/10 text-white' : hasShield ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-600'}`}>
            {status}
          </span>
          {!repairing && <Icon name={detailsOpen ? 'chevronDown' : 'chevronRight'} size={15} className={onBrand ? 'text-white' : 'text-slate-400'} />}
        </button>
      </h2>

      <div id="streak-protection-details" className="disclosure-reveal" hidden={!detailsOpen}>
      {repairing && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-2.5">
          <p className="flex items-start gap-1.5 text-[11px] font-semibold leading-relaxed text-slate-600">
            <Icon name="paw" size={13} tone="amber" className="mt-0.5 shrink-0" />
            <span>
              You skipped a day. Repair it before you focus, or the next session
              starts again from Day 1.
            </span>
          </p>
          <button
            onClick={onRepair}
            disabled={coins < STREAK_REPAIR_COST}
            className={`mt-2 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-transform active:scale-95 ${
              coins >= STREAK_REPAIR_COST
                ? 'bg-amber-700 text-white shadow-sm shadow-amber-700/30'
                : 'cursor-not-allowed bg-slate-100 text-slate-400'
            }`}
          >
            {coins >= STREAK_REPAIR_COST ? (
              <>
                Repair {repairableStreak}-day streak
                <span className="tabular-nums">· {STREAK_REPAIR_COST}</span>
                <Icon name="coin" size={12} />
              </>
            ) : (
              <>
                Repair needs {STREAK_REPAIR_COST}
                <Icon name="coin" size={12} /> (you have {coins})
              </>
            )}
          </button>
        </div>
      )}

      {!repairing && hasShield && (
        <p className={`mt-3 flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] font-bold ${onBrand ? 'bg-black/10 text-white' : 'bg-sky-50 text-sky-700'}`}>
          <Icon name="check" size={12} className={onBrand ? 'text-white' : 'text-sky-700'} />
          Covered — one missed day will not break the chain.
        </p>
      )}

      {!repairing && !hasShield && canBuyShield && (
        <button
          onClick={onBuyShield}
          disabled={!affordable}
          className={`mt-3 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-transform active:scale-95 ${
            affordable
              ? 'bg-gradient-to-r from-brand-700 to-sky-700 text-white shadow-md shadow-brand-700/25'
              : 'cursor-not-allowed bg-slate-100 text-slate-400'
          }`}
        >
          <Icon name="shield" size={13} tone="inherit" />
          {affordable ? (
            <>
              Add a shield
              <span className="tabular-nums">· {STREAK_FREEZE_COST}</span>
              <Icon name="coin" size={12} tone="inherit" />
            </>
          ) : (
            <>
              Shield needs {STREAK_FREEZE_COST}
              <Icon name="coin" size={12} tone="inherit" /> (you have {coins})
            </>
          )}
        </button>
      )}

      {/* Nothing is purchasable: say why, in one short line. */}
      {!repairing && !hasShield && !canBuyShield && (
        <p className={`mt-3 text-[11px] font-semibold ${onBrand ? 'text-white' : 'text-slate-600'}`}>
          {streak > 0
            ? 'A shield can only be added before a day is missed.'
          : 'Focus once to start a streak — then it can be protected.'}
        </p>
      )}
      </div>
    </section>
  );
};

export default StreakCard;
