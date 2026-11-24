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
  type PetSceneId,
} from '../lib/gameState';

const MascotCard = ({
  petName,
  mascot = 'cat',
  accessory = null,
  scene = 'classic',
  nextPet = null,
  stats,
  ownedCount,
}: {
  petName: string;
  mascot?: MascotId;
  accessory?: AccessoryId | null;
  scene?: PetSceneId;
  nextPet?: PetInfo | null; // closest locked pet, null when all are unlocked
  stats: PetStats;
  ownedCount: number;
}) => {
  const progress = nextPet ? petProgress(stats, nextPet) : null;
  const pct = progress
    ? Math.min(100, Math.floor((progress.current / progress.target) * 100))
    : 100;
  return (
    <section className="relative mt-4 w-full overflow-hidden rounded-[26px] border border-white/85 bg-white/55 p-3 text-left shadow-xl shadow-sky-700/10 backdrop-blur-md">
      <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] items-center gap-2">
        <div className="min-w-0 pl-1">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-600">Your companion</p>
          <p className="mt-1 text-xl font-black leading-tight tracking-tight text-slate-900">{petName}</p>
        </div>
        <div className="guide-pet-stage relative mx-auto flex h-28 w-28 items-center justify-center">
          <Mascot
            mood="idle"
            variant={mascot}
            accessory={accessory}
            scene={scene}
            className="guide-pet-float relative z-10 h-28 w-28"
          />
          <Icon name="sparkle" size={13} className="absolute right-1 top-3 z-10 text-sky-500" aria-hidden="true" />
        </div>
      </div>

      {/* The next unlock is the waypoint that carries the journey forward. */}
      <div className="guide-route mt-1 flex items-center gap-3 border-t border-sky-100/80 px-1 pt-3">
        {nextPet ? (
          <>
            <div className="shrink-0 opacity-50 grayscale">
              <Mascot mood="idle" variant={nextPet.id} still className="h-10 w-10" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-bold text-slate-700">
                  Next · {nextPet.name}
                </p>
                <span className="shrink-0 text-[10px] font-bold tabular-nums text-brand-600">
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
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-brand-600 transition-colors duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] font-semibold text-slate-400">
                {ownedCount}/{MASCOT_CATALOG.length} friends
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
