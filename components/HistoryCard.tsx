'use client';
import { useState } from 'react';
import Icon from './Icon';
import { DAILY_GOAL, type FocusLogEntry } from '../lib/gameState';

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatMinutes = (seconds: number): string => {
  const min = Math.round(seconds / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
};

const HistoryCard = ({ days }: { days: FocusLogEntry[] }) => {
  const [chartExpanded, setChartExpanded] = useState(false);
  const goalSeconds = DAILY_GOAL * 60;
  const maxSeconds = Math.max(goalSeconds, ...days.map(d => d.seconds));
  const totalSeconds = days.reduce((sum, d) => sum + d.seconds, 0);
  const totalSessions = days.reduce((sum, d) => sum + d.sessions, 0);
  const activeDays = days.filter(d => d.sessions > 0).length;
  const goalDays = days.filter(d => d.seconds >= goalSeconds).length;
  const goalHeight = (goalSeconds / maxSeconds) * 100;

  return (
    <section className="guide-panel w-full rounded-[24px] bg-white p-4 text-left shadow-sm ring-1 ring-sky-100/80 md:p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-900">
            Focused time
          </h2>
          {totalSessions > 0 && (
            <p className="mt-1 text-xs font-medium text-slate-500">
              {totalSessions} session{totalSessions === 1 ? '' : 's'} · {activeDays} active day{activeDays === 1 ? '' : 's'}
            </p>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-black tabular-nums text-brand-700">
          {goalDays}/7 goal days
        </span>
      </header>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-3xl font-black leading-none tracking-tight tabular-nums text-slate-900">
            {formatMinutes(totalSeconds)}
          </p>
        </div>
      </div>

      <button
        type="button"
        aria-expanded={chartExpanded}
        aria-controls="weekly-focus-chart"
        onClick={() => setChartExpanded(expanded => !expanded)}
        className="mt-3 flex min-h-11 w-full items-center justify-between border-t border-sky-100 pt-2 text-left text-xs font-bold text-brand-700"
      >
        <span>{chartExpanded ? 'Hide week chart' : 'View week chart'}</span>
        <Icon name={chartExpanded ? 'chevronDown' : 'chevronRight'} size={15} />
      </button>

      <div id="weekly-focus-chart" className="disclosure-reveal" hidden={!chartExpanded}>
        <div className="mt-3 flex items-end justify-between gap-3">
          <span className="text-xs font-semibold text-slate-500">
            Daily goal <span className="font-black text-brand-700">{DAILY_GOAL} min</span>
          </span>
        </div>
        <div
          role="img"
          aria-label={`Focus over the last seven days: ${days
            .map(d => `${formatMinutes(d.seconds)} on ${WEEKDAY[weekdayOf(d.date)]}`)
            .join(', ')}. Dashed line marks the ${DAILY_GOAL}-minute daily goal.`}
          className="mt-3"
        >
          <div className="relative h-28">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 z-10 border-t border-dashed border-sky-300"
              style={{ bottom: `${goalHeight}%` }}
            />
            <div className="flex h-full items-end gap-2">
              {days.map((d, i) => {
                const isToday = i === days.length - 1;
                const pct = d.seconds > 0 ? Math.max(6, (d.seconds / maxSeconds) * 100) : 0;
                const reachesGoal = d.seconds >= goalSeconds;
                return (
                  <div key={d.date} className="flex h-full min-w-0 flex-1 items-end">
                    <div
                      aria-hidden="true"
                      title={`${WEEKDAY[weekdayOf(d.date)]}: ${formatMinutes(d.seconds)}`}
                      className={`history-bar-enter w-full rounded-t-[7px] ${
                        d.seconds === 0
                          ? 'h-1 bg-sky-100'
                          : isToday
                            ? 'bg-brand-600'
                            : reachesGoal
                              ? 'bg-sky-500'
                              : 'bg-sky-300'
                      }`}
                      style={{
                        height: d.seconds > 0 ? `${pct}%` : undefined,
                        animationDelay: `${i * 45}ms`,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            {days.map((d, i) => (
              <span
                key={d.date}
                className={`min-w-0 flex-1 text-center text-[10px] font-bold ${
                  i === days.length - 1 ? 'text-brand-700' : 'text-slate-500'
                }`}
              >
                {WEEKDAY[weekdayOf(d.date)]}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const weekdayOf = (key: string): number => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
};

export default HistoryCard;
