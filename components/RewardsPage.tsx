'use client';
import { useState } from 'react';
import Icon from './Icon';
import {
  DAILY_GOAL,
  DAILY_GOAL_REWARD,
  DAY_REWARDS,
  checkinMultiplier,
  checkinReward,
  type AccessoryId,
  type MascotId,
  type ThemeId,
} from '../lib/gameState';
import PetCollection from './PetCollection';
import AccessoryShop from './AccessoryShop';
import ThemeShop from './ThemeShop';
import AchievementsCard from './AchievementsCard';

interface RewardsPageProps {
  coins: number;
  currentStreak: number;
  minutesToday: number; // focused minutes today — the daily goal measures this
  dailyGoalReached: boolean;
  dailyGoalClaimed: boolean;
  ownedMascots: MascotId[];
  activeMascot: MascotId;
  ownedAccessories: AccessoryId[];
  equippedAccessory: AccessoryId | null;
  ownedThemes: ThemeId[];
  activeTheme: ThemeId;
  longestSession: number;
  bestStreak: number;
  jackpots: number;
  totalSessions: number;
  focusSeconds: number; // lifetime focused seconds (pet unlocks)
  claimableDay: number | null; // from claimableCheckinDay — the engine's rule
  checkinProgress: number;
  checkedInToday: boolean;
  bonusAvailable: boolean; // today's gift is still unclaimed
  bonusValue: number;
  onCollectBonus: () => void;
  onClaimGoal: () => void;
  onClaimDay: (day: number) => void;
  onEquipMascot: (id: MascotId) => void;
  onBuyAccessory: (id: AccessoryId) => void;
  onEquipAccessory: (id: AccessoryId | null) => void;
  onBuyTheme: (id: ThemeId) => void;
  onEquipTheme: (id: ThemeId) => void;
}

// Render the check-in multiplier without trailing zeros (x1, x1.5, x2.5...).
const formatMult = (m: number): string =>
  (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)).replace('.0', '');

// Shops and the collection are different kinds of thing, so they are two tabs
// rather than a single scroll that mixed a wallet, two shops, 22 pets and 18
// badges into one strip. Claiming is the reason people open this page, so it
// leads, and everything else is one tap away.
type RewardsTab = 'claim' | 'collect';

const TABS: { key: RewardsTab; label: string; icon: 'gift' | 'paw' }[] = [
  { key: 'claim', label: 'Claim', icon: 'gift' },
  { key: 'collect', label: 'Collect', icon: 'paw' },
];

