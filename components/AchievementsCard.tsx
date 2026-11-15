'use client';
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

const AchievementsCard = ({
  longestSession,
  bestStreak,
  petsOwned,
  focusSeconds,
  totalSessions,
  jackpots,
}: AchievementsCardProps) => {
  const stats: AchievementStats = {
    totalSessions,
    bestStreak,
    petsOwned,
    focusSeconds,
    longestSession,
    jackpots,
  };
  const unlocked = unlockedCount(stats);
  const records: { label: string; value: string; icon: IconName }[] = [
    { label: 'Longest', value: formatDuration(longestSession), icon: 'timer' },
    { label: 'Friends', value: String(petsOwned), icon: 'paw' },
    { label: 'Best streak', value: `${bestStreak}d`, icon: 'flame' },
    { label: 'Jackpots', value: String(jackpots), icon: 'dice' },
  ];

  return (
    <section className="mt-3 w-full rounded-2xl border border-slate-200/70 bg-white p-4 text-left shadow-sm">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 text-slate-500">
          <Icon name="trophy" size={16} plate />
          <h2 className="text-[11px] font-black uppercase tracking-widest">
            Achievements
          </h2>
        </div>
        <span className="whitespace-nowrap rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-black tabular-nums tracking-wider text-brand-600">
          {unlocked}/{ACHIEVEMENTS.length} unlocked
        </span>
      </header>

      {/* personal records */}
      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {records.map(r => (
          <div
            key={r.label}
            className="rounded-xl border border-sky-100 bg-gradient-to-b from-sky-50 to-white p-2 text-center shadow-sm"
          >
            <Icon name={r.icon} size={16} className="mx-auto text-brand-500" />
            <dd className="mt-1 truncate text-[13px] font-black tabular-nums text-slate-800">
              {r.value}
            </dd>
            <dt className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {r.label}
            </dt>
          </div>
        ))}
      </dl>

      {/* unlock badges */}
      <ul className="mt-3 grid grid-cols-3 gap-2">
        {ACHIEVEMENTS.map(a => {
          const done = a.unlocked(stats);
          return (
            <li
              key={a.id}
              className={`relative overflow-hidden rounded-xl border p-2 text-center transition-all duration-150 ${
                done
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <Icon
                name={a.icon}
                size={20}
                plate
                // Earned badges keep their own identity hue - a gold trophy, a
                // sky-blue timer - instead of all turning one flat green, which
                // made the finished set look like a status column.
                tone={done ? undefined : 'slate'}
              />
              {!done && (
                <Icon
                  name="lock"
                  size={11}
                  className="absolute right-1 top-1 text-slate-300"
                />
              )}
              <p
                className={`mt-1 text-[10px] font-black leading-tight ${
                  done ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                {a.name}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold leading-tight text-slate-400">
                {a.desc}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default AchievementsCard;
