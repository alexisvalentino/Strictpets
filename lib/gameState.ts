// Local-first gamification state: streak, focus coins, daily goal, and the
// Day 1-7 check-in strip. Everything persists to localStorage — no backend.

export const STORAGE_KEY = 'focus-tracker:game';
export const MIN_SESSION_SECONDS = 10;
export const MAX_SESSION_SECONDS = 4 * 60 * 60;

// Convert the custom-duration picker (minutes + seconds) into a goal that
// recordSession will actually reward. The inputs allow 240 min + 59 s, which
// would otherwise exceed MAX_SESSION_SECONDS and silently pay nothing.
// Returns null when the goal is below the minimum (keep the previous goal).
export const clampCustomDuration = (minutes: number, seconds: number): number | null => {
  const m = Number.isFinite(minutes) ? Math.max(0, Math.min(240, Math.trunc(minutes))) : 0;
  const s = Number.isFinite(seconds) ? Math.max(0, Math.min(59, Math.trunc(seconds))) : 0;
  const total = Math.min(MAX_SESSION_SECONDS, m * 60 + s);
  return total < MIN_SESSION_SECONDS ? null : total;
};
export const DAILY_GOAL = 15; // focus MINUTES needed per day (not session count)
export const DAILY_GOAL_REWARD = 60; // coins for completing the daily goal
// The daily goal measures real focus time, so ten 30-second taps cannot claim
// it — and a long session counts for what it actually gave you.
// Rewards for consecutive focus days (Day 1..7 check-in strip).
// The strip never stalls: each completed cycle escalates every reward by
// +50% (capped at ×4) so the Day-7 jackpot keeps growing cycle after cycle.
export const DAY_REWARDS = [10, 20, 30, 50, 80, 120, 200];
export const CHECKIN_ESCALATION_PER_CYCLE = 0.5; // +50% per completed cycle
export const CHECKIN_ESCALATION_CAP = 4; // rewards stop growing at ×4

// Reward multiplier for the current check-in cycle (0 = first cycle).
// Derived from jackpots claimed, which is exactly the number of completed cycles.
export const checkinMultiplier = (cycles: number): number =>
  Math.min(1 + CHECKIN_ESCALATION_PER_CYCLE * cycles, CHECKIN_ESCALATION_CAP);

// Escalated reward for Day N of the current cycle (cycle number = jackpots).
export const checkinReward = (day: number, cycles: number): number =>
  Math.round(DAY_REWARDS[day - 1] * checkinMultiplier(cycles));
// --- Streak freeze (Duolingo model) ---
// Buy protection BEFORE a miss: each freeze covers one missed day, so the
// streak survives a gap instead of resetting. Complements the paid repair
// (repair = pay after, freeze = pay before).
export const STREAK_FREEZE_COST = 120;
export const STREAK_FREEZE_MAX = 3; // cap how many can be hoarded (base)
// --- Event mechanics (the banners are real) ---
export const WEEKEND_MULTIPLIER = 2; // ×2 coins for sessions on Sat/Sun
export const RECORD_BONUS = 50; // coins for beating your longest session
// The record bonus is a daily trophy, not a per-session one. Paying it on every
// new best let a player nudge the goal up a second at a time and collect 50
// coins per session — 111 short sessions earned 8x the honest rate. It is now
// gated by `recordBonusDate`, so it is paid at most once per calendar day.

// --- Mascot accessories (cosmetics) ---
export const ACCESSORY_CATALOG = [
  { id: 'flower', name: 'Flower', price: 60 },
  { id: 'bow', name: 'Red Bow', price: 150 },
  { id: 'party-hat', name: 'Party Hat', price: 220 },
  { id: 'cap', name: 'Cap', price: 300 },
  { id: 'sunglasses', name: 'Shades', price: 450 },
  { id: 'crown', name: 'Crown', price: 900 },
] as const;

export type AccessoryId = (typeof ACCESSORY_CATALOG)[number]['id'];

export const isAccessoryId = (id: string): id is AccessoryId =>
  ACCESSORY_CATALOG.some(a => a.id === id);

// --- App themes (cosmetic) ---
// The "blue" theme is the free default; the rest swap the brand/sky palette
// via CSS variables (see styles/global.css `[data-theme]` blocks).
export const THEME_CATALOG = [
  { id: 'blue', name: 'Sky Blue', price: 0, swatch: ['#1A6DFF', '#38BDF8'] },
  { id: 'pink', name: 'Rose Pink', price: 600, swatch: ['#E11D48', '#FB7185'] },
  { id: 'purple', name: 'Violet', price: 600, swatch: ['#7C3AED', '#A78BFA'] },
  { id: 'emerald', name: 'Emerald', price: 600, swatch: ['#059669', '#34D399'] },
] as const;

export type ThemeId = (typeof THEME_CATALOG)[number]['id'];

export const isThemeId = (id: string): id is ThemeId =>
  THEME_CATALOG.some(t => t.id === id);

// --- Pet collection ---
// Pets are EARNED by focusing, never bought. Each one unlocks from a lifetime
// milestone: total focused minutes, completed sessions, or best streak. The
// bear is the starter. Mixed goal kinds mean some friend is always close.
export type PetUnlock =
  | { readonly kind: 'starter' }
  | { readonly kind: 'minutes' | 'sessions' | 'streak'; readonly value: number };

interface PetDef {
  readonly id: string;
  readonly name: string;
  readonly unlock: PetUnlock;
}

