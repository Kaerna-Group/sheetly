import { useEffect } from 'react';

import { localStorageService } from '@shared/lib/storage/local-storage.service';

function getEffectiveTheme(theme: string): 'light' | 'dark' {
  if (theme === 'dark') return 'dark';
  if (theme === 'light') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useApplyTheme() {
  useEffect(() => {
    function apply() {
      const theme = localStorageService.get('theme') ?? 'system';
      document.documentElement.setAttribute('data-theme', getEffectiveTheme(theme));
    }

    apply();

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    window.addEventListener('sheetly:theme-change', apply);

    return () => {
      mq.removeEventListener('change', apply);
      window.removeEventListener('sheetly:theme-change', apply);
    };
  }, []);
}
