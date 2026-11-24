'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { IonContent } from '@ionic/react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import Mascot from './Mascot';
import ConfettiBurst from './ConfettiBurst';
import Icon, { type IconName } from './Icon';
import HomePage from './HomePage';
import RewardsPage from './RewardsPage';
import TabBar, { type TabKey } from './TabBar';
import DevTip from './DevTip';
import { useGameState } from '../lib/useGameState';
import { syncStatusBar } from '../lib/statusBar';
import {
  nativeImpactHaptic,
  nativeSelectionHaptic,
  requestReminderPermission,
  syncStreakReminder,
} from '../lib/native';
import {
  DAILY_GOAL_REWARD,
  MASCOT_CATALOG,
  RECORD_BONUS,
  STREAK_REPAIR_COST,
  activeStreak,
  awardFailConsolation,
  buyAccessory,
  buyPetScene,
  buyStreakFreeze,
  buyTheme,
  canBuyStreakFreeze,
  canRepairStreak,
  clampCustomDuration,
  checkinProgress,
  claimableCheckinDay,
  claimDailyBonus,
  claimDayReward,
  claimDailyGoal,
  clearSessionRunning,
  consumeInterruptedSession,
  dailyBonusValue,
  dailyGoalStatus,
  daysBetween,
  equipAccessory,
  equipMascot,
  equipPetScene,
  equipTheme,
  isWeekend,
  markSessionRunning,
  nextPetGoal,
  petRemainingText,
  recentFocusDays,
  recordFailedAttempt,
  recordSession,
  repairStreak,
  setAppearanceMode,
  todayKey,
  type AppearanceMode,
  type AccessoryId,
  type MascotId,
  type PetSceneId,
  type ThemeId,
} from '../lib/gameState';

type Phase = 'idle' | 'running' | 'failed' | 'done';
type FailReason = 'touch' | 'left' | 'moved' | 'interrupted';

const TAB_KEYS: TabKey[] = ['home', 'focus', 'rewards'];

const DURATIONS = [
  { label: '30s', seconds: 30 },
  { label: '1 min', seconds: 60 },
  { label: '5 min', seconds: 300 },
  { label: '25 min', seconds: 1500 },
];
// Four fixed presets fit in the setup card; a virtual list would be harder to scan.

// Motion detection tuning (DeviceMotion linear acceleration, m/s²).
const MOTION_THRESHOLD = 3.0; // magnitude that counts as "the phone moved"
const MOTION_CONSECUTIVE = 3; // consecutive samples above the threshold before failing
const MOTION_GRACE_MS = 800; // ignore motion right after pressing START (the tap itself)