export const MASCOT_CATALOG = [
  { id: 'bear', name: 'Bear', unlock: { kind: 'starter' } },
  { id: 'cat', name: 'Cat', unlock: { kind: 'sessions', value: 1 } },
  { id: 'chick', name: 'Chick', unlock: { kind: 'minutes', value: 15 } },
  { id: 'frog', name: 'Frog', unlock: { kind: 'minutes', value: 30 } },
  { id: 'rabbit', name: 'Rabbit', unlock: { kind: 'minutes', value: 60 } },
  { id: 'fish', name: 'Fish', unlock: { kind: 'streak', value: 3 } },
  { id: 'dog', name: 'Dog', unlock: { kind: 'minutes', value: 120 } },
  { id: 'hamster', name: 'Hamster', unlock: { kind: 'sessions', value: 10 } },
  { id: 'mouse', name: 'Mouse', unlock: { kind: 'minutes', value: 180 } },
  { id: 'penguin', name: 'Penguin', unlock: { kind: 'minutes', value: 300 } },
  { id: 'fox', name: 'Fox', unlock: { kind: 'streak', value: 7 } },
  { id: 'koala', name: 'Koala', unlock: { kind: 'minutes', value: 480 } },
  { id: 'panda', name: 'Panda', unlock: { kind: 'minutes', value: 720 } },
  { id: 'pig', name: 'Piglet', unlock: { kind: 'sessions', value: 25 } },
  { id: 'owl', name: 'Owl', unlock: { kind: 'minutes', value: 960 } },
  { id: 'turtle', name: 'Turtle', unlock: { kind: 'streak', value: 14 } },
  { id: 'tiger', name: 'Tiger', unlock: { kind: 'minutes', value: 1440 } },
  { id: 'lion', name: 'Lion', unlock: { kind: 'minutes', value: 2160 } },
  { id: 'monkey', name: 'Monkey', unlock: { kind: 'sessions', value: 50 } },
  { id: 'unicorn', name: 'Unicorn', unlock: { kind: 'minutes', value: 3000 } },
  { id: 'octopus', name: 'Octopus', unlock: { kind: 'streak', value: 30 } },
  { id: 'dragon', name: 'Dragon', unlock: { kind: 'minutes', value: 6000 } },
] as const satisfies readonly PetDef[];

export type MascotId = (typeof MASCOT_CATALOG)[number]['id'];
export type PetInfo = (typeof MASCOT_CATALOG)[number];

export const isMascotId = (id: string): id is MascotId =>
  MASCOT_CATALOG.some(m => m.id === id);

// The lifetime stats pet unlocks are measured against (GameState satisfies it).
export interface PetStats {
  focusSeconds: number; // lifetime focused seconds
  totalSessions: number;
  bestStreak: number;
}

// Whole focused minutes from the lifetime second counter.
export const focusMinutes = (s: PetStats): number => Math.floor(s.focusSeconds / 60);

// Progress toward one pet: current value, target, and whether it is earned.
export const petProgress = (
  s: PetStats,
  pet: PetInfo,
): { current: number; target: number; earned: boolean } => {
  const u: PetUnlock = pet.unlock;
  if (u.kind === 'starter') return { current: 1, target: 1, earned: true };
  const current =
    u.kind === 'minutes'
      ? focusMinutes(s)
      : u.kind === 'sessions'
        ? s.totalSessions
        : s.bestStreak;
  return { current: Math.min(current, u.value), target: u.value, earned: current >= u.value };
};

const formatHoursMinutes = (min: number): string => {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
};

// "Focus 2 h in total" — the goal, phrased for a locked card.
export const petGoalText = (pet: PetInfo): string => {
  const u: PetUnlock = pet.unlock;
  if (u.kind === 'starter') return 'Your first friend';
  if (u.kind === 'minutes') return `Focus ${formatHoursMinutes(u.value)} in total`;
  if (u.kind === 'sessions') {
    return u.value === 1 ? 'Finish your first session' : `Finish ${u.value} sessions`;
  }
  return `Reach a ${u.value}-day streak`;
};

// "12 min to go" / "3 sessions to go" / "2 more streak days".
export const petRemainingText = (s: PetStats, pet: PetInfo): string => {
  const { current, target, earned } = petProgress(s, pet);
  if (earned) return 'Unlocked';
  const left = target - current;
  const u: PetUnlock = pet.unlock;
  if (u.kind === 'minutes') return `${formatHoursMinutes(left)} to go`;
  if (u.kind === 'sessions') return `${left} session${left === 1 ? '' : 's'} to go`;
  return `${left} more streak day${left === 1 ? '' : 's'}`;
};

// Every pet the stats have earned (starter included), in catalog order.
export const earnedPets = (s: PetStats): MascotId[] =>
  MASCOT_CATALOG.filter(p => petProgress(s, p).earned).map(p => p.id);

// Add newly earned pets to the collection. Never removes a pet (legacy saves
// keep pets bought with coins under the old shop).
export const unlockEarnedPets = (
  s: GameState,
): { state: GameState; newlyUnlocked: MascotId[] } => {
  const newlyUnlocked = earnedPets(s).filter(id => !s.ownedMascots.includes(id));
  if (newlyUnlocked.length === 0) return { state: s, newlyUnlocked };
  // Keep the collection in catalog order.
  const owned = new Set<MascotId>([...s.ownedMascots, ...newlyUnlocked]);
  return {
    state: { ...s, ownedMascots: MASCOT_CATALOG.filter(p => owned.has(p.id)).map(p => p.id) },
    newlyUnlocked,
  };
};

// The locked pet you are closest to (largest fraction done), or null when the
// whole collection is unlocked. Ties go to catalog order.
export const nextPetGoal = (s: GameState): PetInfo | null => {
  let best: PetInfo | null = null;
  let bestRatio = -1;
  for (const pet of MASCOT_CATALOG) {
    if (s.ownedMascots.includes(pet.id)) continue;
    const { current, target } = petProgress(s, pet);
    const ratio = target > 0 ? current / target : 0;
    if (ratio > bestRatio) {
      best = pet;
      bestRatio = ratio;
    }
  }
  return best;
};

