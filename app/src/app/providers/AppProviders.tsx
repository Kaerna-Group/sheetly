import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { GoogleAuthProvider } from '@features/google-auth';
import { useApplyTheme } from '@app/hooks/use-apply-theme';

type AppProvidersProps = {
  children: ReactNode;
};

function ThemeWiring() {
  useApplyTheme();
  return null;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <GoogleAuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ThemeWiring />
        {children}
      </BrowserRouter>
    </GoogleAuthProvider>
  );
}
