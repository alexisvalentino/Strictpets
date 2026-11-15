'use client';
import { useState } from 'react';
import Icon from './Icon';
import Mascot from './Mascot';
import {
  MASCOT_CATALOG,
  petGoalText,
  petProgress,
  petRemainingText,
  type MascotId,
  type PetStats,
} from '../lib/gameState';

interface PetCollectionProps {
  stats: PetStats;
  ownedMascots: MascotId[];
  activeMascot: MascotId;
  onEquip: (id: MascotId) => void;
}

const PREVIEW_COUNT = 9; // 3x3 before "show all"

// Pets are earned by focusing. Earned pets can be chosen freely; locked ones
// show as a soft silhouette with their goal and a progress bar.
const PetCollection = ({ stats, ownedMascots, activeMascot, onEquip }: PetCollectionProps) => {
  const [expanded, setExpanded] = useState(false);
  const owned = new Set(ownedMascots);
  const pets = expanded ? MASCOT_CATALOG : MASCOT_CATALOG.slice(0, PREVIEW_COUNT);

  return (
    <section className="mt-3 w-full rounded-2xl border border-slate-200/70 bg-white p-4 text-left shadow-sm">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 text-slate-500">
          <Icon name="paw" size={16} plate />
          <h2 className="text-[11px] font-black uppercase tracking-widest">
            Pet Collection
          </h2>
        </div>
        <span className="whitespace-nowrap rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-black tabular-nums tracking-wider text-brand-600">
          {owned.size}/{MASCOT_CATALOG.length} friends
        </span>
      </header>
      <p className="mt-1 text-[10px] font-semibold text-slate-400">
        Focus to meet new friends — every pet is earned, never bought.
      </p>

      <ul className="mt-3 grid grid-cols-3 gap-2">
        {pets.map(pet => {
          const isOwned = owned.has(pet.id);
          const isActive = activeMascot === pet.id;
          const { current, target } = petProgress(stats, pet);
          const pct = Math.floor((current / target) * 100);
          return (
            <li
              key={pet.id}
              className={`relative flex flex-col overflow-hidden rounded-xl border p-2 text-center transition-all duration-150 ${
                isActive
                  ? 'border-brand-300 bg-brand-50 shadow-sm'
                  : isOwned
                    ? 'border-slate-200 bg-white'
                    : 'border-dashed border-slate-200 bg-slate-50'
              }`}
            >
              {!isOwned && (
                <Icon
                  name="lock"
                  size={11}
                  className="absolute right-1 top-1 text-slate-300"
                />
              )}
              <div className={isOwned ? '' : 'opacity-60 grayscale'}>
                <Mascot
                  mood="idle"
                  variant={pet.id}
                  still
                  className={`mx-auto h-14 w-14 ${isActive ? 'stat-pop' : ''}`}
                />
              </div>
              <p className={`mt-1 text-[11px] font-black ${isOwned ? 'text-slate-700' : 'text-slate-500'}`}>
                {pet.name}
              </p>

              {isActive ? (
                <span className="mt-1.5 flex items-center justify-center gap-1 rounded-lg bg-brand-600 py-1.5 text-[10px] font-black uppercase tracking-wide text-white">
                  <Icon name="check" size={10} />
                  With you
                </span>
              ) : isOwned ? (
                <button
                  onClick={() => onEquip(pet.id)}
                  aria-label={`Focus with ${pet.name}`}
                  className="mt-1.5 min-h-11 w-full rounded-lg border border-brand-400 bg-white py-1 text-[10px] font-black uppercase tracking-wide text-brand-600 transition-transform active:scale-95"
                >
                  Choose
                </button>
              ) : (
                <div
                  className="mt-1"
                  aria-label={`${pet.name} locked: ${petGoalText(pet)}, ${petRemainingText(stats, pet)}`}
                >
                  <p className="text-[10px] font-bold leading-tight text-slate-400">
                    {petGoalText(pet)}
                  </p>
                  <div
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.min(100, pct)}
                    aria-label={`Progress to unlock ${pet.name}`}
                    className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-200"
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-brand-600"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-[10px] font-black text-brand-600">
                    {petRemainingText(stats, pet)}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {MASCOT_CATALOG.length > PREVIEW_COUNT && (
        <button
          onClick={() => setExpanded(e => !e)}
          aria-expanded={expanded}
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-[10px] font-black uppercase tracking-wide text-slate-500 transition-transform active:scale-[0.99]"
        >
          <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={12} />
          {expanded ? 'Show fewer' : `Show all ${MASCOT_CATALOG.length} pets`}
        </button>
      )}
    </section>
  );
};

export default PetCollection;