// --- Temptation-tax levers ---
// A failed session still pays a crumb: 1 coin per 30s survived (vs the full
// duration/10 on success), so giving in is always a net loss.
export const FAIL_CONSOLATION_PER_5_MIN = 1;
// Coins required to retroactively mark yesterday as focused (a paid "make-up"
// check-in) and keep the streak alive after a missed day.
export const STREAK_REPAIR_COST = 160;

export interface GameState {
  coins: number;
  currentStreak: number;
  bestStreak: number;
  lastFocusDate: string | null; // YYYY-MM-DD of the last completed session
  dailyProgressDate: string | null; // date completedToday/dailyGoalClaimed belong to
  completedToday: number; // sessions completed today
  minutesToday: number; // focused minutes today (what the daily goal measures)
  dailyGoalClaimed: boolean;
  dailyBonusDate: string | null; // date the floating daily bonus was collected
  claimedDays: number[]; // days claimed in the current 7-day check-in cycle
  ownedMascots: MascotId[]; // pets earned by focusing (plus any from the old coin shop)
  activeMascot: MascotId; // the one currently equipped
  ownedAccessories: AccessoryId[]; // cosmetics bought in the shop
  equippedAccessory: AccessoryId | null; // the one worn by the mascot
  streakFreezes: number; // unused streak-freeze shields (0..STREAK_FREEZE_MAX)
  focusSeconds: number; // lifetime focused seconds (every completed session, in full)
  ownedThemes: ThemeId[]; // themes bought (blue is always owned)
  activeTheme: ThemeId; // the one applied to the whole app
  longestSession: number; // longest completed session in seconds (record)
  recordBonusDate: string | null; // date the once-per-day record bonus was paid
  totalSessions: number; // completed sessions of all time
  jackpots: number; // Day-7 jackpots claimed (check-in cycles completed)
  lastCheckinDate: string | null; // YYYY-MM-DD of the last check-in day claimed (one per day cap)
  focusLog: FocusLogEntry[]; // per-day session history, oldest first (last FOCUS_LOG_DAYS days)
}

// --- Focus history ---
export const FOCUS_LOG_DAYS = 60;
export interface FocusLogEntry {
  date: string; // YYYY-MM-DD
  sessions: number;
  seconds: number;
}

export const defaultGameState = (): GameState => ({
  coins: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastFocusDate: null,
  dailyProgressDate: null,
  completedToday: 0,
  minutesToday: 0,
  dailyGoalClaimed: false,
  dailyBonusDate: null,
  claimedDays: [],
  ownedMascots: ['bear'],
  activeMascot: 'bear',
  ownedAccessories: [],
  equippedAccessory: null,
  streakFreezes: 0,
  focusSeconds: 0,
  ownedThemes: ['blue'],
  activeTheme: 'blue',
  longestSession: 0,
  recordBonusDate: null,
  totalSessions: 0,
  jackpots: 0,
  lastCheckinDate: null,
  focusLog: [],
});

// --- Calendar helpers ---
export const todayKey = (d: Date = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const yesterdayKey = (d: Date = new Date()): string => {
  const y = new Date(d);
  y.setDate(y.getDate() - 1);
  return todayKey(y);
};

const dateOrdinal = (key: string): number | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [year, month, day] = key.split('-').map(Number);
  const time = Date.UTC(year, month - 1, day);
  const parsed = new Date(time);
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }
  return Math.floor(time / 86400000);
};

const validDateKey = (value: unknown): string | null =>
  typeof value === 'string' && dateOrdinal(value) !== null ? value : null;

const safeInt = (value: unknown, max = Number.MAX_SAFE_INTEGER): number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
    ? Math.min(value, max)
    : 0;

const safeNumber = (value: unknown, max: number): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.min(value, max)
    : 0;

// Keep only well-formed, unique days (first wins), oldest first, capped.
const sanitizeFocusLog = (value: unknown): FocusLogEntry[] => {
  if (!Array.isArray(value)) return [];
  const byDate = new Map<string, FocusLogEntry>();
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const e = raw as Partial<FocusLogEntry>;
    const date = validDateKey(e.date);
    const sessions = safeInt(e.sessions);
    if (date === null || sessions < 1 || byDate.has(date)) continue;
    byDate.set(date, {
      date,
      sessions,
      seconds: safeInt(e.seconds, sessions * MAX_SESSION_SECONDS),
    });
  }
  return Array.from(byDate.values())
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .slice(-FOCUS_LOG_DAYS);
};

// Add one completed session to today's history entry.
const logSession = (log: FocusLogEntry[], date: string, seconds: number): FocusLogEntry[] => {
  const last = log[log.length - 1];
  const next =
    last && last.date === date
      ? [...log.slice(0, -1), { date, sessions: last.sessions + 1, seconds: last.seconds + seconds }]
      : [...log, { date, sessions: 1, seconds }];
  return next.slice(-FOCUS_LOG_DAYS);
};

// The last `days` calendar days ending today (oldest first), zero-filled.
export const recentFocusDays = (
  s: GameState,
  days: number,
  now: Date = new Date(),
): FocusLogEntry[] => {
  const byDate = new Map(s.focusLog.map(e => [e.date, e]));
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    const date = todayKey(d);
    return byDate.get(date) ?? { date, sessions: 0, seconds: 0 };
  });
};

// Lifetime focused seconds from a save. Old saves only had whole minutes;
// pre-migration builds dropped the remainder of every session, so the
// session count is the best lower bound for what is missing.
const lifetimeFocusSeconds = (parsed: Partial<GameState> & Record<string, unknown>): number => {
  const stored = safeInt(parsed.focusSeconds);
  if (stored > 0) return stored;
  const legacyMinutes = safeInt(parsed.forestFocusMinutes);
  return legacyMinutes * 60 + Math.min(safeInt(parsed.totalSessions), 59);
};