const formatTime = (totalSeconds: number): string => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// Human label for custom durations, e.g. 2700 -> "45 min", 3665 -> "1 h 1 min".
const formatDurationLabel = (totalSeconds: number): string => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h} h`);
  if (m) parts.push(`${m} min`);
  if (s) parts.push(`${s} s`);
  return parts.join(' ') || '0 s';
};

// --- Sound feedback (Web Audio API — synthesized, no audio assets needed) ---
// A single AudioContext is shared and lazily created. It is unlocked on the
// START tap (a user gesture), which iOS requires before audio can play.
let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  if (audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
};

const playTone = (
  freq: number,
  delay: number,
  dur: number,
  type: OscillatorType = 'sine',
  volume = 0.25,
) => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  // Quick attack/release envelope so the tone doesn't click.
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.setValueAtTime(volume, t0 + dur - 0.06);
  gain.gain.linearRampToValueAtTime(0, t0 + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
};

const playSuccessSound = () => {
  playTone(659.25, 0, 0.16); // E5
  playTone(880, 0.18, 0.34); // A5 — rising "you win" chime
};

// Triumphant fanfare for milestones (new record / new friend): a rising
// C-E-G-C arpeggio with a high sparkle, layered after the base chime.
const playCelebrationSound = () => {
  playTone(523.25, 0.55, 0.12, 'sine', 0.22); // C5
  playTone(659.25, 0.67, 0.12, 'sine', 0.22); // E5
  playTone(783.99, 0.79, 0.12, 'sine', 0.22); // G5
  playTone(1046.5, 0.91, 0.42, 'sine', 0.26); // C6 (held)
  playTone(1567.98, 0.91, 0.42, 'triangle', 0.1); // G6 sparkle
};

const hapticCelebration = () => {
  void Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
  window.setTimeout(() => {
    void Haptics.notification({ type: NotificationType.Success }).catch(() => {});
  }, 260);
};

const playFailSound = () => {
  playTone(220, 0, 0.35, 'square', 0.14);
  playTone(165, 0.12, 0.45, 'square', 0.14); // low descending buzz
};

// --- Haptic feedback (@capacitor/haptics) ---
// On web this maps to navigator.vibrate; desktop browsers without it reject,
// so swallow the error (touch/motion detection still carries the UX).
const hapticSuccess = () => {
  void Haptics.notification({ type: NotificationType.Success }).catch(() => {});
};

const hapticFail = () => {
  void Haptics.notification({ type: NotificationType.Error }).catch(() => {});
};

// Small rising "pop" for collecting rewards (bubble, check-in, daily goal).
const playCollectSound = () => {
  playTone(880, 0, 0.07, 'sine', 0.18);
  playTone(1174.66, 0.07, 0.12, 'sine', 0.18);
};

const hapticCollect = () => {
  void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
};

const FocusSessionTimer = ({
  duration,
  startedAt,
  onComplete,
}: {
  duration: number;
  startedAt: number;
  onComplete: () => void;
}) => {
  const [elapsed, setElapsed] = useState(0);
  const progress = Math.min(100, (elapsed / duration) * 100);

  useEffect(() => {
    let completed = false;
    let lastElapsed = -1;
    const tick = () => {
      if (completed) return;
      const seconds = Math.floor((performance.now() - startedAt) / 1000);
      const nextElapsed = Math.min(seconds, duration);
      if (nextElapsed !== lastElapsed) {
        lastElapsed = nextElapsed;
        setElapsed(nextElapsed);
      }
      if (seconds >= duration) {
        completed = true;
        onComplete();
      }
    };

    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [duration, onComplete, startedAt]);

  return (
    <div
      role="progressbar"
      aria-label="Focus session progress"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={elapsed}
      aria-valuetext={`${formatTime(elapsed)} elapsed of ${formatTime(duration)}`}
      className="guide-timer-orbit relative mx-auto h-64 w-64"
    >
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'rgb(var(--sky-400, 56 189 248))' }} />
            <stop offset="100%" style={{ stopColor: 'rgb(var(--brand-600, 23 102 243))' }} />
          </linearGradient>
        </defs>
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="rgb(var(--sky-100, 224 242 254))"
          strokeWidth="9"
        />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="9"
          strokeLinecap="round"
          style={{
            strokeDasharray: 2 * Math.PI * 52,
            strokeDashoffset: 2 * Math.PI * 52 * (1 - progress / 100),
            transition: 'stroke-dashoffset 0.2s linear',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-600">
          Focus time
        </p>
        <div className="text-5xl font-black tabular-nums tracking-tight text-slate-900">
          {formatTime(elapsed)}
        </div>
        <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
          goal {formatTime(duration)}
        </div>
      </div>
    </div>
  );
};

const FocusTracker = () => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [failReason, setFailReason] = useState<FailReason>('touch');
  const [duration, setDuration] = useState(60);
  const [customOpen, setCustomOpen] = useState(false);
  const [customMin, setCustomMin] = useState('');
  const [customSec, setCustomSec] = useState('');
  const { game, gameRef, update } = useGameState();
  const petName =
    MASCOT_CATALOG.find(m => m.id === game.activeMascot)?.name ?? 'Your pet';
  const nextPet = nextPetGoal(game);
  const [lastCoinsEarned, setLastCoinsEarned] = useState(0);
  const [lastFreezeUsed, setLastFreezeUsed] = useState(0);
  const [lastWeekendBonus, setLastWeekendBonus] = useState(false);
  const [lastNewRecord, setLastNewRecord] = useState(false);
  const [lastNewPets, setLastNewPets] = useState<MascotId[]>([]);
  const [popText, setPopText] = useState<{ text: string; icon: IconName } | null>(null);
  const [failResult, setFailResult] = useState<{
    seconds: number;
    reward: number;
  } | null>(null);
  const [failedStreak, setFailedStreak] = useState(false);
  const [repairPromptOpen, setRepairPromptOpen] = useState(false);
  // Bumped after the notification permission prompt so the reminder resyncs.
  const [reminderNonce, setReminderNonce] = useState(0);

  // Swipeable pages + bottom tab bar. The tracker (focus) tab is the default.
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('focus');

  const scrollToTab = useCallback((key: TabKey, smooth = true) => {
    const el = carouselRef.current;
    if (!el) return;
    const idx = TAB_KEYS.indexOf(key);
    el.scrollTo({
      left: idx * el.clientWidth,
      behavior: smooth ? 'smooth' : 'auto',
    });
    setActiveTab(key);
  }, []);

  // Land on the tracker without a swipe animation on first paint. IonContent
  // sizes and settles its scrollable area asynchronously, and the browser's
  // initial scroll-snap can yank the position back to 0 — so keep correcting
  // every frame until the layout has settled (a few hundred ms is plenty).
  useLayoutEffect(() => {
    let raf = 0;
    let checks = 0;
    const tick = () => {
      const el = carouselRef.current;
      if (el && el.clientWidth > 0 && el.scrollLeft < el.clientWidth - 1) {
        scrollToTab('focus', false);
      }
      checks += 1;
      if (checks < 20) raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [scrollToTab]);

  useEffect(() => {
    const alignActivePage = () => scrollToTab(activeTab, false);
    window.addEventListener('resize', alignActivePage);
    return () => window.removeEventListener('resize', alignActivePage);
  }, [activeTab, scrollToTab]);

  const onCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el || el.clientWidth === 0) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    const key = TAB_KEYS[Math.max(0, Math.min(TAB_KEYS.length - 1, idx))];
    if (key !== activeTab) setActiveTab(key);
  };

  // The Viewport Segments API identifies a fold or hinge when the browser
  // exposes one. Drive layout from its live rectangles, with normal responsive
  // layout as the fallback on browsers that do not expose viewport segments.
  useLayoutEffect(() => {
    type SegmentWindow = Window & {
      viewport?: {
        segments?: Array<{ left: number; top: number; width: number; height: number }>;
      };
    };

    const root = document.documentElement;
    const clearFoldLayout = () => {
      delete root.dataset.foldMode;
      root.style.removeProperty('--fold-first-size');
      root.style.removeProperty('--fold-hinge-size');
      root.style.removeProperty('--fold-second-size');
    };
    const syncFoldLayout = () => {
      const segments = (window as SegmentWindow).viewport?.segments ?? [];
      if (segments.length !== 2) {
        clearFoldLayout();
        return;
      }

      const [first, second] = segments;
      if (Math.abs(first.top - second.top) < 1 && second.left > first.left) {
        root.dataset.foldMode = 'book';
        root.style.setProperty('--fold-first-size', `${first.width}px`);
        root.style.setProperty(
          '--fold-hinge-size',
          `${Math.max(0, second.left - (first.left + first.width))}px`,
        );
        root.style.setProperty('--fold-second-size', `${second.width}px`);
      } else if (Math.abs(first.left - second.left) < 1 && second.top > first.top) {
        root.dataset.foldMode = 'tabletop';
        root.style.setProperty('--fold-first-size', `${first.height}px`);
        root.style.setProperty(
          '--fold-hinge-size',
          `${Math.max(0, second.top - (first.top + first.height))}px`,
        );
        root.style.setProperty('--fold-second-size', `${second.height}px`);
      } else {
        clearFoldLayout();
      }
    };

    syncFoldLayout();
    window.addEventListener('resize', syncFoldLayout);
    window.visualViewport?.addEventListener('resize', syncFoldLayout);
    return () => {
      window.removeEventListener('resize', syncFoldLayout);
      window.visualViewport?.removeEventListener('resize', syncFoldLayout);
      clearFoldLayout();
    };
  }, []);

  // Refs so the mount-once listeners always see the latest state.
  const phaseRef = useRef<Phase>('idle');
  const sessionStartMonotonicRef = useRef(0);
  const lastTouchHandledAtRef = useRef(0);
  const motionHitsRef = useRef(0);
  const successHandledRef = useRef(false);
  const popTimerRef = useRef(0);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (consumeInterruptedSession()) {
      phaseRef.current = 'failed';
      setFailReason('interrupted');
      setPhase('failed');
      // A reload is an abandoned session too: it counts as today's attempt,
      // exactly like a touch failure (no streak banking by reloading).
      const failed = recordFailedAttempt(gameRef.current);
      update(() => failed.state);
      setFailedStreak(failed.lostStreak);
    }
  }, [gameRef, update]);

  useEffect(() => () => window.clearTimeout(popTimerRef.current), []);

  // A session can only end by failing or completing — make sure the user is
  // looking at the tracker when that happens (a swipe mid-session may have
  // carried them to another tab before the touch registered as a fail).
  useEffect(() => {
    if (phase === 'failed' || phase === 'done') scrollToTab('focus');
  }, [phase, scrollToTab]);

  // Resolve System mode before paint, follow OS changes, and keep browser and
  // native chrome aligned with the selected appearance and accent theme.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const appearance =
        game.appearanceMode === 'system'
          ? media.matches ? 'dark' : 'light'
          : game.appearanceMode;
      root.dataset.theme = game.activeTheme;
      root.dataset.appearance = appearance;
      syncStatusBar(appearance);
      document
        .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
        ?.setAttribute('content', appearance === 'dark' ? '#08172A' : '#0EA5E9');
    };

    apply();
    if (game.appearanceMode !== 'system') return;
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [game.activeTheme, game.appearanceMode]);

  // Keep exactly one gentle evening reminder scheduled for the current streak
  // (native only). Re-run whenever something that changes the plan changes.
  useEffect(() => {
    void syncStreakReminder(gameRef.current, petName);
  }, [
    game.lastFocusDate,
    game.currentStreak,
    game.streakFreezes,
    game.dailyProgressDate,
    petName,
    reminderNonce,
    gameRef,
  ]);

  const failSession = useCallback(
    (reason: FailReason) => {
      if (phaseRef.current !== 'running') return;
      const sessionMs = performance.now() - sessionStartMonotonicRef.current;
      // The deadline may pass between timer ticks. A touch after the goal is a
      // completion, not a failure; leave the pending tick to finalize it.
      if (sessionMs >= duration * 1000) return;
      // Close the session synchronously. Pointer, touch, and native-touch can
      // arrive before React commits the failed phase.
      phaseRef.current = 'failed';
      clearSessionRunning();
      // Temptation tax: even a failed session pays a small consolation based on
      // how long you resisted, but far less than completing it would have.
      const seconds = Math.floor(sessionMs / 1000);
      const { state, reward } = awardFailConsolation(gameRef.current, seconds);
      // Failing still uses up the day: the streak cannot be banked for free
      // by giving up on purpose and trying again tomorrow.
      const failed = recordFailedAttempt(state);
      update(() => failed.state);
      setFailedStreak(failed.lostStreak);
      setFailResult({ seconds, reward });
      setFailReason(reason);
      setPhase('failed');
      // A swipe/tab tap during a session fails it — bring the user back to the
      // tracker so they actually see the failure.
      scrollToTab('focus');
      playFailSound();
      hapticFail();
    },
    [duration, gameRef, update, scrollToTab],
  );

  // --- Touch detection (works on Android, iOS, and browser) ---
  useEffect(() => {
    const onTouch = () => {
      // The START tap fires before the session begins. Do not let it suppress
      // an actual touch immediately after START via the deduplication window.
      if (phaseRef.current !== 'running') return;
      const now = Date.now();
      // The same physical touch can fire pointerdown, touchstart, and the
      // native event within a few ms — only count it once.
      if (now - lastTouchHandledAtRef.current < 150) return;
      lastTouchHandledAtRef.current = now;
      failSession('touch');
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') failSession('left');
    };
    window.addEventListener('pointerdown', onTouch);
    window.addEventListener('touchstart', onTouch);
    window.addEventListener('native-touch', onTouch); // fired by native Android
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('pointerdown', onTouch);
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('native-touch', onTouch);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [failSession]);

  useEffect(() => {
    let disposed = false;
    let removeListener: (() => Promise<void>) | undefined;
    void App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) failSession('left');
    }).then(handle => {
      if (disposed) void handle.remove();
      else removeListener = () => handle.remove();
    });
    return () => {
      disposed = true;
      if (removeListener) void removeListener();
    };
  }, [failSession]);

  // --- Android hardware back ---
  // Without a handler the hardware back button closes the app from any screen,
  // which reads as a crash three taps deep in Rewards. Return to the default tab
  // first; leave the app only from there.
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;
    let disposed = false;
    let removeListener: (() => Promise<void>) | undefined;
    void App.addListener('backButton', () => {
      // Back should unwind the most local UI first, then return from secondary
      // tabs to Focus, and only then leave the app. Using scrollToTab keeps the
      // visible page and selected tab in sync while the carousel settles.
      if (repairPromptOpen) {
        setRepairPromptOpen(false);
        return;
      }
      if (customOpen) {
        setCustomOpen(false);
        return;
      }
      if (activeTab !== 'focus') {
        scrollToTab('focus');
        return;
      }
      void App.exitApp();
    }).then(handle => {
      if (disposed) void handle.remove();
      else removeListener = () => handle.remove();
    });
    return () => {
      disposed = true;
      if (removeListener) void removeListener();
    };
  }, [activeTab, customOpen, repairPromptOpen, scrollToTab]);

  // --- Movement detection (DeviceMotion API / accelerometer + gyroscope) ---
  // Fires natively in Android WebView; on iOS it only starts after the user
  // grants motion permission (requested from the START button tap).
  useEffect(() => {
    const onDeviceMotion = (e: DeviceMotionEvent) => {
      if (phaseRef.current !== 'running') {
        motionHitsRef.current = 0;
        return;
      }
      // Prefer linear acceleration (gravity removed); fall back to raw
      // acceleration minus the ~9.8 m/s² gravity magnitude.
      const acc = e.acceleration;
      const accInc = e.accelerationIncludingGravity;
      let mag = 0;
      if (acc) mag = Math.hypot(acc.x ?? 0, acc.y ?? 0, acc.z ?? 0);
      else if (accInc)
        mag = Math.abs(Math.hypot(accInc.x ?? 0, accInc.y ?? 0, accInc.z ?? 0) - 9.8);
      if (mag < MOTION_THRESHOLD) {
        motionHitsRef.current = 0;
        return;
      }
      // Ignore the jostle caused by the START tap itself.
      if (performance.now() - sessionStartMonotonicRef.current < MOTION_GRACE_MS) return;
      motionHitsRef.current += 1;
      if (motionHitsRef.current >= MOTION_CONSECUTIVE) {
        motionHitsRef.current = 0;
        failSession('moved');
      }
    };
    window.addEventListener('devicemotion', onDeviceMotion);
    return () => window.removeEventListener('devicemotion', onDeviceMotion);
  }, [failSession]);

  // iOS (13+) requires an explicit permission prompt for motion data, and it
  // must be requested from a user gesture — the START button tap is one.
  const requestMotionPermission = useCallback(() => {
    const DM = window.DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<string>;
    } | undefined;
    if (DM && typeof DM.requestPermission === 'function') {
      DM.requestPermission()
        .then(() => {
          // Granted — accelerometer events now flow into devicemotion.
        })
        .catch(() => {
          // Denied or unavailable — touch detection still works.
        });
    }
  }, []);

  const completeSession = useCallback(() => {
    if (phaseRef.current !== 'running' || successHandledRef.current) return;
    successHandledRef.current = true;
    phaseRef.current = 'done';
    clearSessionRunning();
    playSuccessSound();
    hapticSuccess();
    const { state, result } = recordSession(gameRef.current, duration);
    update(() => state);
    setLastCoinsEarned(result.coinsEarned);
    setLastFreezeUsed(result.freezeUsed);
    setLastWeekendBonus(result.weekendBonus);
    setLastNewRecord(result.newRecord);
    setLastNewPets(result.newPets);
    if (result.newRecord || result.newPets.length > 0) {
      playCelebrationSound();
      hapticCelebration();
    }
    void requestReminderPermission().then(() => setReminderNonce(n => n + 1));
    setPhase('done');
  }, [duration, gameRef, update]);

  // Custom duration: clamp to 10s – 4h, then keep the previous goal if invalid.
  const applyCustom = () => {
    setCustomOpen(false);
    const total = clampCustomDuration(
      parseInt(customMin || '0', 10),
      parseInt(customSec || '0', 10),
    );
    if (total === null) return;
    setDuration(total);
    // Reflect the clamped goal back into the editor (e.g. 240:59 -> 240:00).
    setCustomMin(String(Math.floor(total / 60)));
    setCustomSec(String(total % 60));
  };

  const start = () => {
    markSessionRunning();
    setFailResult(null);
    setFailedStreak(false);
    lastTouchHandledAtRef.current = 0;
    sessionStartMonotonicRef.current = performance.now();
    phaseRef.current = 'running';
    setPhase('running');
    nativeImpactHaptic(ImpactStyle.Light);
    successHandledRef.current = false;
    requestMotionPermission();
    // Create/resume the AudioContext from this user gesture so iOS allows
    // audio playback when the session ends later.
    getAudioContext();
  };

  const reset = () => {
    phaseRef.current = 'idle';
    setPhase('idle');
  };

  const showPop = (text: string, icon: IconName = 'coin') => {
    window.clearTimeout(popTimerRef.current);
    setPopText({ text, icon });
    popTimerRef.current = window.setTimeout(() => setPopText(null), 1400);
  };

  const collectBubble = () => {
    const { state, reward } = claimDailyBonus(gameRef.current);
    if (reward === 0) return;
    update(() => state);
    showPop(`+${reward} coins`, 'coin');
    playCollectSound();
    hapticCollect();
  };

  const claimGoal = () => {
    const { state, reward } = claimDailyGoal(gameRef.current);
    if (reward === 0) return;
    update(() => state);
    showPop(`+${reward} coins`, 'coin');
    playCollectSound();
    hapticCollect();
  };

  const claimDay = (day: number) => {
    const { state, reward } = claimDayReward(gameRef.current, day);
    if (reward === 0) return;
    update(() => state);
    showPop(`Day ${day} reward +${reward} coins`, 'calendar');
    playCollectSound();
    hapticCollect();
  };

  const repairStreakHandler = () => {
    const { state, repaired } = repairStreak(gameRef.current);
    if (!repaired) return false;
    update(() => state);
    showPop('Streak repaired', 'flame');
    playCollectSound();
    hapticCollect();
    return true;
  };

  // Starting a session in the repair window would silently restart the
  // streak at Day 1, so offer the repair first.
  const onStartPressed = () => {
    if (canRepairStreak(gameRef.current)) {
      setRepairPromptOpen(true);
      return;
    }
    start();
  };

  const repairAndStart = () => {
    setRepairPromptOpen(false);
    if (repairStreakHandler()) start();
  };

  const startWithoutRepair = () => {
    setRepairPromptOpen(false);
    start();
  };

  const equipMascotHandler = (id: MascotId) => {
    const { state, ok } = equipMascot(gameRef.current, id);
    if (!ok) return;
    update(() => state);
    showPop(`${MASCOT_CATALOG.find(m => m.id === id)?.name ?? 'Your pet'} is with you now`, 'paw');
    hapticCollect();
  };

  const buyAccessoryHandler = (id: AccessoryId) => {
    const { state, ok } = buyAccessory(gameRef.current, id);
    if (!ok) return;
    update(() => state);
    showPop('Accessory unlocked', 'ribbon');
    playCollectSound();
    hapticCollect();
  };

  const equipAccessoryHandler = (id: AccessoryId | null) => {
    const { state, ok } = equipAccessory(gameRef.current, id);
    if (!ok) return;
    update(() => state);
    showPop(id ? 'Accessory worn' : 'Accessory removed');
    hapticCollect();
  };

  const buyFreezeHandler = () => {
    const { state, ok } = buyStreakFreeze(gameRef.current);
    if (!ok) return;
    update(() => state);
    showPop('Streak freeze added', 'freeze');
    playCollectSound();
    hapticCollect();
  };

  const buyThemeHandler = (id: ThemeId) => {
    const { state, ok } = buyTheme(gameRef.current, id);
    if (!ok) return;
    update(() => state);
    showPop('Theme unlocked', 'palette');
    playCollectSound();
    hapticCollect();
  };

  const equipThemeHandler = (id: ThemeId) => {
    const { state, ok } = equipTheme(gameRef.current, id);
    if (!ok) return;
    update(() => state);
    showPop('Theme applied');
    hapticCollect();
  };

  const buyPetSceneHandler = (id: PetSceneId) => {
    const { state, ok } = buyPetScene(gameRef.current, id);
    if (!ok) return;
    update(() => state);
    showPop('Pet scene unlocked', 'sparkle');
    playCollectSound();
    hapticCollect();
  };

  const equipPetSceneHandler = (id: PetSceneId) => {
    const { state, ok } = equipPetScene(gameRef.current, id);
    if (!ok) return;
    update(() => state);
    showPop('Pet scene applied', 'sparkle');
    hapticCollect();
  };

  const setAppearanceModeHandler = (mode: AppearanceMode) => {
    const state = setAppearanceMode(gameRef.current, mode);
    if (state === gameRef.current) return;
    update(() => state);
    nativeSelectionHaptic();
  };

  // Engine rule — the card, the completion message, the badge, and the payout
  // all read the same helper, so they cannot disagree.
  const goal = dailyGoalStatus(game);
  const dailyGoalReached = goal.claimable;
  // The engine's dailyBonusDate is the only record of whether today's gift is
  // still unclaimed; a second `bubblePopped` flag could drift out of sync.
  const bonusAvailable =
    game.dailyBonusDate === null ||
    daysBetween(game.dailyBonusDate, todayKey()) > 0;
  const weekend = isWeekend();
  // Engine rule — the strip, the badge, and the claim all agree.
  const claimableDay = claimableCheckinDay(game);
  const checkedInToday = game.lastCheckinDate === todayKey();
  const streakCheckinProgress = checkinProgress(game);
  const rewardsBadge = claimableDay !== null || dailyGoalReached || bonusAvailable;

  return (
    <IonContent
      fullscreen
      data-theme={game.activeTheme}
      style={{ '--background': 'transparent' }}
    >
      <div
        data-theme={game.activeTheme}
        className="guide-app relative flex h-full w-full flex-col bg-gradient-to-b from-sky-100 via-sky-50 to-white md:flex-row"
      >
        {/* reward toast (floats above whatever page is visible) */}
        {popText && (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute inset-x-0 top-3 z-30 flex justify-center"
          >
            <span className="flex animate-bounce items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-600 shadow-sm">
              <Icon name={popText.icon} size={14} tone="inherit" />
              {popText.text}
            </span>
          </div>
        )}

        {/* repair-before-start prompt (only in the one-day repair window) */}
        {repairPromptOpen && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-6">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="repair-prompt-title"
              className="guide-panel w-full max-w-sm rounded-3xl bg-white p-5 text-center shadow-xl"
            >
              <Mascot
                mood="idle"
                variant={game.activeMascot}
                accessory={game.equippedAccessory}
                scene={game.equippedPetScene}
                className="mx-auto mb-3 h-20 w-20"
              />
              <h2 id="repair-prompt-title" className="flex items-center justify-center gap-1.5 text-lg font-black text-slate-900">
                {petName} missed you yesterday
                <Icon name="paw" size={16} className="text-slate-400" />
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Repair your {game.currentStreak}-day streak before you start?
                Otherwise it begins again from Day 1.
              </p>
              <button
                onClick={repairAndStart}
                disabled={game.coins < STREAK_REPAIR_COST}
                className={`mt-5 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-2xl py-3 text-sm font-bold transition-transform active:scale-95 ${
                  game.coins >= STREAK_REPAIR_COST
                    ? 'bg-gradient-to-r from-amber-800 to-amber-700 text-white shadow-md shadow-amber-700/30'
                    : 'cursor-not-allowed bg-slate-100 text-slate-400'
                }`}
              >
                {game.coins >= STREAK_REPAIR_COST ? (
                  <>
                    Repair for <span className="tabular-nums">{STREAK_REPAIR_COST}</span>
                    <Icon name="coin" size={14} /> &amp; start
                  </>
                ) : (
                  <>
                    Repair needs <span className="tabular-nums">{STREAK_REPAIR_COST}</span>
                    <Icon name="coin" size={14} /> (you have {game.coins})
                  </>
                )}
              </button>
              <button
                onClick={startWithoutRepair}
                className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 transition-transform active:scale-95"
              >
                Start a new streak
              </button>
              <button
                onClick={() => setRepairPromptOpen(false)}
                className="mt-2 flex min-h-11 w-full items-center justify-center py-2 text-xs font-bold text-slate-500"
              >
                Not now
              </button>
            </div>
          </div>
        )}

        {/* swipeable pages: Home | Focus (primary) | Rewards */}
        <div
          ref={carouselRef}
          onScroll={onCarouselScroll}
          className={`guide-carousel no-scrollbar flex flex-1 snap-x snap-mandatory md:order-last md:min-w-0 md:snap-none ${
            phase === 'idle' ? 'overflow-x-auto' : 'overflow-x-hidden'
          }`}
        >
          <HomePage
            streak={activeStreak(game)}
            bestStreak={game.bestStreak}
            nextPet={nextPet}
            ownedPetCount={game.ownedMascots.length}
            week={recentFocusDays(game, 7)}
            coins={game.coins}
            minutesToday={goal.minutes}
            dailyGoalClaimed={goal.claimed}
            shields={game.streakFreezes}
            repairableStreak={canRepairStreak(game) ? game.currentStreak : 0}
            canBuyShield={canBuyStreakFreeze(game)}
            mascot={game.activeMascot}
            accessory={game.equippedAccessory}
            petScene={game.equippedPetScene}
            petName={petName}
            totalSessions={game.totalSessions}
            focusSeconds={game.focusSeconds}
            onRepair={repairStreakHandler}
            onBuyShield={buyFreezeHandler}
            onOpenRewards={() => {
              if (activeTab !== 'rewards') nativeSelectionHaptic();
              scrollToTab('rewards');
            }}
          />

          {/* Focus page — the tracker, the priority */}
          <div className="flex h-full w-full shrink-0 snap-start flex-col overflow-y-auto">
            <div className="my-auto mx-auto w-full max-w-md px-4 pt-[max(1.5rem,var(--safe-area-top))] pb-[max(1.5rem,var(--safe-area-bottom))] pl-[max(1rem,var(--safe-area-left))] pr-[max(1rem,var(--safe-area-right))] sm:px-6 md:max-w-lg lg:max-w-2xl">
              {phase === 'idle' && (
                <div className="focus-state-enter">
                  <header className="mb-3 flex items-center justify-between gap-2.5">
                  <h1 className="text-2xl font-black tracking-tight text-slate-900">
                    Focus
                  </h1>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="flex min-h-9 items-center gap-1 rounded-full border border-amber-200 bg-white/80 px-2.5 text-[11px] font-bold text-amber-600">
                      <Icon name="flame" size={13} />
                      {activeStreak(game)} day{activeStreak(game) === 1 ? '' : 's'}
                    </span>
                    <span className="flex min-h-9 items-center gap-1 rounded-full border border-sky-100 bg-white/80 px-2.5 text-[11px] font-bold tabular-nums text-brand-700">
                      <Icon name="coin" size={13} />
                      {game.coins}
                    </span>
                  </div>
                  </header>

                  {/* tracker hero card */}
                  <div className="focus-setup-panel rounded-[28px] p-4 sm:p-5">
                    <div className="grid grid-cols-[minmax(0,1fr)_9.5rem] items-center gap-1">
                      <h2 className="max-w-[12rem] text-3xl font-black leading-tight tracking-tight text-slate-900">
                        How long?
                      </h2>
                      <div className="guide-pet-stage relative mx-auto flex h-[9.5rem] w-[9.5rem] items-center justify-center">
                        <Mascot
                          mood="idle"
                          variant={game.activeMascot}
                          accessory={game.equippedAccessory}
                          scene={game.equippedPetScene}
                          className="guide-pet-float relative z-10 h-[9.5rem] w-[9.5rem]"
                        />
                        <Icon
                          name="sparkle"
                          size={13}
                          className="absolute right-3 top-4 z-10 text-sky-500"
                          aria-hidden="true"
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {DURATIONS.map(d => {
                        const selected = duration === d.seconds;
                        return (
                          <button
                            key={d.seconds}
                            aria-pressed={selected}
                            onClick={() => {
                              if (!selected) nativeSelectionHaptic();
                              setDuration(d.seconds);
                              setCustomOpen(false);
                            }}
                            className={`focus-duration-choice flex min-h-14 items-center gap-2 rounded-2xl border px-2.5 py-2 text-sm font-bold transition-[background-color,border-color,color,box-shadow,transform] duration-200 active:scale-[0.97] ${
                              selected
                                ? 'border-brand-400 bg-brand-50 text-brand-800 shadow-sm ring-1 ring-brand-100'
                                : 'border-sky-100 bg-white/70 text-slate-700'
                            }`}
                          >
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${selected ? 'bg-brand-600 text-white' : 'bg-sky-100 text-brand-700'}`}>
                              <Icon name="timer" size={15} tone="inherit" />
                            </span>
                            <span className="min-w-0 flex-1">{d.label}</span>
                            {selected && <Icon name="check" size={14} tone="inherit" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* custom duration */}
                    {customOpen ? (
                      <div className="mt-2 rounded-xl border border-brand-200 bg-brand-50 p-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={240}
                            inputMode="numeric"
                            aria-label="Minutes"
                            enterKeyHint="done"
                            placeholder="min"
                            value={customMin}
                            onChange={e => setCustomMin(e.target.value)}
                            className="min-h-11 w-16 rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm font-bold text-slate-800 focus:border-brand-400 focus:outline-none"
                          />
                          <span className="text-sm font-black text-slate-500">:</span>
                          <input
                            type="number"
                            min={0}
                            max={59}
                            inputMode="numeric"
                            aria-label="Seconds"
                            enterKeyHint="done"
                            placeholder="sec"
                            value={customSec}
                            onChange={e => setCustomSec(e.target.value)}
                            className="min-h-11 w-16 rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm font-bold text-slate-800 focus:border-brand-400 focus:outline-none"
                          />
                          <button
                            onClick={applyCustom}
                            className="flex-1 min-h-11 rounded-lg bg-brand-700 py-2 text-xs font-bold text-white transition-transform active:scale-95"
                          >
                            Set
                          </button>
                          <button
                            onClick={() => setCustomOpen(false)}
                            aria-label="Cancel custom duration"
                            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-500 active:scale-95"
                          >
                            <Icon name="close" size={14} />
                          </button>
                        </div>
                        <p className="mt-1.5 text-[10px] font-semibold text-slate-400">
                          10 sec–4 h · coins per 10 sec
                        </p>
                      </div>
                    ) : (
                        <button
                        onClick={() => {
                          setCustomOpen(true);
                          // Pre-fill the editor from the active custom goal.
                          if (!DURATIONS.some(d => d.seconds === duration)) {
                            setCustomMin(String(Math.floor(duration / 60)));
                            setCustomSec(String(duration % 60));
                          }
                        }}
                        className={`mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed px-3 py-2.5 text-sm font-semibold transition-[background-color,border-color,color,transform] active:scale-[0.99] ${
                          !DURATIONS.some(d => d.seconds === duration)
                            ? 'border-brand-400 bg-brand-50 text-brand-600'
                            : 'border-slate-300 bg-white/60 text-slate-500 active:scale-[0.99]'
                        }`}
                      >
                        <Icon name="timer" size={14} className="shrink-0" />
                        {!DURATIONS.some(d => d.seconds === duration)
                          ? `Custom · ${formatDurationLabel(duration)}`
                          : 'Custom duration'}
                      </button>
                    )}

                    <button
                      onClick={onStartPressed}
                      className="guide-primary-cta mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 py-3.5 text-lg font-bold text-white shadow-lg shadow-brand-600/25 transition-transform active:scale-[0.98]"
                    >
                      Start focus
                      <Icon name="chevronRight" size={18} tone="inherit" />
                    </button>
                  </div>
                </div>
              )}

              {phase === 'running' && (
                <div className="guide-state-panel focus-state-enter text-center">
                  <FocusSessionTimer
                    duration={duration}
                    startedAt={sessionStartMonotonicRef.current}
                    onComplete={completeSession}
                  />

                  <Mascot
                    mood="running"
                    variant={game.activeMascot}
                    accessory={game.equippedAccessory}
                    scene={game.equippedPetScene}
                    className="mx-auto -mt-1 h-24 w-24"
                  />
                  <p className="mx-auto mt-3 max-w-xs text-sm font-semibold text-slate-600">
                    Keep your phone still until the timer ends.
                  </p>
                </div>
              )}

              {phase === 'failed' && (
                <div className="guide-state-panel focus-state-enter text-center" role="alert">
                  <Mascot
                    mood="sad"
                    variant={game.activeMascot}
                    accessory={game.equippedAccessory}
                    scene={game.equippedPetScene}
                    className="mx-auto mb-6 h-28 w-28"
                  />
                  <h2 className="select-none text-4xl font-black leading-tight text-amber-500">
                    That&apos;s okay!
                  </h2>
                  <p className="mt-6 text-xl font-bold text-slate-700">
                    {failReason === 'touch'
                      ? `A tap woke ${petName} up.`
                      : failReason === 'moved'
                        ? `A bump woke ${petName} up.`
                        : failReason === 'interrupted'
                          ? 'The app closed during your session.'
                        : `${petName} noticed you left the app.`}
                  </p>
                  {failReason === 'interrupted' && (
                    <p className="mt-2 text-sm text-slate-500">
                      Sessions stop when the app restarts.
                    </p>
                  )}
                  {failedStreak && (
                    <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                      Your streak paused here. {petName} will be waiting
                      tomorrow — a short session restarts it.
                    </p>
                  )}
                  {failResult && failResult.reward > 0 && (
                    <p className="mt-3 inline-block rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                      You focused for {failResult.seconds}s · +{failResult.reward} coins
                    </p>
                  )}
                  <button
                    onClick={reset}
                    className="guide-primary-cta mt-10 w-full rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 py-4 text-lg font-bold text-white shadow-lg shadow-brand-600/25 transition-transform active:scale-[0.98]"
                  >
                    Try again
                  </button>
                </div>
              )}

              {phase === 'done' && (
                <div className="guide-state-panel focus-state-enter relative rounded-[28px] border border-sky-100 bg-white p-5 text-center shadow-sm sm:p-6" role="status" aria-live="polite">
                  {(lastNewRecord || lastNewPets.length > 0) && <ConfettiBurst />}
                  <Mascot
                    mood="happy"
                    variant={game.activeMascot}
                    accessory={game.equippedAccessory}
                    scene={game.equippedPetScene}
                    className="mx-auto mb-3 h-36 w-36"
                  />
                  <h2 className="flex items-center justify-center gap-2 text-3xl font-black tracking-tight text-brand-700">
                    You did it!
                    <Icon name="sparkle" size={22} />
                  </h2>
                  <dl className="mt-5 grid grid-cols-3 divide-x divide-sky-100 rounded-2xl bg-sky-50/70 py-3">
                    <div className="px-1.5">
                      <dd className="text-base font-black tabular-nums text-slate-900">{formatTime(duration)}</dd>
                      <dt className="mt-1 text-[10px] font-bold text-slate-500">Focused</dt>
                    </div>
                    <div className="px-1.5">
                      <dd className="flex items-center justify-center gap-1 text-base font-black tabular-nums text-brand-700">
                        +{lastCoinsEarned}<Icon name="coin" size={12} />
                      </dd>
                      <dt className="mt-1 text-[10px] font-bold text-slate-500">Coins earned</dt>
                    </div>
                    <div className="px-1.5">
                      <dd className="text-base font-black tabular-nums text-slate-900">{activeStreak(game)}d</dd>
                      <dt className="mt-1 text-[10px] font-bold text-slate-500">Streak</dt>
                    </div>
                  </dl>
                  {lastFreezeUsed > 0 && (
                    <p className="mt-1 text-xs font-black text-sky-700">
                      Freeze saved your streak!
                    </p>
                  )}
                  {lastWeekendBonus && (
                    <p className="mt-1 text-xs font-black text-fuchsia-600">
                      2× Weekend double points!
                    </p>
                  )}
                  {lastNewRecord && (
                    <p className="mt-1 text-xs font-black text-amber-600">
                      New longest session! +{RECORD_BONUS} coins
                    </p>
                  )}
                  {/* `dailyGoalReached` means claimable, so this never promises
                      coins that are already banked or not yet earned. */}
                  {dailyGoalReached && (
                    <p className="mt-1 text-xs font-semibold text-brand-700">
                      Daily goal reached! Claim +{DAILY_GOAL_REWARD} coins on the
                      Rewards tab
                    </p>
                  )}

                  {/* new friends met this session */}
                  {lastNewPets.length > 0 ? (
                    <div className="guide-new-friend mt-5 rounded-2xl border border-sky-200 p-3">
                      <p className="text-xs font-black text-brand-700">
                        New friend{lastNewPets.length === 1 ? '' : 's'} met!
                      </p>
                      <div className="mt-2 flex flex-wrap justify-center gap-3">
                        {lastNewPets.map(id => {
                          const pet = MASCOT_CATALOG.find(p => p.id === id);
                          return (
                            <div key={id} className="flex w-20 flex-col items-center">
                              <Mascot mood="happy" variant={id} still className="h-14 w-14" />
                              <p className="mt-1 text-[11px] font-black text-slate-700">{pet?.name}</p>
                              {game.activeMascot !== id && (
                                <button
                                  onClick={() => equipMascotHandler(id)}
                                  className="guide-new-friend-action mt-1 flex min-h-11 items-center justify-center rounded-xl border border-brand-300 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wide text-brand-700 transition-transform active:scale-[0.98]"
                                >
                                  Focus together
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : nextPet ? (
                    <p className="mt-4 text-xs font-semibold text-slate-500">
                      Next friend: <span className="font-black text-slate-700">{nextPet.name}</span>
                      {' · '}
                      {petRemainingText(game, nextPet)}
                    </p>
                  ) : null}
                  <button
                    onClick={reset}
                    className="guide-success-cta mt-8 min-h-12 w-full rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 py-3.5 text-base font-bold text-white shadow-md shadow-brand-600/20 transition-transform active:scale-[0.98]"
                  >
                    Finish
                  </button>
                </div>
              )}
            </div>
          </div>

          <RewardsPage
            coins={game.coins}
            currentStreak={activeStreak(game)}
            minutesToday={goal.minutes}
            dailyGoalReached={dailyGoalReached}
            dailyGoalClaimed={goal.claimed}
            ownedMascots={game.ownedMascots}
            activeMascot={game.activeMascot}
            ownedAccessories={game.ownedAccessories}
            equippedAccessory={game.equippedAccessory}
            ownedThemes={game.ownedThemes}
            activeTheme={game.activeTheme}
            ownedPetScenes={game.ownedPetScenes}
            equippedPetScene={game.equippedPetScene}
            appearanceMode={game.appearanceMode}
            longestSession={game.longestSession}
            bestStreak={game.bestStreak}
            jackpots={game.jackpots}
            totalSessions={game.totalSessions}
            focusSeconds={game.focusSeconds}
            claimableDay={claimableDay}
            checkinProgress={streakCheckinProgress}
            checkedInToday={checkedInToday}
            bonusAvailable={bonusAvailable}
            bonusValue={dailyBonusValue()}
            onCollectBonus={collectBubble}
            onClaimGoal={claimGoal}
            onClaimDay={claimDay}
            onEquipMascot={equipMascotHandler}
            onBuyAccessory={buyAccessoryHandler}
            onEquipAccessory={equipAccessoryHandler}
            onBuyTheme={buyThemeHandler}
            onEquipTheme={equipThemeHandler}
            onBuyPetScene={buyPetSceneHandler}
            onEquipPetScene={equipPetSceneHandler}
            onSetAppearanceMode={setAppearanceModeHandler}
          />
        </div>

        {/* bottom navigation — locked while a session is in progress or shown */}
        <TabBar
          active={activeTab}
          onChange={scrollToTab}
          disabled={phase !== 'idle'}
          badges={{ rewards: rewardsBadge && activeTab !== 'rewards' }}
        />

        {/* occasional dev tip — Buy me a coffee (random, dismissible) */}
        <DevTip enabled={phase === 'idle'} />
      </div>
    </IonContent>
  );
};

export default FocusTracker;
