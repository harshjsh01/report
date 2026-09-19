/**
 * Theme Management Utility for GitPulse
 * Supports 'system' (default - follows OS dark/light mode), 'light', and 'dark'.
 */

const STORAGE_KEY = 'gitpulse-theme';

export function getStoredTheme() {
  if (typeof window === 'undefined') return 'system';
  return localStorage.getItem(STORAGE_KEY) || 'system';
}

export function getSystemPreference() {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getResolvedTheme(theme = getStoredTheme()) {
  if (theme === 'system') {
    return getSystemPreference();
  }
  return theme;
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  const resolved = getResolvedTheme(theme);
  const root = document.documentElement;

  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  root.setAttribute('data-theme', resolved);
}

export function setTheme(theme) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

export function setupSystemThemeListener(onThemeChange) {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e) => {
    const currentStored = getStoredTheme();
    if (currentStored === 'system') {
      applyTheme('system');
      if (onThemeChange) {
        onThemeChange(e.matches ? 'dark' : 'light');
      }
    }
  };

  mediaQuery.addEventListener('change', handler);
  return () => mediaQuery.removeEventListener('change', handler);
}
