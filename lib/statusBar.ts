import { StatusBar, Style } from '@capacitor/status-bar';

/**
 * Match native status-bar chrome to the active appearance and accent theme.
 * Android receives a matching background and icon contrast; iOS may ignore
 * the background call because the WebView draws below the status bar.
 *
 * Call it on app mount and whenever appearance or theme changes.
 */
export const syncStatusBar = (appearance: 'light' | 'dark' = 'light'): void => {
  if (typeof window === 'undefined') return;
  const root = document.querySelector<HTMLElement>('[data-theme]');
  if (!root) return;
  const color = appearance === 'dark'
    ? '#08172A'
    : (() => {
        const sky = getComputedStyle(root).getPropertyValue('--sky-100').trim();
        const channels = sky.split(/\s+/).map(Number);
        return channels.length === 3 && channels.every(Number.isFinite)
          ? `#${channels
              .map(channel => Math.max(0, Math.min(255, channel)).toString(16).padStart(2, '0'))
              .join('')}`
          : '#E0F2FE';
      })();
  // setBackgroundColor is Android-only; on iOS it rejects and is ignored.
  void StatusBar.setBackgroundColor({ color }).catch(() => {});
  void StatusBar.setStyle({ style: appearance === 'dark' ? Style.Light : Style.Dark }).catch(() => {});
};
