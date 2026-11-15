'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GameState,
  STORAGE_KEY,
  loadGameState,
  normalizeForToday,
  saveGameState,
} from './gameState';
import { backupGameState, readBackup } from './native';

const hasLocalSave = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
};

// React hook around the localStorage-backed gamification state. `game` is the
// current snapshot, `gameRef` always holds the latest one (safe to read from
// event handlers and intervals without re-subscribing), and `update` applies
// pure transitions from lib/gameState.
//
// On native builds every save is also mirrored to Preferences (see
// lib/native.ts) so progress survives the OS purging WebView storage.
export const useGameState = () => {
  const [hadLocalSave] = useState(hasLocalSave);
  const [game, setGame] = useState<GameState>(() =>
    normalizeForToday(loadGameState()),
  );
  const gameRef = useRef(game);
  gameRef.current = game;
  const initialRef = useRef(game);
  // Mirroring stays off until the restore check finishes: otherwise the fresh
  // default state would overwrite a good backup before we could read it.
  const backupReadyRef = useRef(false);

  const persist = useCallback((s: GameState) => {
    saveGameState(s);
    if (backupReadyRef.current) backupGameState(s);
  }, []);

  useEffect(() => {
    persist(game);
  }, [game, persist]);

  // Restore from the native backup when local storage was wiped.
  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      backupReadyRef.current = true;
      backupGameState(gameRef.current);
    };
    if (hadLocalSave) {
      finish();
      return;
    }
    void readBackup().then(raw => {
      if (cancelled) return;
      // Only adopt the backup if nothing has happened since launch.
      if (raw !== null && gameRef.current === initialRef.current) {
        try {
          localStorage.setItem(STORAGE_KEY, raw);
        } catch {
          // Storage unavailable — loadGameState falls back to defaults.
        }
        const restored = normalizeForToday(loadGameState());
        gameRef.current = restored;
        setGame(restored);
      }
      finish();
    });
    return () => {
      cancelled = true;
    };
  }, [hadLocalSave]);

  // Keep daily counters correct when the app remains open across midnight or
  // returns from the background on a new day.
  useEffect(() => {
    const refreshDay = () => {
      const prev = gameRef.current;
      const next = normalizeForToday(prev);
      if (
        prev.dailyProgressDate !== next.dailyProgressDate ||
        prev.currentStreak !== next.currentStreak ||
        prev.claimedDays !== next.claimedDays
      ) {
        gameRef.current = next;
        persist(next);
        setGame(next);
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshDay();
    };
    const id = window.setInterval(refreshDay, 60_000);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [persist]);

  // Another tab/window of the web build saved newer progress. Adopt it instead
  // of letting this tab's stale copy overwrite it on its next save (which
  // would silently roll back coins, streaks, and purchases).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.newValue === null) return;
      const next = normalizeForToday(loadGameState());
      gameRef.current = next;
      setGame(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = useCallback(
    (fn: (prev: GameState) => GameState) => {
      const next = fn(gameRef.current);
      gameRef.current = next;
      persist(next);
      setGame(next);
    },
    [persist],
  );

  return { game, gameRef, update };
};
