'use client';
import Icon from './Icon';
import Mascot from './Mascot';
import {
  MASCOT_CATALOG,
  petProgress,
  petRemainingText,
  type AccessoryId,
  type MascotId,
  type PetInfo,
  type PetStats,
} from '../lib/gameState';

const MascotCard = ({
  streak,
  petName,
  mascot = 'bear',
  accessory = null,
  nextPet = null,
  stats,
  ownedCount,
}: {
  streak: number;
  petName: string;
  mascot?: MascotId;
  accessory?: AccessoryId | null;
  nextPet?: PetInfo | null; // closest locked pet, null when all are unlocked
  stats: PetStats;
  ownedCount: number;
}) => {
  const progress = nextPet ? petProgress(stats, nextPet) : null;
  const pct = progress
    ? Math.min(100, Math.floor((progress.current / progress.target) * 100))
    : 100;
  return (
    <section className="mt-4 w-full rounded-2xl border border-slate-200/70 bg-white p-4 text-left shadow-sm">
      <div className="flex items-center gap-4">
        <Mascot
          mood="idle"
          variant={mascot}
          accessory={accessory}
          className="h-20 w-20 shrink-0"
        />
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-900">{petName}</p>
          {/* The streak is the hero band's headline; this card is about the pet
              you are focusing with, so it never repeats the number. */}
          <p className="mt-1 flex items-start gap-1 text-xs leading-relaxed text-slate-500">
            {streak > 0
              ? 'Loves focusing with you every day'
              : 'Ready for your first session together'}
            <Icon name="paw" size={12} className="mt-0.5 shrink-0 text-slate-300" />
          </p>
        </div>
      </div>

      {/* next friend in the collection */}
      <div className="mt-3 flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50/60 p-2.5">
        {nextPet ? (
          <>
            <div className="shrink-0 opacity-50 grayscale">
              <Mascot mood="idle" variant={nextPet.id} still className="h-10 w-10" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[11px] font-black text-slate-700">
                  Next friend: {nextPet.name}
                </p>
                <span className="shrink-0 text-[10px] font-black tabular-nums text-brand-600">
                  {petRemainingText(stats, nextPet)}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={`Progress to unlock ${nextPet.name}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
                className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sky-100"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-brand-600 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                {ownedCount}/{MASCOT_CATALOG.length} friends · see them all in Rewards
                <Icon name="chevronRight" size={10} className="shrink-0" />
              </p>
            </div>
          </>
        ) : (
          <p className="flex w-full items-center justify-center gap-1.5 text-[11px] font-black text-emerald-600">
            <Icon name="sparkle" size={13} tone="inherit" />
            You&apos;ve met all {MASCOT_CATALOG.length} friends!
          </p>
        )}
      </div>
    </section>
  );
};

export default MascotCard;