export const loadGameState = (): GameState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultGameState();
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return defaultGameState();
    }
    const parsed = value as Partial<GameState>;
    // Coerce mascot fields so older saves (without them) get sane defaults.
    const ownedMascots: MascotId[] = Array.from(
      new Set<MascotId>([
        'bear',
        ...(Array.isArray(parsed.ownedMascots)
          ? parsed.ownedMascots.filter(isMascotId)
          : []),
      ]),
    );
    const storedActive = parsed.activeMascot;
    const activeMascot: MascotId =
      storedActive && isMascotId(storedActive) && ownedMascots.includes(storedActive)
        ? storedActive
        : (ownedMascots[0] ?? 'bear');
    const ownedAccessories: AccessoryId[] = Array.isArray(parsed.ownedAccessories)
      ? Array.from(new Set(parsed.ownedAccessories.filter(isAccessoryId)))
      : [];
    const equippedAccessory: AccessoryId | null =
      parsed.equippedAccessory &&
      isAccessoryId(parsed.equippedAccessory) &&
      ownedAccessories.includes(parsed.equippedAccessory)
        ? parsed.equippedAccessory
        : null;
    const ownedThemes: ThemeId[] = Array.isArray(parsed.ownedThemes)
      ? Array.from(new Set<ThemeId>(['blue', ...parsed.ownedThemes.filter(isThemeId)]))
      : ['blue'];
    const storedTheme = parsed.activeTheme;
    const activeTheme: ThemeId =
      storedTheme && isThemeId(storedTheme) && ownedThemes.includes(storedTheme)
        ? storedTheme
        : 'blue';
    // Older saves used lastFocusDate for both streaks and daily counters.
    const lastFocusDate = validDateKey(parsed.lastFocusDate);
    const dailyProgressDate =
      validDateKey(parsed.dailyProgressDate) ?? lastFocusDate;
    const totalSessions = safeInt(parsed.totalSessions);
    const claimedValues = Array.isArray(parsed.claimedDays)
      ? new Set(parsed.claimedDays.filter(Number.isSafeInteger))
      : new Set<number>();
    const claimedDays: number[] = [];
    for (let day = 1; day < DAY_REWARDS.length && claimedValues.has(day); day += 1) {
      claimedDays.push(day);
    }
    const loaded: GameState = {
      coins: safeInt(parsed.coins),
      currentStreak: safeInt(parsed.currentStreak),
      bestStreak: safeInt(parsed.bestStreak),
      lastFocusDate,
      dailyProgressDate,
      completedToday: safeInt(parsed.completedToday),
      minutesToday: safeInt(parsed.minutesToday),
      dailyGoalClaimed: parsed.dailyGoalClaimed === true,
      dailyBonusDate: validDateKey(parsed.dailyBonusDate),
      claimedDays,
      ownedMascots,
      activeMascot,
      ownedAccessories,
      equippedAccessory,
      streakFreezes: safeInt(parsed.streakFreezes, STREAK_FREEZE_MAX),
      focusSeconds: lifetimeFocusSeconds(parsed),
      ownedThemes,
      activeTheme,
      longestSession: safeInt(parsed.longestSession, MAX_SESSION_SECONDS),
      recordBonusDate: validDateKey(parsed.recordBonusDate),
      totalSessions,
      jackpots: safeInt(parsed.jackpots),
      lastCheckinDate: validDateKey(parsed.lastCheckinDate),
      focusLog: sanitizeFocusLog(parsed.focusLog),
    };
    // The forest is gone as of v6. Coins a player donated to it were spent on
    // something they can no longer see, so they come back once — refunded the
    // first time an older save is loaded and then zeroed, which makes the
    // migration idempotent no matter how many times it runs.
    const legacyDonated = safeInt((value as { forestDonated?: unknown }).forestDonated);
    if (legacyDonated > 0) {
      loaded.coins += legacyDonated;
    }
    // Grant every pet the saved stats already earned (silently — e.g. players
    // upgrading from the coin shop get credit for the focusing they did).
    return unlockEarnedPets(loaded).state;
  } catch {
    return defaultGameState();
  }
};

export const saveGameState = (s: GameState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // Storage unavailable (private mode etc.) — the game still runs in-memory.
  }
};

// A running timer is intentionally not resumed after a reload: time spent with
// the app closed cannot be verified as focused time. Persist only an interruption
// marker, never elapsed time or a reward, so a restart can explain the failure.
const SESSION_MARKER_KEY = 'focus-tracker:running-session';

export const markSessionRunning = (): void => {
  try {
    localStorage.setItem(SESSION_MARKER_KEY, 'running');
  } catch {
    // The timer still works without storage; crash recovery is unavailable.
  }
};

export const clearSessionRunning = (): void => {
  try {
    localStorage.removeItem(SESSION_MARKER_KEY);
  } catch {
    // Storage unavailable.
  }
};

export const consumeInterruptedSession = (): boolean => {
  try {
    const interrupted = localStorage.getItem(SESSION_MARKER_KEY) === 'running';
    localStorage.removeItem(SESSION_MARKER_KEY);
    return interrupted;
  } catch {
    return false;
  }
};

// A streak can remain in storage during the one-day paid-repair window, but it
// must not be shown as active unless its gap is already covered by freezes.
export const activeStreak = (s: GameState, now: Date = new Date()): number => {
  if (s.currentStreak === 0 || s.lastFocusDate === null) return 0;
  const gap = daysBetween(s.lastFocusDate, todayKey(now));
  if (gap < 0) return 0;
  // The streak is still alive inside the one-day repair window, or whenever
  // pre-owned freezes cover every missed day. Anything longer is gone.
  return gap <= 2 || s.streakFreezes >= gap - 1 ? s.currentStreak : 0;
};

