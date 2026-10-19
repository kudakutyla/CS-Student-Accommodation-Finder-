'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';
const themeStorageKey = 'abode_theme';

function subscribeToThemeChanges(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener('abode-theme-change', onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener('abode-theme-change', onChange);
  };
}

function getThemeSnapshot(): Theme {
  return window.localStorage.getItem(themeStorageKey) === 'dark' ? 'dark' : 'light';
}

function getServerThemeSnapshot(): Theme {
  return 'light';
}

export function ThemeToggle({ inverted = false }: { inverted?: boolean }) {
  const theme = useSyncExternalStore(subscribeToThemeChanges, getThemeSnapshot, getServerThemeSnapshot);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function toggleTheme() {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(themeStorageKey, nextTheme);
    window.dispatchEvent(new Event('abode-theme-change'));
  }

  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition ${inverted ? 'border-white/20 text-white hover:bg-white/10' : 'border-[var(--beige)] text-[var(--charcoal)] hover:bg-[var(--cream)]'}`}
    >
      {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}
