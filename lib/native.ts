// Native-only side effects: durable progress backup and the streak reminder.
// Every function is a safe no-op on the web build and never throws — the
// game must keep working if a plugin is missing or a permission is denied.
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { LocalNotifications } from '@capacitor/local-notifications';
import { STORAGE_KEY, streakReminderPlan, type GameState } from './gameState';

const isNative = (): boolean => Capacitor.isNativePlatform();

// --- Progress backup ---
// WebView localStorage can be purged by the OS (iOS under storage pressure,
// "clear cache" on Android). Preferences is native key-value storage
// (UserDefaults / SharedPreferences) that survives that, so every save is
// mirrored there and restored when localStorage comes back empty.
export const backupGameState = (s: GameState): void => {
  if (!isNative()) return;
  void Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(s) }).catch(() => {});
};

export const readBackup = async (): Promise<string | null> => {
  if (!isNative()) return null;
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    return value;
  } catch {
    return null;
  }
};

// --- Streak reminder ---
const REMINDER_ID = 1001;

// Ask once, at a moment that makes sense (right after a completed session).
export const requestReminderPermission = async (): Promise<void> => {
  if (!isNative()) return;
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display === 'prompt' || display === 'prompt-with-rationale') {
      await LocalNotifications.requestPermissions();
    }
  } catch {
    // Unsupported device — reminders simply stay off.
  }
};

// Replace any pending reminder with one matching the current state.
export const syncStreakReminder = async (s: GameState, petName: string): Promise<void> => {
  if (!isNative()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted') return;
    const plan = streakReminderPlan(s);
    if (!plan) return;
    const days = `${plan.streak}-day streak`;
    await LocalNotifications.schedule({
      notifications: [
        {
          id: REMINDER_ID,
          title: plan.kind === 'keep' ? `${petName} misses you 🐾` : `${petName} saved your spot 🐾`,
          body:
            plan.kind === 'keep'
              ? `Your ${days} is waiting. A short focus session together keeps it going!`
              : `You skipped yesterday, but your ${days} can still be repaired today.`,
          schedule: { at: plan.at, allowWhileIdle: true },
        },
      ],
    });
  } catch {
    // Scheduling failed (permission revoked mid-call, etc.) — not fatal.
  }
};