// Roll daily counters over and discard streaks that can no longer be repaired
// or protected. Keep a repairable streak in storage for one day, while the UI
// uses activeStreak to display zero until it is repaired.
// ALWAYS returns a fresh object so callers can never mutate live state.
export const normalizeForToday = (
  s: GameState,
  now: Date = new Date(),
): GameState => {
  const today = todayKey(now);
  const age = s.dailyProgressDate ? daysBetween(s.dailyProgressDate, today) : 1;
  if (age < 0) return { ...s }; // Do not overwrite future progress on clock rollback.
  const gap = s.lastFocusDate ? daysBetween(s.lastFocusDate, today) : Infinity;
  const expired =
    s.currentStreak > 0 && gap > 2 && s.streakFreezes < gap - 1;
  return {
    ...s,
    currentStreak: expired ? 0 : s.currentStreak,
    claimedDays: expired ? [] : s.claimedDays,
    dailyProgressDate: age > 0 ? today : s.dailyProgressDate,
    completedToday: age > 0 ? 0 : s.completedToday,
    minutesToday: age > 0 ? 0 : s.minutesToday,
    dailyGoalClaimed: age > 0 ? false : s.dailyGoalClaimed,
  };
};

export const isWeekend = (d: Date = new Date()): boolean => {
  const day = d.getDay(); // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6;
};

export interface SessionResult {
  coinsEarned: number; // already includes weekend multiplier + record bonus
  baseCoins: number; // before weekend/record bonuses
  weekendBonus: boolean; // weekend double points was active
  newRecord: boolean; // beat the longest-session record
  recordBonus: number;
  streakIncreased: boolean;
  streak: number;
  bestStreak: number;
  dailyGoalReached: boolean;
  freezeUsed: number; // streak-freeze shields consumed to save the streak
  newPets: MascotId[]; // pets this session unlocked (for the celebration)
}

// Called when a focus session completes successfully. `now` is injectable for
// testing (weekend double points depends on the completion day).
export const recordSession = (
  prev: GameState,
  seconds: number,
  now: Date = new Date(),
): { state: GameState; result: SessionResult } => {
  const s = normalizeForToday(prev, now);
  const t = todayKey(now);
  if (
    !Number.isSafeInteger(seconds) ||
    seconds < MIN_SESSION_SECONDS ||
    seconds > MAX_SESSION_SECONDS ||
    (s.lastFocusDate !== null && daysBetween(s.lastFocusDate, t) < 0) ||
    (s.dailyProgressDate !== null && daysBetween(s.dailyProgressDate, t) < 0)
  ) {
    return {
      state: s,
      result: {
        coinsEarned: 0,
        baseCoins: 0,
        weekendBonus: false,
        newRecord: false,
        recordBonus: 0,
        streakIncreased: false,
        streak: s.currentStreak,
        bestStreak: s.bestStreak,
        dailyGoalReached:
          !s.dailyGoalClaimed && s.minutesToday >= DAILY_GOAL,
        freezeUsed: 0,
        newPets: [],
      },
    };
  }
  const weekendBonus = isWeekend(now);
  const baseCoins = Math.round(seconds / 10);
  const coinsEarned = weekendBonus ? baseCoins * WEEKEND_MULTIPLIER : baseCoins;
  const newRecord = seconds > s.longestSession;
  // The record bonus is paid at most once per calendar day, so creeping the
  // goal up one second per session cannot farm it.
  const recordBonus =
    newRecord && s.recordBonusDate !== t ? RECORD_BONUS : 0;

  // Focused minutes still count toward the pet collection through
  // focusSeconds below; the forest loop that consumed them is gone.
  const focusedMinutes = Math.floor(seconds / 60);

  let currentStreak = s.currentStreak;
  let freezeUsed = 0;
  if (s.lastFocusDate === t) {
    // Already focused today — the streak is unchanged, not extended.
  } else if (s.lastFocusDate === yesterdayKey(now)) {
    currentStreak += 1;
  } else if (s.lastFocusDate !== null && s.currentStreak > 0) {
    // Missed one or more full days. Each freeze shields one missed day;
    // they only get consumed if they fully cover the gap and save the streak.
    const missed = daysBetween(s.lastFocusDate, t); // >= 2
    const need = missed - 1;
    if (need > 0 && s.streakFreezes >= need) {
      currentStreak += 1;
      freezeUsed = need;
    } else {
      // Not enough shields to bridge the whole gap. They stay in stock so a
      // future missed day can still be protected, and the streak restarts.
      currentStreak = 1;
    }
  } else {
    currentStreak = 1; // gap of a day or more — streak restarts
  }

  const recorded: GameState = {
    ...s,
    currentStreak,
    bestStreak: Math.max(s.bestStreak, currentStreak),
    lastFocusDate: t,
    dailyProgressDate: t,
    coins: s.coins + coinsEarned + recordBonus,
    completedToday: s.completedToday + 1,
    minutesToday: s.minutesToday + focusedMinutes,
    streakFreezes: s.streakFreezes - freezeUsed,
    longestSession: Math.max(s.longestSession, seconds),
    recordBonusDate: recordBonus > 0 ? t : s.recordBonusDate,
    totalSessions: s.totalSessions + 1,
    // A genuinely broken streak also starts a fresh check-in cycle. Freezes
    // preserve both the streak and its check-in progress.
    claimedDays:
      (s.lastFocusDate !== null &&
        s.lastFocusDate !== t &&
        s.lastFocusDate !== yesterdayKey(now) &&
        freezeUsed === 0) || currentStreak === 0
        ? []
        : s.claimedDays,
    focusSeconds: s.focusSeconds + seconds,
    focusLog: logSession(s.focusLog, t, seconds),
  };
  // The stats just moved, so this session may have earned new friends.
  const { state, newlyUnlocked } = unlockEarnedPets(recorded);

  return {
    state,
    result: {
      coinsEarned: coinsEarned + recordBonus,
      baseCoins,
      weekendBonus,
      newRecord,
      recordBonus,
      // `streakIncreased` reports whether the streak count actually moved, so
      // the UI never announces a day that did not advance.
      streakIncreased: currentStreak > s.currentStreak,
      streak: currentStreak,
      bestStreak: state.bestStreak,
      dailyGoalReached:
        !state.dailyGoalClaimed && state.minutesToday >= DAILY_GOAL,
      freezeUsed,
      newPets: newlyUnlocked,
    },
  };
};

