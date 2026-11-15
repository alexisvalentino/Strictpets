'use client';
import Icon from './Icon';
import type { FocusLogEntry } from '../lib/gameState';

const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Parse a YYYY-MM-DD key as a local calendar date (not UTC midnight).
const weekdayOf = (key: string): number => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
};

const formatMinutes = (seconds: number): string => {
  const min = Math.round(seconds / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
};

// Seven-day focus history: one bar per day, oldest on the left, today last.
const HistoryCard = ({ days }: { days: FocusLogEntry[] }) => {
  const maxSeconds = Math.max(1, ...days.map(d => d.seconds));
  const totalSeconds = days.reduce((sum, d) => sum + d.seconds, 0);
  const totalSessions = days.reduce((sum, d) => sum + d.sessions, 0);
  const activeDays = days.filter(d => d.sessions > 0).length;

  return (
    <section className="mt-3 w-full rounded-2xl border border-slate-200/70 bg-white p-4 text-left shadow-sm">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 text-slate-500">
          <Icon name="chart" size={16} plate />
          <h2 className="text-[11px] font-black uppercase tracking-widest">
            This Week
          </h2>
        </div>
        <span className="whitespace-nowrap rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-black tabular-nums text-brand-600">
          {activeDays}/7 days
        </span>
      </header>

      <div
        role="img"
        aria-label={`Focus over the last 7 days: ${days
          .map(d => `${formatMinutes(d.seconds)}`)
          .join(', ')}`}
        className="mt-3 flex h-20 items-end gap-1.5"
      >
        {days.map((d, i) => {
          const isToday = i === days.length - 1;
          const pct = d.seconds > 0 ? Math.max(8, (d.seconds / maxSeconds) * 100) : 0;
          return (
            <div key={d.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <div className="flex w-full flex-1 items-end">
                <div
                  className={`w-full rounded-md transition-all duration-500 ${
                    d.seconds > 0
                      ? isToday
                        ? 'bg-gradient-to-t from-brand-600 to-sky-400'
                        : 'bg-sky-300'
                      : 'bg-slate-100'
                  }`}
                  style={{ height: d.seconds > 0 ? `${pct}%` : '4px' }}
                />
              </div>
              <span
                className={`text-[10px] font-black ${isToday ? 'text-brand-600' : 'text-slate-400'}`}
              >
                {WEEKDAY[weekdayOf(d.date)]}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-2 flex items-center justify-center gap-1 text-center text-[10px] font-semibold text-slate-500">
        {totalSessions > 0 ? (
          <>
            {formatMinutes(totalSeconds)} focused · {totalSessions} session
            {totalSessions === 1 ? '' : 's'} this week
          </>
        ) : (
          'Your week starts with one session'
        )}
        <Icon name="paw" size={11} className="text-slate-300" />
      </p>
    </section>
  );
};

export default HistoryCard;