const RewardsPage = ({
  coins,
  currentStreak,
  minutesToday,
  dailyGoalReached,
  dailyGoalClaimed,
  ownedMascots,
  activeMascot,
  ownedAccessories,
  equippedAccessory,
  ownedThemes,
  activeTheme,
  longestSession,
  bestStreak,
  jackpots,
  totalSessions,
  focusSeconds,
  claimableDay,
  checkinProgress,
  checkedInToday,
  bonusAvailable,
  bonusValue,
  onCollectBonus,
  onClaimGoal,
  onClaimDay,
  onEquipMascot,
  onBuyAccessory,
  onEquipAccessory,
  onBuyTheme,
  onEquipTheme,
}: RewardsPageProps) => {
  const [tab, setTab] = useState<RewardsTab>('claim');

  const goalPct = Math.min(100, (minutesToday / DAILY_GOAL) * 100);
  const completedCycleToday = checkedInToday && checkinProgress === DAY_REWARDS.length;
  const displayJackpots = completedCycleToday ? Math.max(0, jackpots - 1) : jackpots;
  const mult = checkinMultiplier(displayJackpots);
  const checkinStatus = completedCycleToday
    ? 'Seven-day cycle complete. Your next cycle opens tomorrow.'
    : checkedInToday
      ? 'Checked in today. Your next streak reward is available tomorrow.'
      : claimableDay !== null
        ? `Day ${claimableDay} is ready. Claim once each day to advance.`
        : currentStreak === 0
          ? 'Complete a focus session today to unlock your first check-in.'
          : 'Focus today to unlock your next streak reward.';

  return (
    <div className="flex h-full w-full shrink-0 snap-start flex-col overflow-y-auto">
      <style>{`
        @keyframes rw-pop {
          0%   { transform: scale(0.4); }
          60%  { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .rw-pop { animation: rw-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
      `}</style>

      <div className="my-auto mx-auto w-full max-w-md px-4 py-6 pl-[max(1rem,var(--safe-area-left))] pr-[max(1rem,var(--safe-area-right))] sm:px-6 md:max-w-3xl lg:max-w-4xl">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-sm font-black uppercase tracking-[0.35em] text-brand-600">
            Rewards
          </h1>
          <span className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-black tabular-nums text-slate-700 shadow-sm ring-1 ring-slate-200/70">
            <Icon name="coin" size={13} />
            {coins}
          </span>
        </div>

        {/* two tabs keep the page's two jobs apart */}
        <div
          role="tablist"
          aria-label="Rewards sections"
          className="mt-3 flex gap-1 rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200/70"
        >
          {TABS.map(t => {
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(t.key)}
                className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg text-[11px] font-black uppercase tracking-wide transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                <Icon
                  name={t.icon}
                  size={13}
                  tone={isActive ? 'inherit' : 'slate'}
                  className={isActive ? 'text-white' : undefined}
                />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'claim' && (
          <>
            <section className="mt-3 rounded-2xl border border-slate-200/70 bg-white p-4 text-left shadow-sm">
              <header className="flex items-center gap-2.5 text-slate-500">
                <Icon name="target" size={16} plate />
                <h2 className="text-[11px] font-black uppercase tracking-widest">
                  Focus goal
                </h2>
              </header>
              <div className="mt-3 flex items-baseline justify-between">
                <p className="text-xs font-black text-slate-700">Today&apos;s progress</p>
                <p className="text-[11px] font-bold tabular-nums text-slate-500">
                  {Math.min(minutesToday, DAILY_GOAL)}/{DAILY_GOAL} min
                </p>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sky-100">
                <div
                  className={`relative h-full overflow-hidden rounded-full bg-gradient-to-r transition-all duration-500 ${
                    dailyGoalReached || dailyGoalClaimed
                      ? 'from-emerald-400 to-emerald-600'
                      : 'from-sky-400 to-brand-600'
                  }`}
                  style={{ width: `${goalPct}%` }}
                >
                  <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent bg-[length:200%_100%]" />
                </div>
              </div>

              {dailyGoalClaimed ? (
                <p className="mt-2 flex items-center justify-center gap-1 text-[11px] font-black text-emerald-600">
                  <span className="rw-pop inline-block">
                    <Icon name="check" size={12} />
                  </span>
                  Goal reward claimed today
                </p>
              ) : dailyGoalReached ? (
                <button
                  onClick={onClaimGoal}
                  className="mt-2 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-2.5 text-xs font-black uppercase tracking-wide text-white shadow-md shadow-emerald-500/30 transition-transform active:scale-95"
                >
                  Claim +{DAILY_GOAL_REWARD}
                  <Icon name="coin" size={13} tone="inherit" />
                </button>
              ) : (
                <p className="mt-2 text-[11px] font-semibold text-slate-500">
                  {DAILY_GOAL - Math.min(minutesToday, DAILY_GOAL)} more focused
                  minutes to earn {DAILY_GOAL_REWARD} coins
                </p>
              )}
            </section>

            <section className="mt-3 rounded-2xl border border-slate-200/70 bg-white p-4 text-left shadow-sm">
              <header className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 text-slate-500">
                  <Icon name="calendar" size={16} plate />
                  <h2 className="text-[11px] font-black uppercase tracking-widest">
                    Streak check-in
                  </h2>
                </div>
                <span className="whitespace-nowrap rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-black tabular-nums tracking-wider text-brand-600">
                  Cycle {displayJackpots + 1} · ×{formatMult(mult)}
                </span>
              </header>
              <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-amber-600">
                <Icon name="flame" size={12} />
                {currentStreak} day{currentStreak === 1 ? '' : 's'} in your streak
              </p>
              {/* Seven cells need 332px of content width to clear 44px
                  each (7*44 + 6*4 gap), which is a 400px viewport once the
                  page and card padding are added. Below that the strip
                  wraps to 4+3 rather than shipping a 39px tap target. */}
              <div className="mt-2 grid grid-cols-4 gap-1 min-[400px]:grid-cols-7 sm:gap-1.5">
                {DAY_REWARDS.map((reward, i) => {
                  const day = i + 1;
                  const escalated = checkinReward(day, displayJackpots);
                  const claimed = completedCycleToday || day <= checkinProgress;
                  const claimable = day === claimableDay;
                  const isJackpot = day === DAY_REWARDS.length;
                  return (
                    <button
                      key={day}
                      disabled={!claimable}
                      onClick={() => onClaimDay(day)}
                      aria-label={
                        claimed
                          ? `Day ${day} claimed`
                          : claimable
                            ? `Claim day ${day} reward, ${escalated} coins`
                            : `Day ${day} locked, ${escalated} coins`
                      }
                      className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-lg border px-1 py-1.5 transition-all duration-200 active:scale-90 ${
                        claimed
                          ? 'border-emerald-300 bg-emerald-50'
                          : claimable
                            ? 'animate-pulse border-amber-300 bg-gradient-to-b from-amber-100 to-amber-50 shadow-md shadow-amber-500/20'
                            : 'border-slate-200 bg-slate-50 opacity-70'
                      }`}
                    >
                      <span
                        className={`text-[10px] font-bold ${
                          claimed
                            ? 'text-emerald-600'
                            : claimable
                              ? 'text-amber-600'
                              : 'text-slate-500'
                        }`}
                      >
                        {isJackpot && !claimed ? (
                          <Icon name="crown" size={12} className="mx-auto" />
                        ) : (
                          `D${day}`
                        )}
                      </span>
                      <span className="flex items-center gap-0.5 text-[11px] font-black tabular-nums text-slate-700">
                        <Icon name="coin" size={9} />
                        {escalated}
                      </span>
                      <span
                        className={`text-[10px] font-black ${
                          claimed
                            ? 'text-emerald-600'
                            : claimable
                              ? 'text-amber-600'
                              : 'text-slate-400'
                        }`}
                      >
                        {claimed ? (
                          <Icon name="check" size={11} className="mx-auto" />
                        ) : claimable ? (
                          'CLAIM'
                        ) : (
                          <Icon name="lock" size={10} className="mx-auto" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[10px] font-semibold leading-relaxed text-slate-500">
                {checkinStatus}
              </p>
            </section>

            <section className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 text-left shadow-sm">
              <Icon name="gift" size={18} plate />
              <div className="min-w-0 flex-1">
                <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                  Daily gift
                </h2>
                <p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">
                  {bonusAvailable
                    ? 'Free coins once each day. No focus session needed.'
                    : 'Collected today. A new gift is available tomorrow.'}
                </p>
              </div>
              {bonusAvailable ? (
                <button
                  onClick={onCollectBonus}
                  className="flex min-h-11 shrink-0 items-center gap-1 rounded-xl bg-amber-500 px-3 py-2 text-xs font-black uppercase tracking-wide text-white shadow-sm shadow-amber-500/30 transition-transform active:scale-95"
                >
                  Collect +{bonusValue}
                  <Icon name="coin" size={12} tone="inherit" />
                </button>
              ) : (
                <span className="flex min-h-11 shrink-0 items-center gap-1 rounded-xl bg-emerald-50 px-2.5 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                  <Icon name="check" size={11} tone="emerald" />
                  Collected
                </span>
              )}
            </section>

            <div className="md:grid md:grid-cols-2 md:items-start md:gap-x-6">
              <div>
                <AchievementsCard
                  longestSession={longestSession}
                  bestStreak={bestStreak}
                  petsOwned={ownedMascots.length}
                  focusSeconds={focusSeconds}
                  totalSessions={totalSessions}
                  jackpots={jackpots}
                />
              </div>

              <div>
                <PetCollection
                  stats={{ focusSeconds, totalSessions, bestStreak }}
                  ownedMascots={ownedMascots}
                  activeMascot={activeMascot}
                  onEquip={onEquipMascot}
                />
              </div>
            </div>
          </>
        )}

        {tab === 'collect' && (
          <div className="md:grid md:grid-cols-2 md:items-start md:gap-x-6">
            <div>
              <AccessoryShop
                coins={coins}
                ownedAccessories={ownedAccessories}
                equippedAccessory={equippedAccessory}
                onBuy={onBuyAccessory}
                onEquip={onEquipAccessory}
              />
            </div>
            <div>
              <ThemeShop
                coins={coins}
                ownedThemes={ownedThemes}
                activeTheme={activeTheme}
                onBuy={onBuyTheme}
                onEquip={onEquipTheme}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardsPage;