// The one daily-goal rule, used by both the card and the payout. Keeping two
// copies of "is the goal reached" is what made the UI test `completedToday`
// (a session count) while the engine paid on `minutesToday` — a single
// 25-minute session was payable but never offered, and fifteen one-minute
// sessions were offered but never paid.
export interface DailyGoalStatus {
  minutes: number; // focused minutes counted for today (0 when rolled over)
  target: number;
  reached: boolean; // the goal is met today
  claimed: boolean; // the bonus was already taken today
  claimable: boolean; // the card should offer the claim button
}

export const dailyGoalStatus = (
  prev: GameState,
  now: Date = new Date(),
): DailyGoalStatus => {
  const s = normalizeForToday(prev, now);
  const fresh = s.dailyProgressDate === todayKey(now);
  const minutes = fresh ? Math.min(s.minutesToday, DAILY_GOAL) : 0;
  const reached = fresh && s.minutesToday >= DAILY_GOAL;
  const claimed = fresh && s.dailyGoalClaimed;
  return {
    minutes,
    target: DAILY_GOAL,
    reached,
    claimed,
    claimable: reached && !claimed,
  };
};

// Claim the daily-goal bonus (once per day, after DAILY_GOAL focus minutes).
export const claimDailyGoal = (
  prev: GameState,
  now: Date = new Date(),
): { state: GameState; reward: number } => {
  const s = normalizeForToday(prev, now);
  if (!dailyGoalStatus(s, now).claimable) {
    return { state: s, reward: 0 };
  }
  return {
    state: {
      ...s,
      dailyGoalClaimed: true,
      coins: s.coins + DAILY_GOAL_REWARD,
    },
    reward: DAILY_GOAL_REWARD,
  };
};

// The one check-in day that can be claimed right now, or null. This is the
// single rule used by both the claim transition and the UI (strip + badge),
// so what the UI offers is always exactly what a tap will award.
export const claimableCheckinDay = (
  prev: GameState,
  now: Date = new Date(),
): number | null => {
  const s = normalizeForToday(prev, now);
  const today = todayKey(now);
  // One check-in claim per calendar day to prevent cycling infinitely
  // (also blocks claims after a clock rollback).
  if (s.lastCheckinDate !== null && daysBetween(s.lastCheckinDate, today) <= 0) {
    return null;
  }
  const day = s.claimedDays.length + 1;
  if (day > DAY_REWARDS.length || s.lastFocusDate !== today || s.currentStreak < day) {
    return null;
  }
  return day;
};

// Progress through the current 7-day check-in cycle (0..7). A Day-7 claim
// resets claimedDays, so report the completed cycle for the rest of that day.
export const checkinProgress = (s: GameState, now: Date = new Date()): number =>
  s.claimedDays.length === 0 && s.jackpots > 0 && s.lastCheckinDate === todayKey(now)
    ? DAY_REWARDS.length
    : s.claimedDays.length;

// Claim a Day N reward from the check-in strip. Claiming Day 7 completes the
// cycle and starts a fresh one, while the streak keeps counting.
export const claimDayReward = (
  prev: GameState,
  day: number,
  now: Date = new Date(),
): { state: GameState; reward: number } => {
  const s = normalizeForToday(prev, now);
  const today = todayKey(now);
  if (day !== claimableCheckinDay(s, now)) {
    return { state: s, reward: 0 };
  }
  const reward = checkinReward(day, s.jackpots);
  return {
    state: {
      ...s,
      coins: s.coins + reward,
      // Day 7 completes the cycle (jackpot!) and starts a fresh one.
      claimedDays: day === DAY_REWARDS.length ? [] : [...s.claimedDays, day],
      jackpots: s.jackpots + (day === DAY_REWARDS.length ? 1 : 0),
      lastCheckinDate: today,
    },
    reward,
  };
};

// Deterministic daily bonus value (10-30 coins), stable within the same day so
// the floating bubble always shows exactly what tapping it awards.
const hashDate = (key: string): number => {
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) % 997;
  return h;
};

export const dailyBonusValue = (now: Date = new Date()): number =>
  10 + (hashDate(todayKey(now)) % 21);

export const claimDailyBonus = (
  prev: GameState,
  now: Date = new Date(),
): { state: GameState; reward: number } => {
  const s = normalizeForToday(prev, now);
  const t = todayKey(now);
  if (
    s.dailyBonusDate !== null &&
    daysBetween(s.dailyBonusDate, t) <= 0
  ) {
    return { state: s, reward: 0 };
  }
  const reward = dailyBonusValue(now);
  return {
    state: { ...s, dailyBonusDate: t, coins: s.coins + reward },
    reward,
  };
};

// Consolation for a failed session: a small fraction of the success reward
// (≈a third per minute, i.e. 10× less than finishing the same goal), so giving
// up early is never profitable even when the goal was almost reached.
export const awardFailConsolation = (
  prev: GameState,
  survivedSeconds: number,
  now: Date = new Date(),
): { state: GameState; reward: number } => {
  const s = normalizeForToday(prev, now);
  if (!Number.isFinite(survivedSeconds) || survivedSeconds <= 0) {
    return { state: s, reward: 0 };
  }
  const safeSeconds = Math.min(Math.floor(survivedSeconds), MAX_SESSION_SECONDS);
  const reward = Math.floor(safeSeconds / 300) * FAIL_CONSOLATION_PER_5_MIN;
  if (reward <= 0) return { state: s, reward: 0 };
  return { state: { ...s, coins: s.coins + reward }, reward };
};

