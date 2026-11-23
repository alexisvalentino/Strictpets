'use client';
import { useState } from 'react';
import Icon, { type IconName } from './Icon';
import {
  ACHIEVEMENTS,
  unlockedCount,
  type AchievementStats,
} from '../lib/gameState';

const formatDuration = (totalSeconds: number): string => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m} min`;
  return `${s}s`;
};

interface AchievementsCardProps extends AchievementStats {}
type Achievement = (typeof ACHIEVEMENTS)[number];

const AchievementsCard = (stats: AchievementsCardProps) => {
  const unlocked = unlockedCount(stats);
  const [expanded, setExpanded] = useState(false);
  const [activeGroup, setActiveGroup] = useState<'earned' | 'locked'>(unlocked > 0 ? 'earned' : 'locked');
  const [showAll, setShowAll] = useState(false);
  const records: { label: string; value: string; icon: IconName }[] = [
    { label: 'Longest session', value: formatDuration(stats.longestSession), icon: 'timer' },
    { label: 'Friends', value: String(stats.petsOwned), icon: 'paw' },
    { label: 'Best streak', value: `${stats.bestStreak}d`, icon: 'flame' },
    { label: 'Jackpots', value: String(stats.jackpots), icon: 'dice' },
  ];
  const earned = ACHIEVEMENTS.filter(a => a.unlocked(stats));
  const stillAhead = ACHIEVEMENTS.filter(a => !a.unlocked(stats));
  const items = activeGroup === 'earned' ? earned : stillAhead;
  const visibleItems = showAll ? items : items.slice(0, 4);

  return (
    <section className="guide-panel mt-4 w-full rounded-[22px] p-4 text-left">
      <header className="flex items-center gap-3">
        <h2 className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setExpanded(value => !value)}
            aria-expanded={expanded}
            aria-controls="achievement-details"
            className="flex min-h-12 w-full items-center gap-3 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-50 text-brand-700 ring-1 ring-sky-100">
              <Icon name="medal" size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-bold tracking-tight text-slate-900">Achievements</span>
            </span>
            <span className="shrink-0 rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-black tabular-nums text-brand-700">
              {unlocked}/{ACHIEVEMENTS.length}
            </span>
            <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={16} className="shrink-0 text-slate-400" />
          </button>
        </h2>
      </header>
      <div
        role="progressbar"
        aria-label="Achievement progress"
        aria-valuemin={0}
        aria-valuemax={ACHIEVEMENTS.length}
        aria-valuenow={unlocked}
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sky-100"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-brand-600 transition-[width] duration-500"
          style={{ width: `${(unlocked / ACHIEVEMENTS.length) * 100}%` }}
        />
      </div>

      <div id="achievement-details" className="disclosure-reveal" hidden={!expanded}>
        <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-b border-sky-100 pb-4 sm:grid-cols-4">
          {records.map(record => (
            <div key={record.label} className="flex items-center gap-2">
              <Icon name={record.icon} size={16} className="shrink-0 text-brand-600" />
              <div className="min-w-0">
                <dt className="sr-only">{record.label}</dt>
                <dd className="min-w-0">
                  <span className="block truncate text-sm font-black tabular-nums text-slate-800">{record.value}</span>
                  <span aria-hidden="true" className="block truncate text-[10px] font-semibold text-slate-500">{record.label}</span>
                </dd>
              </div>
            </div>
          ))}
        </dl>

        <div role="tablist" aria-label="Achievement status" className="mt-3 flex rounded-xl bg-sky-50 p-1">
          <button
            type="button"
            role="tab"
            id="earned-achievements-tab"
            aria-selected={activeGroup === 'earned'}
            aria-controls="achievement-list"
            onClick={() => { setActiveGroup('earned'); setShowAll(false); }}
            className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold transition-colors ${activeGroup === 'earned' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}
          >
            Earned <span className="tabular-nums">{earned.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            id="locked-achievements-tab"
            aria-selected={activeGroup === 'locked'}
            aria-controls="achievement-list"
            onClick={() => { setActiveGroup('locked'); setShowAll(false); }}
            className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold transition-colors ${activeGroup === 'locked' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}
          >
            To unlock <span className="tabular-nums">{stillAhead.length}</span>
          </button>
        </div>

        <div role="tabpanel" id="achievement-list" aria-labelledby={activeGroup === 'earned' ? 'earned-achievements-tab' : 'locked-achievements-tab'}>
          {items.length > 0 ? (
            <ul className="mt-2 divide-y divide-sky-100/80">
              {visibleItems.map(item => (
                <AchievementRow key={item.id} item={item} earned={activeGroup === 'earned'} />
              ))}
            </ul>
          ) : (
            <p className="py-4 text-center text-sm font-semibold text-slate-500">
              {activeGroup === 'earned' ? 'Your first milestone is waiting.' : 'Every achievement is yours.'}
            </p>
          )}
          {items.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAll(value => !value)}
              aria-expanded={showAll}
              className="mt-2 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-sky-100 bg-white text-xs font-bold text-brand-700 transition-transform active:scale-[0.99]"
            >
              {showAll ? 'Show fewer' : `Show all ${items.length}`}
              <Icon name={showAll ? 'chevronDown' : 'chevronRight'} size={13} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

const AchievementRow = ({
  item,
  earned,
}: {
  item: Achievement;
  earned: boolean;
}) => (
  <li className="flex items-center gap-3 py-2.5">
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${earned ? 'bg-sky-50 text-brand-700 ring-1 ring-sky-100' : 'bg-slate-50 text-slate-400'}`}>
      <Icon name={item.icon} size={18} tone="inherit" />
    </span>
    <div className="min-w-0 flex-1">
      <p className={`text-sm font-bold ${earned ? 'text-slate-900' : 'text-slate-700'}`}>{item.name}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{item.desc}</p>
    </div>
    <span
      aria-label={earned ? 'Earned' : 'Locked'}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${earned ? 'bg-sky-50 text-brand-600' : 'bg-slate-50 text-slate-400'}`}
    >
      {earned ? <Icon name="check" size={13} tone="inherit" /> : <Icon name="lock" size={12} tone="inherit" />}
    </span>
  </li>
);

export default AchievementsCard;
