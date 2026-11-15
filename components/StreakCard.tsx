'use client';
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
  bestStreak: number;
  shields: number; // 0 or 1 — a shield covers one missed day
  repairableStreak: number; // days recoverable by the paid repair (0 = none)
  coins: number;
  canBuyShield: boolean;
  onBuyShield: () => void;
  onRepair: () => void;
}

const StreakCard = ({
  streak,
  bestStreak,
  shields,
  repairableStreak,
  coins,
  canBuyShield,
  onBuyShield,
  onRepair,
}: StreakCardProps) => {
  const hasShield = shields > 0;
  const repairing = repairableStreak > 0;
  const affordable = coins >= STREAK_FREEZE_COST;

  return (
    <section className="mt-3 w-full rounded-2xl border border-slate-200/70 bg-white p-4 text-left shadow-sm">
      <header className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 text-slate-500">
          <Icon name="shield" size={16} plate tone="sky" />
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-widest">
              Streak protection
            </h2>
            <p className="text-[10px] font-semibold text-slate-400">
              {hasShield
                ? 'A shield is up — it covers one missed day'
                : 'Protect the chain before you break it'}
            </p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-[10px] font-black tabular-nums text-orange-700 ring-1 ring-orange-100">
          <Icon name="trophy" size={11} />
          best {bestStreak}d
        </span>
      </header>

      {/* Only the state of the shield lives here: the streak count itself is
          already the headline of the hero band above, and saying it twice on
          one screen made the page feel like it was stuttering. */}
      <div className="mt-3 flex items-center gap-2">
        <span
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
            hasShield
              ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-100'
              : 'bg-slate-50 text-slate-400 ring-1 ring-slate-100'
          }`}
        >
          <Icon name="shield" size={12} tone={hasShield ? 'sky' : 'slate'} />
          {hasShield ? 'shield up' : 'no shield'}
        </span>
        {streak > 0 && (
          <span className="text-[11px] font-semibold text-slate-400">
            {streak} day{streak === 1 ? '' : 's'} on the line
          </span>
        )}
      </div>

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
            className={`mt-2 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black uppercase tracking-wide transition-transform active:scale-95 ${
              coins >= STREAK_REPAIR_COST
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
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
        <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-sky-50 px-2.5 py-2 text-[11px] font-bold text-sky-700">
          <Icon name="check" size={12} tone="sky" />
          Covered — one missed day will not break the chain.
        </p>
      )}

      {!repairing && !hasShield && canBuyShield && (
        <button
          onClick={onBuyShield}
          disabled={!affordable}
          className={`mt-3 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black uppercase tracking-wide transition-transform active:scale-95 ${
            affordable
              ? 'bg-gradient-to-r from-sky-500 to-brand-600 text-white shadow-md shadow-brand-600/25'
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
        <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
          <Icon name="lock" size={11} tone="slate" />
          {streak > 0
            ? 'A shield can only be added before a day is missed.'
            : 'Focus once to start a streak — then it can be protected.'}
        </p>
      )}
    </section>
  );
};

export default StreakCard;