// Whole days between two YYYY-MM-DD keys (Infinity if `from` is null).
export const daysBetween = (from: string | null, to: string): number => {
  if (!from) return Infinity;
  const fromDay = dateOrdinal(from);
  const toDay = dateOrdinal(to);
  if (fromDay === null || toDay === null) return Infinity;
  return toDay - fromDay;
};

// A streak is repairable when it exists and at least one full day was missed
// (the next completed session would otherwise reset it to 1).
export const canRepairStreak = (s: GameState, now: Date = new Date()): boolean => {
  if (s.currentStreak <= 0 || s.lastFocusDate === null) return false;
  // If a pre-owned freeze already covers the missed day, repair would spend
  // coins for no benefit: the next session will consume that freeze instead.
  const gap = daysBetween(s.lastFocusDate, todayKey(now));
  return gap === 2 && s.streakFreezes === 0;
};

// A failed attempt still marks the day: the streak you were protecting is
// either spent today or lost. Without this, failing on purpose cost nothing
// while the streak stayed safely banked for later.
export const recordFailedAttempt = (
  prev: GameState,
  now: Date = new Date(),
  gapAfterToday = 1,
): { state: GameState; lostStreak: boolean } => {
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + Math.max(1, gapAfterToday));
    // After failing today the streak is only safe if the device actually
    // tracked the missed days as covered (pre-owned freezes).
    const coversMissedDays =
      prev.lastFocusDate === null ||
      daysBetween(prev.lastFocusDate, todayKey(now)) <= 1;
    const lostStreak =
      prev.currentStreak > 0 && !coversMissedDays && activeStreak(prev, deadline) === 0;
    return { state: normalizeForToday(prev, now), lostStreak };
};

// Paid streak repair: spend coins to mark yesterday as focused, so the next
// session extends the streak instead of restarting it.
export const repairStreak = (
  prev: GameState,
  now: Date = new Date(),
): { state: GameState; repaired: boolean } => {
  const s = normalizeForToday(prev, now);
  if (!canRepairStreak(s, now) || s.coins < STREAK_REPAIR_COST) {
    return { state: s, repaired: false };
  }
  return {
    state: {
      ...s,
      coins: s.coins - STREAK_REPAIR_COST,
      lastFocusDate: yesterdayKey(now),
    },
    repaired: true,
  };
};

// --- Streak reminder (local notification) ---
// One gentle evening nudge. Picks the next reminder time (today at `hour`,
// or tomorrow if you already focused today / it's past that time) and decides
// the message by how the streak will look AT that moment. No streak = no nag.
export const REMINDER_HOUR = 20;

export interface ReminderPlan {
  at: Date;
  kind: 'keep' | 'repair'; // keep it going / it can still be repaired today
  streak: number;
}

export const streakReminderPlan = (
  prev: GameState,
  now: Date = new Date(),
  hour: number = REMINDER_HOUR,
): ReminderPlan | null => {
  const s = normalizeForToday(prev, now);
  const at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0, 0);
  if (s.lastFocusDate === todayKey(now) || now.getTime() >= at.getTime()) {
    at.setDate(at.getDate() + 1);
  }
  if (activeStreak(s, at) > 0) {
    const gap = s.lastFocusDate
      ? daysBetween(s.lastFocusDate, todayKey(at))
      : Infinity;
    // A gap the device still *remembers* is a repair job, not a "go focus"
    // nudge: at this point focusing cannot save it, only the repair can.
    const kind = gap > 1 && s.streakFreezes < gap - 1 ? 'repair' : 'keep';
    return { at, kind, streak: s.currentStreak };
  }
  if (canRepairStreak(s, at)) return { at, kind: 'repair', streak: s.currentStreak };
  return null;
};

// --- Achievements (records + unlock badges) ---
// The subset of state the badge conditions read — GameState satisfies it.
export interface AchievementStats {
  totalSessions: number;
  bestStreak: number;
  petsOwned: number;
  focusSeconds: number;
  longestSession: number;
  jackpots: number;
}

export interface Achievement {
  id: string;
  icon: AchievementIcon;
  name: string;
  desc: string;
  unlocked: (s: AchievementStats) => boolean;
}

