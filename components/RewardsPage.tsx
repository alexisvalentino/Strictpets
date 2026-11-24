'use client';
import { useState } from 'react';
import Icon from './Icon';
import Mascot from './Mascot';
import {
  DAILY_GOAL,
  DAILY_GOAL_REWARD,
  DAY_REWARDS,
  checkinMultiplier,
  checkinReward,
  type AppearanceMode,
  type AccessoryId,
  type MascotId,
  type PetSceneId,
  type ThemeId,
} from '../lib/gameState';
import PetCollection from './PetCollection';
import AccessoryShop from './AccessoryShop';
import ThemeShop from './ThemeShop';
import PetSceneShop from './PetSceneShop';
import AchievementsCard from './AchievementsCard';
import { nativeSelectionHaptic } from '../lib/native';

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
  ownedPetScenes: PetSceneId[];
  equippedPetScene: PetSceneId;
  appearanceMode: AppearanceMode;
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
  onBuyPetScene: (id: PetSceneId) => void;
  onEquipPetScene: (id: PetSceneId) => void;
  onSetAppearanceMode: (mode: AppearanceMode) => void;
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
  ownedPetScenes,
  equippedPetScene,
  appearanceMode,
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
  onBuyPetScene,
  onEquipPetScene,
  onSetAppearanceMode,
}: RewardsPageProps) => {
  const [tab, setTab] = useState<RewardsTab>('claim');
  const [checkinExpanded, setCheckinExpanded] = useState(claimableDay !== null);

  const goalPct = Math.min(100, (minutesToday / DAILY_GOAL) * 100);
  const completedCycleToday = checkedInToday && checkinProgress === DAY_REWARDS.length;
  const checkinDetailsOpen = checkinExpanded || claimableDay !== null;
  const displayJackpots = completedCycleToday ? Math.max(0, jackpots - 1) : jackpots;
  const mult = checkinMultiplier(displayJackpots);
  const checkinStatus = completedCycleToday
    ? 'Next cycle tomorrow.'
    : checkedInToday
      ? 'Next reward tomorrow.'
      : claimableDay !== null
        ? `Claim day ${claimableDay}.`
        : currentStreak === 0
          ? 'Focus today to begin.'
          : 'Focus today to advance.';
  const checkinSummary = claimableDay !== null
    ? `Day ${claimableDay} ready`
    : completedCycleToday
      ? 'Complete'
      : `${checkinProgress}/7`;

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

      <div className="my-auto mx-auto w-full max-w-md px-4 pt-[max(1.5rem,var(--safe-area-top))] pb-[max(1.5rem,var(--safe-area-bottom))] pl-[max(1rem,var(--safe-area-left))] pr-[max(1rem,var(--safe-area-right))] sm:px-6 md:max-w-3xl lg:max-w-4xl">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Rewards
          </h1>
          <span className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-black tabular-nums text-slate-700 shadow-sm ring-1 ring-slate-200/70">
            <Icon name="coin" size={13} />
            {coins}
          </span>
        </div>

        {/* Two fixed destinations; this is a tab strip, not a long content list. */}
        <div
          role="tablist"
          aria-label="Rewards sections"
          className="guide-segmented mt-3 flex gap-1 rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200/70"
        >
          {TABS.map(t => {
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  if (tab !== t.key) nativeSelectionHaptic();
                  setTab(t.key);
                }}
                className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold tracking-tight transition-colors active:scale-[0.99] ${
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
            <section className="mt-4 guide-panel rounded-[24px] border border-sky-100 bg-white p-3 text-left shadow-sm sm:p-4">
              <header className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="text-base font-black tracking-tight text-slate-900">Focus goal</h2>
                    <p className="shrink-0 text-xs font-bold tabular-nums text-slate-500">
                      {Math.min(minutesToday, DAILY_GOAL)}/{DAILY_GOAL} min
                    </p>
                  </div>
                </div>
                <Mascot
                  mood="idle"
                  variant={activeMascot}
                  accessory={equippedAccessory}
                  scene={equippedPetScene}
                  still
                  className="h-14 w-14 shrink-0"
                />
              </header>
              <div
                role="progressbar"
                aria-label="Today&apos;s focus progress"
                aria-valuemin={0}
                aria-valuemax={DAILY_GOAL}
                aria-valuenow={Math.min(minutesToday, DAILY_GOAL)}
                className="mt-1 h-2 w-full overflow-hidden rounded-full bg-sky-100"
              >
                <div
                  className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-sky-400 to-brand-600 transition-[width] duration-500 ease-out"
                  style={{ width: `${goalPct}%` }}
                >
                  <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent bg-[length:200%_100%]" />
                </div>
              </div>

              {dailyGoalClaimed ? (
                <p className="mt-2 flex items-center justify-center gap-1 text-[11px] font-black text-brand-700">
                  <span className="rw-pop inline-block">
                    <Icon name="check" size={12} />
                  </span>
                  Goal reward claimed today
                </p>
              ) : dailyGoalReached ? (
                <button
                  onClick={onClaimGoal}
                  className="guide-success-cta mt-2 flex min-h-12 w-full items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-brand-700 to-sky-700 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-700/20 transition-transform active:scale-[0.98]"
                >
                  Claim +{DAILY_GOAL_REWARD}
                  <Icon name="coin" size={13} tone="inherit" />
                </button>
              ) : (
                <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                  {DAILY_GOAL - Math.min(minutesToday, DAILY_GOAL)} min to go · +{DAILY_GOAL_REWARD}
                  <Icon name="coin" size={11} />
                </p>
              )}
            </section>

            <section className="mt-3 guide-panel rounded-2xl border border-slate-200/70 bg-white p-3 text-left shadow-sm">
              <h2>
                <button
                  type="button"
                  disabled={claimableDay !== null}
                  onClick={() => setCheckinExpanded(value => !value)}
                  aria-expanded={checkinDetailsOpen}
                  aria-controls="streak-checkin-details"
                  className="flex min-h-11 w-full items-center gap-2.5 text-left"
                >
                  <Icon name="calendar" size={18} className="shrink-0 text-brand-600" />
                  <span className="min-w-0 flex-1 text-sm font-bold tracking-tight text-slate-800">7-day rewards</span>
                  <span
                    aria-label={
                      claimableDay !== null
                        ? `Day ${claimableDay} reward ready`
                        : completedCycleToday
                          ? 'Reward cycle complete'
                          : `Cycle ${displayJackpots + 1}, ${checkinProgress} of 7 rewards claimed`
                    }
                    className="shrink-0 rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-black tabular-nums text-brand-700"
                  >
                    {checkinSummary}
                  </span>
                  {claimableDay === null && <Icon name={checkinDetailsOpen ? 'chevronDown' : 'chevronRight'} size={15} className="text-slate-400" />}
                </button>
              </h2>
              <div id="streak-checkin-details" className="disclosure-reveal" hidden={!checkinDetailsOpen}>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="flex items-center gap-1 text-[11px] font-bold text-brand-700">
                  <Icon name="flame" size={12} />
                  {currentStreak} day{currentStreak === 1 ? '' : 's'} in your streak
                </p>
                <span className="text-[10px] font-bold text-slate-400">Cycle {displayJackpots + 1} · ×{formatMult(mult)}</span>
              </div>
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
                      className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-lg border px-1 py-1.5 transition-colors duration-200 active:scale-90 ${
                        claimed
                          ? 'border-sky-200 bg-sky-50'
                          : claimable
                            ? 'border-brand-300 bg-sky-50 shadow-sm shadow-sky-500/10'
                            : 'border-slate-200 bg-slate-50 opacity-70'
                      }`}
                    >
                      <span
                        className={`text-[10px] font-bold ${
                          claimed
                            ? 'text-brand-700'
                            : claimable
                              ? 'text-brand-700'
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
                            ? 'text-brand-700'
                            : claimable
                              ? 'text-brand-700'
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
              </div>
            </section>

            <section className="mt-3 flex items-center gap-3 guide-panel rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-left shadow-sm">
              <Icon name="gift" size={19} className="text-brand-600" />
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold tracking-tight text-slate-800">
                  Daily gift
                </h2>
              </div>
              {bonusAvailable ? (
                <button
                  onClick={onCollectBonus}
                  className="flex min-h-11 shrink-0 items-center gap-1 rounded-xl bg-brand-600 px-3 py-2 text-xs font-bold text-white shadow-sm shadow-brand-600/20 transition-transform active:scale-[0.98]"
                >
                  Collect +{bonusValue}
                  <Icon name="coin" size={12} tone="inherit" />
                </button>
              ) : (
                <span className="flex min-h-11 shrink-0 items-center gap-1 rounded-xl bg-emerald-50 px-2.5 text-[10px] font-bold text-emerald-700">
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
                  equippedAccessory={equippedAccessory}
                  equippedPetScene={equippedPetScene}
                  onEquip={onEquipMascot}
                />
              </div>
            </div>
          </>
        )}

        {tab === 'collect' && (
          <div>
            <PetSceneShop
              coins={coins}
              activeMascot={activeMascot}
              equippedAccessory={equippedAccessory}
              ownedPetScenes={ownedPetScenes}
              equippedPetScene={equippedPetScene}
              onBuy={onBuyPetScene}
              onEquip={onEquipPetScene}
            />
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
                  appearanceMode={appearanceMode}
                  onBuy={onBuyTheme}
                  onEquip={onEquipTheme}
                  onSetAppearanceMode={onSetAppearanceMode}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardsPage;
