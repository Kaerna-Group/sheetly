/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { localStorageService } from '@shared/lib/storage/local-storage.service';

export type ThemeValue = 'dark' | 'light' | 'system';

type ThemeContextValue = {
  setTheme: (theme: ThemeValue) => void;
  theme: ThemeValue;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getEffectiveTheme(theme: ThemeValue): 'dark' | 'light' {
  if (theme === 'dark') return 'dark';
  if (theme === 'light') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeValue>(
    () => (localStorageService.get('theme') as ThemeValue | null) ?? 'system',
  );

  function setTheme(next: ThemeValue) {
    localStorageService.set('theme', next);
    setThemeState(next);
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', getEffectiveTheme(theme));

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const apply = () =>
        document.documentElement.setAttribute('data-theme', getEffectiveTheme('system'));
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [theme]);

  return <ThemeContext.Provider value={{ setTheme, theme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
