'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  root.style.colorScheme = theme;
  try {
    localStorage.setItem('theme', theme);
  } catch {
    /* ignore */
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTheme(readTheme());
    setReady(true);
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  }

  const dark = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={dark ? 'Modo claro' : 'Modo oscuro'}
      disabled={!ready}
    >
      {dark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 4.5a1 1 0 0 1 1 1V7a1 1 0 1 1-2 0V5.5a1 1 0 0 1 1-1Zm0 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.5-2.5a1 1 0 1 1 0-2H21a1 1 0 1 1 0 2h-1.5ZM3 13a1 1 0 1 1 0-2h1.5a1 1 0 1 1 0 2H3Zm14.95 5.45a1 1 0 0 1-1.4 1.4l-1.06-1.06a1 1 0 1 1 1.4-1.4l1.06 1.06ZM7.51 6.21a1 1 0 0 1-1.4 1.4L5.05 6.55a1 1 0 0 1 1.4-1.4l1.06 1.06Zm9.9-1.06a1 1 0 0 1 0 1.4l-1.06 1.06a1 1 0 1 1-1.4-1.4l1.06-1.06a1 1 0 0 1 1.4 0ZM7.51 17.79l-1.06 1.06a1 1 0 1 1-1.4-1.4l1.06-1.06a1 1 0 1 1 1.4 1.4ZM12 17a1 1 0 0 1 1 1v1.5a1 1 0 1 1-2 0V18a1 1 0 0 1 1-1Z"
          />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M14.3 3.1a1 1 0 0 1 1.05.14 8.5 8.5 0 1 1-10.4 10.4A1 1 0 0 1 6.5 12.3 6.5 6.5 0 0 0 14.2 4.1a1 1 0 0 1 .1-1Z"
          />
        </svg>
      )}
      <span className="theme-toggle-label">{dark ? 'Claro' : 'Oscuro'}</span>
    </button>
  );
}
