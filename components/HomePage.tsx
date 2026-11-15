'use client';
import Icon from './Icon';
import MascotCard from './MascotCard';
import StreakCard from './StreakCard';
import HistoryCard from './HistoryCard';
import { DAILY_GOAL, type AccessoryId, type FocusLogEntry, type MascotId, type PetInfo } from '../lib/gameState';

// Home is the "where am I" page: the streak you are holding, the one number
// that moves today, your pet, and your week. Everything that is a destination
// or a purchase lives on Rewards — this page used to carry a rotating banner
// row advertising features that were one tab away, plus a second set of record
// tiles duplicating Rewards' achievements card.
interface HomePageProps {
  streak: number;
  bestStreak: number;
  nextPet: PetInfo | null;
  ownedPetCount: number;
  week: FocusLogEntry[]; // last 7 days, oldest first
  coins: number;
  minutesToday: number; // focused minutes today (daily goal)
  dailyGoalClaimed: boolean;
  shields: number;
  repairableStreak: number;
  canBuyShield: boolean;
  mascot: MascotId;
  accessory: AccessoryId | null;
  petName: string;
  totalSessions: number;
  focusSeconds: number; // lifetime focused seconds
  onRepair: () => void;
  onBuyShield: () => void;
  onOpenRewards: () => void;
}

const HomePage = ({
  streak,
  bestStreak,
  nextPet,
  ownedPetCount,
  week,
  coins,
  minutesToday,
  dailyGoalClaimed,
  shields,
  repairableStreak,
  canBuyShield,
  mascot,
  accessory,
  petName,
  totalSessions,
  focusSeconds,
  onRepair,
  onBuyShield,
  onOpenRewards,
}: HomePageProps) => {
  const goalPct = Math.min(100, (minutesToday / DAILY_GOAL) * 100);
  const sessionsThisWeek = week.reduce((n, d) => n + d.sessions, 0);

  return (
    <div className="flex h-full w-full shrink-0 snap-start flex-col overflow-y-auto">
      <div className="my-auto mx-auto w-full max-w-md px-4 py-6 pl-[max(1rem,var(--safe-area-left))] pr-[max(1rem,var(--safe-area-right))] sm:px-6 md:max-w-3xl">
        <div className="md:grid md:grid-cols-2 md:items-start md:gap-x-6">
          <div>
            {/* the streak is the headline: one band, one number, one goal */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-sky-500 to-sky-400 p-5 text-left shadow-lg shadow-brand-600/25">
              <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10" />
              <div className="absolute -bottom-12 -left-6 h-24 w-24 rounded-full bg-white/10" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
                {streak > 0 ? 'Your streak' : 'Focus Tracker'}
              </p>
              <p className="mt-1.5 flex items-baseline gap-2 text-3xl font-black tabular-nums text-white">
                {streak > 0 ? (
                  <>
                    {streak}
                    <span className="text-sm font-bold uppercase tracking-wide text-white/80">
                      day{streak === 1 ? '' : 's'}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl">Start today</span>
                )}
                <Icon name="flame" size={22} className="shrink-0 text-amber-200" />
              </p>

              {/* today's focus, the only number that moves the streak forward */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-white/80">
                  <span>Today&apos;s focus</span>
                  <span className="tabular-nums">
                    {minutesToday}/{DAILY_GOAL} min
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-500"
                    style={{ width: `${goalPct}%` }}
                  />
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-white/80">
                  <Icon name="coin" size={12} className="shrink-0 text-amber-200" />
                  {coins} focus coins
                  {dailyGoalClaimed
                    ? ' · daily goal claimed'
                    : goalPct >= 100
                      ? ' · daily goal ready on Rewards'
                      : ''}
                </p>
              </div>
            </div>

            <StreakCard
              streak={streak}
              bestStreak={bestStreak}
              shields={shields}
              repairableStreak={repairableStreak}
              coins={coins}
              canBuyShield={canBuyShield}
              onBuyShield={onBuyShield}
              onRepair={onRepair}
            />

            <MascotCard
              streak={streak}
              petName={petName}
              mascot={mascot}
              accessory={accessory}
              nextPet={nextPet}
              stats={{ focusSeconds, totalSessions, bestStreak }}
              ownedCount={ownedPetCount}
            />
          </div>

          <div>
            <HistoryCard days={week} />

            {/* one plain destination instead of a carousel of adverts */}
            <button
              onClick={onOpenRewards}
              className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 text-left shadow-sm transition-transform active:scale-[0.99]"
            >
              <Icon name="gift" size={16} plate />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                  Rewards
                </p>
                <p className="mt-0.5 text-[11px] font-semibold leading-relaxed text-slate-400">
                  {sessionsThisWeek > 0
                    ? `${sessionsThisWeek} session${sessionsThisWeek === 1 ? '' : 's'} this week · claim and collect there`
                    : 'Daily goal, check-in jackpot, friends, and shops'}
                </p>
              </div>
              <Icon name="chevronRight" size={14} className="shrink-0 text-slate-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