// Icon names are resolved by components/Icon.tsx — the engine stays free of
// presentation while still declaring which glyph each badge wears.
export type AchievementIcon =
  | 'sprout'
  | 'bolt'
  | 'flame'
  | 'paw'
  | 'pets'
  | 'trophy'
  | 'timer'
  | 'dice'
  | 'crown'
  | 'target'
  | 'gem'
  | 'shield'
  | 'star'
  | 'compass'
  | 'rocket'
  | 'wings'
  | 'medal';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first',
    icon: 'sprout',
    name: 'First Focus',
    desc: 'Complete your first session',
    unlocked: s => s.totalSessions >= 1,
  },
  {
    id: 'streak3',
    icon: 'bolt',
    name: 'On a Roll',
    desc: 'Reach a 3-day streak',
    unlocked: s => s.bestStreak >= 3,
  },
  {
    id: 'streak7',
    icon: 'flame',
    name: 'Week Warrior',
    desc: 'Reach a 7-day streak',
    unlocked: s => s.bestStreak >= 7,
  },
  {
    id: 'record25',
    icon: 'trophy',
    name: 'Record Breaker',
    desc: 'Complete a 25-min session',
    unlocked: s => s.longestSession >= 1500,
  },
  {
    id: 'record60',
    icon: 'timer',
    name: 'Marathoner',
    desc: 'Complete a 1-hour session',
    unlocked: s => s.longestSession >= 3600,
  },
  {
    id: 'jackpot1',
    icon: 'dice',
    name: 'Jackpot',
    desc: 'Claim the Day-7 jackpot',
    unlocked: s => s.jackpots >= 1,
  },
  {
    id: 'jackpot3',
    icon: 'crown',
    name: 'Jackpot Master',
    desc: 'Claim the jackpot 3 times',
    unlocked: s => s.jackpots >= 3,
  },
  {
    id: 'sess10',
    icon: 'target',
    name: 'Double Digits',
    desc: 'Complete 10 sessions',
    unlocked: s => s.totalSessions >= 10,
  },
  {
    id: 'sess50',
    icon: 'gem',
    name: 'Focus Machine',
    desc: 'Complete 50 sessions',
    unlocked: s => s.totalSessions >= 50,
  },
  {
    id: 'streak14',
    icon: 'shield',
    name: 'Fortnight',
    desc: 'Reach a 14-day streak',
    unlocked: s => s.bestStreak >= 14,
  },
  {
    id: 'streak30',
    icon: 'star',
    name: 'Month Master',
    desc: 'Reach a 30-day streak',
    unlocked: s => s.bestStreak >= 30,
  },
  {
    id: 'record45',
    icon: 'rocket',
    name: 'Deep Work',
    desc: 'Complete a 45-min session',
    unlocked: s => s.longestSession >= 2700,
  },
  {
    id: 'record90',
    icon: 'wings',
    name: 'Ultra Focus',
    desc: 'Complete a 90-min session',
    unlocked: s => s.longestSession >= 5400,
  },
  {
    id: 'jackpot5',
    icon: 'medal',
    name: 'Jackpot Legend',
    desc: 'Claim 5 jackpots',
    unlocked: s => s.jackpots >= 5,
  },
  // The collection is the progression spine now that the forest is gone, so
  // these milestones measure it directly instead of counting trees.
  {
    id: 'pets5',
    icon: 'paw',
    name: 'Growing Family',
    desc: 'Meet 5 friends',
    unlocked: s => s.petsOwned >= 5,
  },
  {
    id: 'pets11',
    icon: 'pets',
    name: 'Half the Crew',
    desc: 'Meet 11 friends',
    unlocked: s => s.petsOwned >= 11,
  },
  {
    id: 'pets22',
    icon: 'compass',
    name: 'Complete Collection',
    desc: 'Meet all 22 friends',
    unlocked: s => s.petsOwned >= 22,
  },
  {
    id: 'focus10h',
    icon: 'timer',
    name: 'Ten Hours In',
    desc: 'Focus for 10 hours total',
    unlocked: s => s.focusSeconds >= 36_000,
  },
];

export const unlockedCount = (s: AchievementStats): number =>
  ACHIEVEMENTS.filter(a => a.unlocked(s)).length;

// --- Mascot shop ---

// Buy an accessory with coins (auto-equips it).
export const buyAccessory = (
  prev: GameState,
  id: AccessoryId,
): { state: GameState; ok: boolean; cost: number } => {
  const s = normalizeForToday(prev);
  const item = ACCESSORY_CATALOG.find(a => a.id === id);
  if (!item || s.ownedAccessories.includes(id) || s.coins < item.price) {
    return { state: s, ok: false, cost: item?.price ?? 0 };
  }
  return {
    state: {
      ...s,
      coins: s.coins - item.price,
      ownedAccessories: [...s.ownedAccessories, id],
      equippedAccessory: id,
    },
    ok: true,
    cost: item.price,
  };
};

// Equip an owned accessory, or pass null to take it off.
export const equipAccessory = (
  prev: GameState,
  id: AccessoryId | null,
): { state: GameState; ok: boolean } => {
  const s = normalizeForToday(prev);
  if (id !== null && !s.ownedAccessories.includes(id)) {
    return { state: s, ok: false };
  }
  if (s.equippedAccessory === id) return { state: s, ok: false };
  return { state: { ...s, equippedAccessory: id }, ok: true };
};

// Buy streak-freeze protection (capped so coins stay meaningful).
export const buyStreakFreeze = (
  prev: GameState,
): { state: GameState; ok: boolean } => {
  const s = normalizeForToday(prev);
  // A freeze is advance protection, not a cheaper retroactive repair: it
  // cannot be bought once the streak has already lapsed for a day.
  if (
    (s.currentStreak > 0 &&
      (activeStreak(s) === 0 || daysBetween(s.lastFocusDate, todayKey()) > 1)) ||
    s.streakFreezes >= STREAK_FREEZE_MAX ||
    s.coins < STREAK_FREEZE_COST
  ) {
    return { state: s, ok: false };
  }
  return {
    state: {
      ...s,
      streakFreezes: s.streakFreezes + 1,
      coins: s.coins - STREAK_FREEZE_COST,
    },
    ok: true,
  };
};

// Buy a theme (auto-applies it).
export const buyTheme = (
  prev: GameState,
  id: ThemeId,
): { state: GameState; ok: boolean; cost: number } => {
  const s = normalizeForToday(prev);
  const item = THEME_CATALOG.find(t => t.id === id);
  if (!item || item.price <= 0 || s.ownedThemes.includes(id)) {
    return { state: s, ok: false, cost: item?.price ?? 0 };
  }
  if (s.coins < item.price) return { state: s, ok: false, cost: item.price };
  return {
    state: {
      ...s,
      coins: s.coins - item.price,
      ownedThemes: [...s.ownedThemes, id],
      activeTheme: id,
    },
    ok: true,
    cost: item.price,
  };
};

export const equipTheme = (
  prev: GameState,
  id: ThemeId,
): { state: GameState; ok: boolean } => {
  const s = normalizeForToday(prev);
  if (!s.ownedThemes.includes(id) || s.activeTheme === id) {
    return { state: s, ok: false };
  }
  return { state: { ...s, activeTheme: id }, ok: true };
};

// Pets are earned, never bought — see unlockEarnedPets. Switching between
// pets you have earned is free.
export const equipMascot = (
  prev: GameState,
  id: MascotId,
): { state: GameState; ok: boolean } => {
  const s = normalizeForToday(prev);
  if (!s.ownedMascots.includes(id) || s.activeMascot === id) {
    return { state: s, ok: false };
  }
  return { state: { ...s, activeMascot: id }, ok: true };
};
