'use client';
import Icon from './Icon';
import MascotCard from './MascotCard';
import StreakCard from './StreakCard';
import HistoryCard from './HistoryCard';
import { DAILY_GOAL, type AccessoryId, type FocusLogEntry, type MascotId, type PetInfo, type PetSceneId } from '../lib/gameState';

interface HomePageProps {
  streak: number;
  bestStreak: number;
  nextPet: PetInfo | null;
  ownedPetCount: number;
  week: FocusLogEntry[];
  coins: number;
  minutesToday: number;
  dailyGoalClaimed: boolean;
  shields: number;
  repairableStreak: number;
  canBuyShield: boolean;
  mascot: MascotId;
  accessory: AccessoryId | null;
  petScene: PetSceneId;
  petName: string;
  totalSessions: number;
  focusSeconds: number;
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
  petScene,
  petName,
  totalSessions,
  focusSeconds,
  onRepair,
  onBuyShield,
  onOpenRewards,
}: HomePageProps) => {
  const goalPct = Math.min(100, (minutesToday / DAILY_GOAL) * 100);
  return (
    <div className="flex h-full w-full shrink-0 snap-start flex-col overflow-y-auto">
      <main className="mx-auto w-full max-w-md px-4 py-6 pl-[max(1rem,var(--safe-area-left))] pr-[max(1rem,var(--safe-area-right))] sm:px-6 md:max-w-4xl">
        <header className="mb-5">
          <h1 className="text-[26px] font-black leading-tight tracking-tight text-slate-900">
            This week
          </h1>
        </header>

        <div className="md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] md:items-start md:gap-5">
          <HistoryCard days={week} />

          <div className="md:pt-0">
            <section className="guide-panel home-today-panel mt-4 rounded-[24px] p-4 text-slate-800 md:mt-0">
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
                <div className="min-w-[82px] border-r border-sky-200/80 pr-4">
                  <p className="text-[11px] font-bold text-slate-600">Current streak</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Icon name="flame" size={19} className="shrink-0 text-amber-500" />
                    <p className="text-2xl font-black leading-none tabular-nums text-brand-700">
                      {streak}<span className="ml-1 text-xs font-bold">d</span>
                    </p>
                  </div>
                  <p className="mt-1 text-[10px] font-semibold text-slate-500">Best {bestStreak}d</p>
                </div>

                <div className="min-w-0">
                  <div className="flex items-baseline justify-between gap-2 text-xs font-bold text-slate-700">
                    <span>Today&apos;s focus</span>
                    <span className="shrink-0 tabular-nums text-slate-800">
                      {minutesToday}/{DAILY_GOAL} min
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label="Today's focus goal"
                    aria-valuemin={0}
                    aria-valuemax={DAILY_GOAL}
                    aria-valuenow={Math.min(minutesToday, DAILY_GOAL)}
                    className="mt-2 h-2 overflow-hidden rounded-full bg-sky-100"
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-brand-600 transition-[width] duration-500 ease-out"
                      style={{ width: `${goalPct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[10px] font-semibold leading-relaxed text-slate-500">
                    {dailyGoalClaimed
                      ? 'Daily reward collected.'
                      : goalPct >= 100
                        ? `Your ${DAILY_GOAL}-minute goal is ready to claim.`
                        : `${Math.max(0, DAILY_GOAL - minutesToday)} min to goal.`}
                  </p>
                </div>
              </div>
              {!dailyGoalClaimed && goalPct >= 100 && (
                <button
                  onClick={onOpenRewards}
                  className="mt-3 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-brand-700 to-sky-700 px-3 text-xs font-black text-white shadow-md shadow-brand-700/15 transition-transform active:scale-[0.98]"
                >
                  Claim your reward <Icon name="chevronRight" size={13} />
                </button>
              )}
              <StreakCard
                streak={streak}
                shields={shields}
                repairableStreak={repairableStreak}
                coins={coins}
                canBuyShield={canBuyShield}
                tone="glass"
                onBuyShield={onBuyShield}
                onRepair={onRepair}
              />
            </section>

            <MascotCard
              petName={petName}
              mascot={mascot}
              accessory={accessory}
              scene={petScene}
              nextPet={nextPet}
              stats={{ focusSeconds, totalSessions, bestStreak }}
              ownedCount={ownedPetCount}
            />

            <button
              onClick={onOpenRewards}
              className="mt-4 flex min-h-12 w-full items-center gap-3 border-y border-sky-200/70 px-1 text-left text-sm transition-colors active:text-brand-700"
            >
              <Icon name="gift" size={18} className="shrink-0 text-brand-600" />
              <span className="min-w-0 flex-1 font-bold text-slate-700">Rewards</span>
              <Icon name="chevronRight" size={15} className="shrink-0 text-slate-400" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
